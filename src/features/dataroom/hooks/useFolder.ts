import { useQuery } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type { FolderEntity, ItemId } from "@/features/dataroom/model/types";

export const folderQueryKey = (folderId: ItemId) =>
  ["dataroom", "folder", folderId] as const;

/** Fetches a single folder's metadata. No-ops for the root (`folderId === null`). */
export function useFolder(folderId: ItemId | null) {
  return useQuery({
    queryKey: folderQueryKey(folderId as ItemId),
    // Prefer cache seeded by `useBreadcrumbs` when both are mounted.
    queryFn: async (): Promise<FolderEntity | null> =>
      (await dataRoomRepository.getFolder(folderId as ItemId)) ?? null,
    enabled: folderId !== null,
  });
}
