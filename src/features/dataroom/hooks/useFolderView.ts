import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { folderQueryKey } from "@/features/dataroom/hooks/useFolder";
import {
  folderViewQueryKey,
  type FolderViewData,
} from "@/features/dataroom/hooks/folder-view";
import { buildBreadcrumbs } from "@/features/dataroom/utils/folder-tree";
import type { DataRoomItem, ItemId } from "@/features/dataroom/model/types";

/** How often the folder view re-fetches `/api/view`. */
const FOLDER_VIEW_POLL_MS = 5_000;

function withPendingUploads(
  serverItems: DataRoomItem[],
  previousItems: DataRoomItem[] | undefined,
): DataRoomItem[] {
  const pending =
    previousItems?.filter(
      (item) =>
        (item.type === "file" && Boolean(item.isUploading)) ||
        (item.type === "folder" && Boolean(item.isCreating)),
    ) ?? [];
  if (pending.length === 0) return serverItems;

  const ids = new Set(serverItems.map((item) => item.id));
  return [...serverItems, ...pending.filter((item) => !ids.has(item.id))];
}

async function loadFolderView(
  queryClient: ReturnType<typeof useQueryClient>,
  folderId: ItemId | null,
): Promise<FolderViewData> {
  const queryKey = folderViewQueryKey(folderId);
  const previous = queryClient.getQueryData<FolderViewData>(queryKey);
  const view = await dataRoomRepository.getFolderView(folderId);

  for (const folder of view.ancestors) {
    queryClient.setQueryData(folderQueryKey(folder.id), folder);
  }

  return {
    entries: buildBreadcrumbs(view.ancestors, folderId),
    ancestors: view.ancestors,
    items: withPendingUploads(view.items, previous?.items),
  };
}

/** Single `/api/view` query shared by breadcrumbs + contents. */
export function useFolderView(folderId: ItemId | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: folderViewQueryKey(folderId),
    queryFn: () => loadFolderView(queryClient, folderId),
    placeholderData: keepPreviousData,
    retry: false,
    refetchInterval: (query) =>
      query.state.status === "success" ? FOLDER_VIEW_POLL_MS : false,
  });
}
