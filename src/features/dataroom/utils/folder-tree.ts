import type {
  BreadcrumbEntry,
  DataRoomItem,
  FolderEntity,
  ItemId,
} from "../model/types.js";
import { ROOT_FOLDER_NAME } from "../model/constants.js";

export function getChildren(
  items: DataRoomItem[],
  parentId: ItemId | null,
): DataRoomItem[] {
  return items.filter((item) => item.parentId === parentId);
}

/** Breadth-first walk collecting every nested folder/file id, for cascade deletes. */
export function getDescendantIds(
  items: DataRoomItem[],
  folderId: ItemId,
): ItemId[] {
  const descendants: ItemId[] = [];
  const queue: ItemId[] = [folderId];

  while (queue.length > 0) {
    const currentId = queue.shift() as ItemId;
    for (const item of items) {
      if (item.parentId === currentId) {
        descendants.push(item.id);
        if (item.type === "folder") {
          queue.push(item.id);
        }
      }
    }
  }

  return descendants;
}

export function buildBreadcrumbs(
  folders: FolderEntity[],
  currentFolderId: ItemId | null,
): BreadcrumbEntry[] {
  const breadcrumbs: BreadcrumbEntry[] = [];
  let cursor = currentFolderId;

  while (cursor !== null) {
    const folder = folders.find((candidate) => candidate.id === cursor);
    if (!folder) break;
    breadcrumbs.unshift({ id: folder.id, name: folder.name });
    cursor = folder.parentId;
  }

  breadcrumbs.unshift({ id: null, name: ROOT_FOLDER_NAME });
  return breadcrumbs;
}

/**
 * Location label for a search hit: ancestors from root → parent
 * (does not include the item itself). Root-level items → `"Data Room"`.
 */
export function formatParentPath(
  parentId: ItemId | null,
  foldersById: ReadonlyMap<
    ItemId,
    Pick<FolderEntity, "name" | "parentId">
  >,
): string {
  const parts: string[] = [];
  let cursor = parentId;
  const seen = new Set<ItemId>();

  while (cursor !== null) {
    if (seen.has(cursor)) break;
    seen.add(cursor);
    const folder = foldersById.get(cursor);
    if (!folder) break;
    parts.unshift(folder.name);
    cursor = folder.parentId;
  }

  parts.unshift(ROOT_FOLDER_NAME);
  return parts.join(" / ");
}

/** True when `targetFolderId` sits anywhere under `candidateAncestorId`. */
export function isDescendantOf(
  items: DataRoomItem[],
  candidateAncestorId: ItemId,
  targetFolderId: ItemId,
): boolean {
  return getDescendantIds(items, candidateAncestorId).includes(targetFolderId);
}
