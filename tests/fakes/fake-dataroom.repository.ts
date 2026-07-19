import { generateId } from "@/lib/ids";
import { validateFileUpload, validateItemName } from "@/features/dataroom/model/validation";
import { dedupeName } from "@/features/dataroom/utils/file-name";
import type { DataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type { DataRoomItem, FileEntity, FolderEntity, ItemId } from "@/features/dataroom/model/types";

/**
 * In-memory stand-in for DataRoomRepository, used by component tests instead
 * of hitting the real API. Conceptually the same role fake-indexeddb used to
 * play, just hand-rolled since there's no local DB to polyfill anymore.
 */
let folders: FolderEntity[] = [];
let files: FileEntity[] = [];

export function resetFakeRepository(): void {
  folders = [];
  files = [];
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

export const fakeDataRoomRepository: DataRoomRepository = {
  async listChildren(parentId) {
    return sortItems([...folders, ...files].filter((item) => item.parentId === parentId));
  },

  async getFolder(id) {
    return folders.find((folder) => folder.id === id);
  },

  async createFolder(name, parentId) {
    const trimmed = name.trim();
    const validation = validateItemName(trimmed);
    if (!validation.ok) throw new Error(validation.message);

    const now = Date.now();
    const folder: FolderEntity = {
      id: generateId(),
      type: "folder",
      name: dedupeName(trimmed, siblingNames(parentId)),
      parentId,
      createdAt: now,
      updatedAt: now,
    };
    folders.push(folder);
    return folder;
  },

  async renameFolder(id, name) {
    const trimmed = name.trim();
    const validation = validateItemName(trimmed);
    if (!validation.ok) throw new Error(validation.message);

    const folder = folders.find((f) => f.id === id);
    if (!folder) throw new Error("Folder not found.");
    folder.name = dedupeName(trimmed, siblingNames(folder.parentId, id));
    folder.updatedAt = Date.now();
  },

  async deleteFolder(id) {
    const idsToDelete = new Set([id, ...getDescendantIds(id)]);
    folders = folders.filter((folder) => !idsToDelete.has(folder.id));
    files = files.filter((file) => !idsToDelete.has(file.id));
  },

  async createFile(file, parentId) {
    const validation = validateFileUpload(file);
    if (!validation.ok) throw new Error(validation.message);

    const now = Date.now();
    const entity: FileEntity = {
      id: generateId(),
      type: "file",
      name: dedupeName(file.name.trim(), siblingNames(parentId)),
      parentId,
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
    const trimmed = name.trim();
    const validation = validateItemName(trimmed);
    if (!validation.ok) throw new Error(validation.message);

    const file = files.find((f) => f.id === id);
    if (!file) throw new Error("File not found.");
    file.name = dedupeName(trimmed, siblingNames(file.parentId, id));
    file.updatedAt = Date.now();
  },

  async deleteFile(id) {
    files = files.filter((file) => file.id !== id);
  },

  async search(query) {
    const needle = query.toLowerCase();
    return sortItems(
      [...folders, ...files].filter((item) => item.name.toLowerCase().includes(needle)),
    );
  },
};
