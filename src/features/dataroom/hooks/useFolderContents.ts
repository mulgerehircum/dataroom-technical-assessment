import { useFolderView } from "@/features/dataroom/hooks/useFolderView";
import type { ItemId } from "@/features/dataroom/model/types";

export { folderViewQueryKey as folderContentsQueryKey } from "@/features/dataroom/hooks/folder-view";

/** Reads items from the shared folder-view query (same network call as breadcrumbs). */
export function useFolderContents(folderId: ItemId | null) {
  const query = useFolderView(folderId);
  return {
    ...query,
    data: query.data?.items,
  };
}
