import { generateId } from "@/lib/ids";
import { validateFileUpload, validateItemName } from "@/features/dataroom/model/validation";
import { dedupeName } from "@/features/dataroom/utils/file-name";
import { formatParentPath } from "@/features/dataroom/utils/folder-tree";
import type { DataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type { DataRoomItem, FileEntity, FolderEntity, ItemId } from "@/features/dataroom/model/types";

/**
 * Read/write-in-memory stand-in for DataRoomRepository, used by the public
 * `/demo` route so visitors can explore the data room without a Clerk
 * account. Nothing here touches the real API, Postgres, or Blob storage —
 * every visitor gets a fresh, isolated in-memory data room that resets on
 * reload, so there's no shared state for one visitor to disturb for another.
 */
const DEMO_OWNER_ID = "demo";

interface SeedFile {
  path: string; // "Legal/NDA.pdf" — slash-separated folder path + filename
  size: number;
}

const SEED_FILES: SeedFile[] = [
  { path: "Company Overview.pdf", size: 42_000 },
  { path: "Legal/NDA.pdf", size: 38_000 },
  { path: "Legal/Term Sheet.pdf", size: 45_000 },
  { path: "Financials/Cap Table.pdf", size: 31_000 },
  { path: "Financials/Financial Model.pdf", size: 52_000 },
  { path: "Product/Product Roadmap.pdf", size: 29_000 },
];

function sortItems(items: DataRoomItem[]): DataRoomItem[] {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

function siblingNames(
  folders: FolderEntity[],
  files: FileEntity[],
  parentId: ItemId | null,
  excludeId?: ItemId,
): string[] {
  return [...folders, ...files]
    .filter((item) => item.parentId === parentId && item.id !== excludeId)
    .map((item) => item.name);
}

function getDescendantIds(
  folders: FolderEntity[],
  files: FileEntity[],
  folderId: ItemId,
): ItemId[] {
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

function seedState() {
  const folders: FolderEntity[] = [];
  const files: FileEntity[] = [];
  const folderIdByName = new Map<string, ItemId>();
  const now = Date.now();

  function ensureFolder(name: string, parentId: ItemId | null, key: string): ItemId {
    const existing = folderIdByName.get(key);
    if (existing) return existing;
    const folder: FolderEntity = {
      id: generateId(),
      type: "folder",
      name,
      parentId,
      ownerId: DEMO_OWNER_ID,
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    folders.push(folder);
    folderIdByName.set(key, folder.id);
    return folder.id;
  }

  for (const seed of SEED_FILES) {
    const segments = seed.path.split("/");
    const fileName = segments.pop() as string;
    let parentId: ItemId | null = null;
    let key = "";
    for (const segment of segments) {
      key = key ? `${key}/${segment}` : segment;
      parentId = ensureFolder(segment, parentId, key);
    }
    files.push({
      id: generateId(),
      type: "file",
      name: fileName,
      parentId,
      ownerId: DEMO_OWNER_ID,
      mimeType: "application/pdf",
      size: seed.size,
      blobUrl: `/demo-files/${seed.path.split("/").map(encodeURIComponent).join("/")}`,
      createdAt: now,
      updatedAt: now,
    });
  }

  return { folders, files };
}

let { folders, files } = seedState();

function itemCountFor(folderId: ItemId): number {
  return [...folders, ...files].filter((item) => item.parentId === folderId).length;
}

function withLiveItemCounts(items: DataRoomItem[]): DataRoomItem[] {
  return items.map((item) =>
    item.type === "folder" ? { ...item, itemCount: itemCountFor(item.id) } : item,
  );
}

export const demoDataRoomRepository: DataRoomRepository = {
  async listChildren(parentId) {
    return sortItems(
      withLiveItemCounts([...folders, ...files].filter((item) => item.parentId === parentId)),
    );
  },

  async getFolder(id) {
    const folder = folders.find((candidate) => candidate.id === id);
    if (!folder) return undefined;
    return { ...folder, itemCount: itemCountFor(id) };
  },

  async getFolderView(folderId) {
    if (folderId === null) {
      return { ancestors: [], items: await demoDataRoomRepository.listChildren(null) };
    }
    const ancestors: FolderEntity[] = [];
    let cursor: ItemId | null = folderId;
    while (cursor !== null) {
      const folder = folders.find((candidate) => candidate.id === cursor);
      if (!folder) return { ancestors: [], items: [] };
      ancestors.unshift({ ...folder, itemCount: itemCountFor(folder.id) });
      cursor = folder.parentId;
    }
    return { ancestors, items: await demoDataRoomRepository.listChildren(folderId) };
  },

  async createFolder(name, parentId) {
    const trimmed = name.trim();
    const validation = validateItemName(trimmed);
    if (!validation.ok) throw new Error(validation.message);

    const now = Date.now();
    const folder: FolderEntity = {
      id: generateId(),
      type: "folder",
      name: dedupeName(trimmed, siblingNames(folders, files, parentId)),
      parentId,
      ownerId: DEMO_OWNER_ID,
      itemCount: 0,
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
    folder.name = dedupeName(trimmed, siblingNames(folders, files, folder.parentId, id));
    folder.updatedAt = Date.now();
    return { ...folder, itemCount: itemCountFor(id) };
  },

  async deleteFolder(id) {
    const idsToDelete = new Set([id, ...getDescendantIds(folders, files, id)]);
    folders = folders.filter((folder) => !idsToDelete.has(folder.id));
    files = files.filter((file) => !idsToDelete.has(file.id));
  },

  async createFile(file, parentId, options) {
    const validation = validateFileUpload(file);
    if (!validation.ok) throw new Error(validation.message);

    const trimmedName = file.name.trim();
    const onConflict = options?.onConflict ?? "keepBoth";
    const now = Date.now();

    if (onConflict === "replace") {
      const existing = files.find(
        (candidate) => candidate.parentId === parentId && candidate.name === trimmedName,
      );
      if (existing) {
        existing.mimeType = "application/pdf";
        existing.size = file.size;
        existing.blobUrl = URL.createObjectURL(file);
        existing.updatedAt = now;
        return { ...existing };
      }
    }

    const entity: FileEntity = {
      id: generateId(),
      type: "file",
      name: dedupeName(trimmedName, siblingNames(folders, files, parentId)),
      parentId,
      ownerId: DEMO_OWNER_ID,
      mimeType: "application/pdf",
      size: file.size,
      // Object URL only — never leaves the browser, unlike the real API's
      // Vercel Blob upload, so nothing is stored anywhere.
      blobUrl: URL.createObjectURL(file),
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
    file.name = dedupeName(trimmed, siblingNames(folders, files, file.parentId, id));
    file.updatedAt = Date.now();
    return { ...file };
  },

  async deleteFile(id) {
    files = files.filter((file) => file.id !== id);
  },

  async search(query) {
    const needle = query.toLowerCase();
    const foldersById = new Map(folders.map((folder) => [folder.id, folder]));
    return sortItems(
      withLiveItemCounts(
        [...folders, ...files]
          .filter((item) => item.name.toLowerCase().includes(needle))
          .map((item) => ({ ...item, path: formatParentPath(item.parentId, foldersById) })),
      ),
    );
  },
};

/** Resets the demo data room back to its seeded state (used when re-entering `/demo`). */
export function resetDemoDataRoom(): void {
  const seeded = seedState();
  folders = seeded.folders;
  files = seeded.files;
}
