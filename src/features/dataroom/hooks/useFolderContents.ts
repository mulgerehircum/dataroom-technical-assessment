import { useQuery } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type { ItemId } from "@/features/dataroom/model/types";

export const folderContentsQueryKey = (folderId: ItemId | null) =>
  ["dataroom", "folder-contents", folderId] as const;

export function useFolderContents(folderId: ItemId | null) {
  return useQuery({
    queryKey: folderContentsQueryKey(folderId),
    queryFn: () => dataRoomRepository.listChildren(folderId),
  });
}
