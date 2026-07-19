import { generateId } from "@/lib/ids";
import { validateFileUpload, validateItemName } from "@/features/dataroom/model/validation";
import { dedupeName } from "@/features/dataroom/utils/file-name";
import { formatParentPath } from "@/features/dataroom/utils/folder-tree";
import type {
  CreateFileOptions,
  DataRoomRepository,
} from "@/features/dataroom/storage/dataroom.repository";
import type { DataRoomItem, FileEntity, FolderEntity, ItemId } from "@/features/dataroom/model/types";

/**
 * In-memory stand-in for DataRoomRepository, used by component tests instead
 * of hitting the real API. Conceptually the same role fake-indexeddb used to
 * play, just hand-rolled since there's no local DB to polyfill anymore.
 */
const FAKE_OWNER_ID = "user_test";

export type FailNextMethod =
  | "createFile"
  | "createFolder"
  | "deleteFile"
  | "deleteFolder"
  | "renameFile"
  | "renameFolder";

let folders: FolderEntity[] = [];
let files: FileEntity[] = [];
const pendingFailures = new Map<FailNextMethod, Error>();

/** Queue a one-shot rejection for the next call to the given method. */
export function failNext(method: FailNextMethod, error?: Error): void {
  pendingFailures.set(method, error ?? new Error("Mocked request failure"));
}

function throwIfFailed(method: FailNextMethod): void {
  const error = pendingFailures.get(method);
  if (!error) return;
  pendingFailures.delete(method);
  throw error;
}

export function resetFakeRepository(): void {
  folders = [];
  files = [];
  pendingFailures.clear();
}

function sortItems(items: DataRoomItem[]): DataRoomItem[] {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function siblingNames(parentId: ItemId | null, excludeId?: ItemId): string[] {
  return [...folders, ...files]
    .filter((item) => item.parentId === parentId && item.id !== excludeId)
    .map((item) => item.name);
}

function getDescendantIds(folderId: ItemId): ItemId[] {
  const descendants: ItemId[] = [];
  const queue: ItemId[] = [folderId];
  while (queue.length > 0) {
    const currentId = queue.shift() as ItemId;
    for (const item of [...folders, ...files]) {
      if (item.parentId === currentId) {
        descendants.push(item.id);
        if (item.type === "folder") queue.push(item.id);
      }
    }
  }
  return descendants;
}

function itemCountFor(folderId: ItemId): number {
  return [...folders, ...files].filter((item) => item.parentId === folderId).length;
}

function withLiveItemCounts(items: DataRoomItem[]): DataRoomItem[] {
  return items.map((item) =>
    item.type === "folder" ? { ...item, itemCount: itemCountFor(item.id) } : item,
  );
}

export const fakeDataRoomRepository: DataRoomRepository = {
  async listChildren(parentId) {
    return sortItems(
      withLiveItemCounts(
        [...folders, ...files].filter((item) => item.parentId === parentId),
      ),
    );
  },

  async getFolder(id) {
    const folder = folders.find((candidate) => candidate.id === id);
    if (!folder) return undefined;
    return { ...folder, itemCount: itemCountFor(id) };
  },

  async getFolderView(folderId) {
    if (folderId === null) {
      return { ancestors: [], items: await fakeDataRoomRepository.listChildren(null) };
    }
    const ancestors: FolderEntity[] = [];
    let cursor: ItemId | null = folderId;
    while (cursor !== null) {
      const folder = folders.find((candidate) => candidate.id === cursor);
      if (!folder) return { ancestors: [], items: [] };
      ancestors.unshift({ ...folder, itemCount: itemCountFor(folder.id) });
      cursor = folder.parentId;
    }
    return {
      ancestors,
      items: await fakeDataRoomRepository.listChildren(folderId),
    };
  },

  async createFolder(name, parentId) {
    throwIfFailed("createFolder");
    const trimmed = name.trim();
    const validation = validateItemName(trimmed);
    if (!validation.ok) throw new Error(validation.message);

    const now = Date.now();
    const folder: FolderEntity = {
      id: generateId(),
      type: "folder",
      name: dedupeName(trimmed, siblingNames(parentId)),
      parentId,
      ownerId: FAKE_OWNER_ID,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    folders.push(folder);
    return folder;
  },

  async renameFolder(id, name) {
    throwIfFailed("renameFolder");
    const trimmed = name.trim();
    const validation = validateItemName(trimmed);
    if (!validation.ok) throw new Error(validation.message);

    const folder = folders.find((f) => f.id === id);
    if (!folder) throw new Error("Folder not found.");
    folder.name = dedupeName(trimmed, siblingNames(folder.parentId, id));
    folder.updatedAt = Date.now();
  },

  async deleteFolder(id) {
    throwIfFailed("deleteFolder");
    const idsToDelete = new Set([id, ...getDescendantIds(id)]);
    folders = folders.filter((folder) => !idsToDelete.has(folder.id));
    files = files.filter((file) => !idsToDelete.has(file.id));
  },

  async createFile(file, parentId, options?: CreateFileOptions) {
    throwIfFailed("createFile");
    const validation = validateFileUpload(file);
    if (!validation.ok) throw new Error(validation.message);

    const trimmedName = file.name.trim();
    const onConflict = options?.onConflict ?? "keepBoth";
    const now = Date.now();

    if (onConflict === "replace") {
      const existing = files.find(
        (candidate) =>
          candidate.parentId === parentId && candidate.name === trimmedName,
      );
      if (existing) {
        existing.mimeType = "application/pdf";
        existing.size = file.size;
        existing.blobUrl = `blob:fake/${generateId()}`;
        existing.updatedAt = now;
        return { ...existing };
      }
    }

    const entity: FileEntity = {
      id: generateId(),
      type: "file",
      name: dedupeName(trimmedName, siblingNames(parentId)),
      parentId,
      ownerId: FAKE_OWNER_ID,
      mimeType: "application/pdf",
      size: file.size,
      blobUrl: `blob:fake/${generateId()}`,
      createdAt: now,
      updatedAt: now,
    };
    files.push(entity);
    return entity;
  },

  async renameFile(id, name) {
    throwIfFailed("renameFile");
    const trimmed = name.trim();
    const validation = validateItemName(trimmed);
    if (!validation.ok) throw new Error(validation.message);

    const file = files.find((f) => f.id === id);
    if (!file) throw new Error("File not found.");
    file.name = dedupeName(trimmed, siblingNames(file.parentId, id));
    file.updatedAt = Date.now();
  },

  async deleteFile(id) {
    throwIfFailed("deleteFile");
    files = files.filter((file) => file.id !== id);
  },

  async search(query) {
    const needle = query.toLowerCase();
    const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
    return sortItems(
      withLiveItemCounts(
        [...folders, ...files]
          .filter((item) => item.name.toLowerCase().includes(needle))
          .map((item) =>
            item.type === "folder"
              ? {
                  ...item,
                  path: formatParentPath(item.parentId, foldersById),
                }
              : item,
          ),
      ),
    );
  },
};
