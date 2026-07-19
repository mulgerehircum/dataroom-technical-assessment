import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type {
  DataRoomItem,
  FileEntity,
  ItemId,
} from "@/features/dataroom/model/types";

export const folderContentsQueryKey = (folderId: ItemId | null) =>
  ["dataroom", "folder-contents", folderId] as const;

/** How often the folder contents query re-fetches `/api/items`. */
const FOLDER_CONTENTS_POLL_MS = 5_000;

function withPendingUploads(
  serverItems: DataRoomItem[],
  previousItems: DataRoomItem[] | undefined,
): DataRoomItem[] {
  const pending =
    previousItems?.filter(
      (item): item is FileEntity =>
        item.type === "file" && Boolean(item.isUploading),
    ) ?? [];
  if (pending.length === 0) return serverItems;

  const ids = new Set(serverItems.map((item) => item.id));
  return [...serverItems, ...pending.filter((item) => !ids.has(item.id))];
}

export function useFolderContents(folderId: ItemId | null) {
  const queryClient = useQueryClient();
  const queryKey = folderContentsQueryKey(folderId);

  return useQuery({
    queryKey,
    queryFn: async () => {
      const items = await dataRoomRepository.listChildren(folderId);
      // Read after the fetch so uploads started while we were in flight
      // are still merged back into the result.
      const previous = queryClient.getQueryData<DataRoomItem[]>(queryKey);
      return withPendingUploads(items, previous);
    },
    refetchInterval: FOLDER_CONTENTS_POLL_MS,
  });
}
