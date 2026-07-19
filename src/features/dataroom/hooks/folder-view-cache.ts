import type { QueryClient } from "@tanstack/react-query";
import {
  folderViewQueryKey,
  type FolderViewData,
} from "@/features/dataroom/hooks/folder-view";
import { buildBreadcrumbs } from "@/features/dataroom/utils/folder-tree";
import type { DataRoomItem, ItemId } from "@/features/dataroom/model/types";

/** Patch `items` on a folder-view cache entry (creates a stub view if needed). */
export function setFolderViewItems(
  queryClient: QueryClient,
  folderId: ItemId | null,
  updater: (items: DataRoomItem[]) => DataRoomItem[],
): void {
  const queryKey = folderViewQueryKey(folderId);
  queryClient.setQueryData<FolderViewData>(queryKey, (current) => {
    const items = updater(current?.items ?? []);
    if (current) return { ...current, items };
    return {
      entries: buildBreadcrumbs([], folderId),
      ancestors: [],
      items,
    };
  });
}
