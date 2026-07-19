import { useFolderView } from "@/features/dataroom/hooks/useFolderView";
import type {
  BreadcrumbEntry,
  FolderEntity,
  ItemId,
} from "@/features/dataroom/model/types";

export type BreadcrumbsQueryData = {
  entries: BreadcrumbEntry[];
  /** Root→leaf folder entities; empty when `folderId` is missing/deleted. */
  ancestors: FolderEntity[];
};

/** Reads the shared folder-view query (same network call as contents). */
export function useBreadcrumbs(folderId: ItemId | null) {
  return useFolderView(folderId);
}
