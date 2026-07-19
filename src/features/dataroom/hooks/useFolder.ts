import { useQuery } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type { ItemId } from "@/features/dataroom/model/types";

/** Fetches a single folder's metadata. No-ops for the root (`folderId === null`). */
export function useFolder(folderId: ItemId | null) {
  return useQuery({
    queryKey: ["dataroom", "folder", folderId],
    queryFn: () => dataRoomRepository.getFolder(folderId as ItemId),
    enabled: folderId !== null,
  });
}
