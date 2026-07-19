import type {
  BreadcrumbEntry,
  DataRoomItem,
  FolderEntity,
  ItemId,
} from "@/features/dataroom/model/types";
import { ROOT_FOLDER_NAME } from "@/features/dataroom/model/constants";

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

/** True when `targetFolderId` sits anywhere under `candidateAncestorId`. */
export function isDescendantOf(
  items: DataRoomItem[],
  candidateAncestorId: ItemId,
  targetFolderId: ItemId,
): boolean {
  return getDescendantIds(items, candidateAncestorId).includes(targetFolderId);
}
