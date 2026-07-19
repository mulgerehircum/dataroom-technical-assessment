import type {
  BreadcrumbEntry,
  DataRoomItem,
  FolderEntity,
  ItemId,
} from "@/features/dataroom/model/types";

export type FolderViewData = {
  entries: BreadcrumbEntry[];
  /** Root→leaf; empty when `folderId` was set but the folder is missing. */
  ancestors: FolderEntity[];
  items: DataRoomItem[];
};

export const folderViewQueryKey = (folderId: ItemId | null) =>
  ["dataroom", "folder-view", folderId] as const;

/** @deprecated Use folderViewQueryKey — contents live on the unified view cache. */
export const folderContentsQueryKey = folderViewQueryKey;
