import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { folderQueryKey } from "@/features/dataroom/hooks/useFolder";
import { buildBreadcrumbs } from "@/features/dataroom/utils/folder-tree";
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

export function useBreadcrumbs(folderId: ItemId | null) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["dataroom", "breadcrumbs", folderId],
    queryFn: async (): Promise<BreadcrumbsQueryData> => {
      if (folderId === null) {
        return { entries: buildBreadcrumbs([], null), ancestors: [] };
      }

      // Single `/folders/:id/breadcrumbs` call — not N× getFolder.
      const ancestors = await dataRoomRepository.listBreadcrumbChain(folderId);
      for (const folder of ancestors) {
        queryClient.setQueryData(folderQueryKey(folder.id), folder);
      }

      return {
        entries: buildBreadcrumbs(ancestors, folderId),
        ancestors,
      };
    },
    // Keep the previous path visible while the new folder's chain loads so
    // the bar doesn't collapse to empty padding (CLS on folder navigation).
    placeholderData: keepPreviousData,
  });
}
