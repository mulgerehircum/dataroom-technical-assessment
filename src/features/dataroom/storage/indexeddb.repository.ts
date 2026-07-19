import { generateId } from "@/lib/ids";
import { FILES_STORE, FOLDERS_STORE } from "@/features/dataroom/model/constants";
import {
  validateFileUpload,
  validateItemName,
} from "@/features/dataroom/model/validation";
import { dedupeName } from "@/features/dataroom/utils/file-name";
import { getDescendantIds } from "@/features/dataroom/utils/folder-tree";
import {
  getDataRoomDB,
  ROOT_PARENT_KEY,
  type StoredFile,
  type StoredFolder,
} from "@/features/dataroom/storage/db";
import type { DataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type {
  DataRoomItem,
  FileEntity,
  FolderEntity,
  ItemId,
  SupportedFileMimeType,
} from "@/features/dataroom/model/types";

function toParentKey(parentId: ItemId | null): string {
  return parentId ?? ROOT_PARENT_KEY;
}

function fromParentKey(parentKey: string): ItemId | null {
  return parentKey === ROOT_PARENT_KEY ? null : parentKey;
}

function toFolderEntity(stored: StoredFolder): FolderEntity {
  return { ...stored, parentId: fromParentKey(stored.parentId) };
}

function toFileEntity(stored: StoredFile): FileEntity {
  return { ...stored, parentId: fromParentKey(stored.parentId) };
}

/** Folders before files, alphabetical within each group. */
function sortItems(items: DataRoomItem[]): DataRoomItem[] {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

async function getSiblingNames(
  db: Awaited<ReturnType<typeof getDataRoomDB>>,
  parentKey: string,
  excludeId?: ItemId,
): Promise<string[]> {
  const [folders, files] = await Promise.all([
    db.getAllFromIndex(FOLDERS_STORE, "byParentId", parentKey),
    db.getAllFromIndex(FILES_STORE, "byParentId", parentKey),
  ]);
  return [...folders, ...files]
    .filter((item) => item.id !== excludeId)
    .map((item) => item.name);
}

async function loadAllItems(
  db: Awaited<ReturnType<typeof getDataRoomDB>>,
): Promise<DataRoomItem[]> {
  const [folders, files] = await Promise.all([
    db.getAll(FOLDERS_STORE),
    db.getAll(FILES_STORE),
  ]);
  return [...folders.map(toFolderEntity), ...files.map(toFileEntity)];
}

export const indexedDBRepository: DataRoomRepository = {
  async listChildren(parentId) {
    const db = await getDataRoomDB();
    const parentKey = toParentKey(parentId);
    const [folders, files] = await Promise.all([
      db.getAllFromIndex(FOLDERS_STORE, "byParentId", parentKey),
      db.getAllFromIndex(FILES_STORE, "byParentId", parentKey),
    ]);
    return sortItems([
      ...folders.map(toFolderEntity),
      ...files.map(toFileEntity),
    ]);
  },

  async getFolder(id): Promise<FolderEntity | undefined> {
    const db = await getDataRoomDB();
    const stored = await db.get(FOLDERS_STORE, id);
    return stored ? toFolderEntity(stored) : undefined;
  },

  async createFolder(name, parentId): Promise<FolderEntity> {
    const trimmedName = name.trim();
    const validation = validateItemName(trimmedName);
    if (!validation.ok) throw new Error(validation.message);

    const db = await getDataRoomDB();
    const parentKey = toParentKey(parentId);
    const siblingNames = await getSiblingNames(db, parentKey);
    const now = Date.now();

    const stored: StoredFolder = {
      id: generateId(),
      type: "folder",
      name: dedupeName(trimmedName, siblingNames),
      parentId: parentKey,
      createdAt: now,
      updatedAt: now,
    };
    await db.put(FOLDERS_STORE, stored);
    return toFolderEntity(stored);
  },

  async renameFolder(id, name): Promise<void> {
    const trimmedName = name.trim();
    const validation = validateItemName(trimmedName);
    if (!validation.ok) throw new Error(validation.message);

    const db = await getDataRoomDB();
    const existing = await db.get(FOLDERS_STORE, id);
    if (!existing) throw new Error("Folder not found.");

    const siblingNames = await getSiblingNames(db, existing.parentId, id);
    await db.put(FOLDERS_STORE, {
      ...existing,
      name: dedupeName(trimmedName, siblingNames),
      updatedAt: Date.now(),
    });
  },

  async deleteFolder(id): Promise<void> {
    const db = await getDataRoomDB();
    const items = await loadAllItems(db);
    const idsToDelete = new Set([id, ...getDescendantIds(items, id)]);

    const tx = db.transaction([FOLDERS_STORE, FILES_STORE], "readwrite");
    await Promise.all([
      ...items
        .filter((item) => idsToDelete.has(item.id))
        .map((item) =>
          tx
            .objectStore(item.type === "folder" ? FOLDERS_STORE : FILES_STORE)
            .delete(item.id),
        ),
      tx.done,
    ]);
  },

  async createFile(file, parentId): Promise<FileEntity> {
    const validation = validateFileUpload(file);
    if (!validation.ok) throw new Error(validation.message);

    const db = await getDataRoomDB();
    const parentKey = toParentKey(parentId);
    const siblingNames = await getSiblingNames(db, parentKey);
    const now = Date.now();

    const stored: StoredFile = {
      id: generateId(),
      type: "file",
      name: dedupeName(file.name.trim(), siblingNames),
      parentId: parentKey,
      mimeType: file.type as SupportedFileMimeType,
      size: file.size,
      blob: file,
      createdAt: now,
      updatedAt: now,
    };
    await db.put(FILES_STORE, stored);
    return toFileEntity(stored);
  },

  async renameFile(id, name): Promise<void> {
    const trimmedName = name.trim();
    const validation = validateItemName(trimmedName);
    if (!validation.ok) throw new Error(validation.message);

    const db = await getDataRoomDB();
    const existing = await db.get(FILES_STORE, id);
    if (!existing) throw new Error("File not found.");

    const siblingNames = await getSiblingNames(db, existing.parentId, id);
    await db.put(FILES_STORE, {
      ...existing,
      name: dedupeName(trimmedName, siblingNames),
      updatedAt: Date.now(),
    });
  },

  async deleteFile(id): Promise<void> {
    const db = await getDataRoomDB();
    await db.delete(FILES_STORE, id);
  },
};
