import { useQuery } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { buildBreadcrumbs } from "@/features/dataroom/utils/folder-tree";
import type { FolderEntity, ItemId } from "@/features/dataroom/model/types";

async function loadAncestors(folderId: ItemId | null): Promise<FolderEntity[]> {
  const ancestors: FolderEntity[] = [];
  let cursor = folderId;

  while (cursor !== null) {
    const folder = await dataRoomRepository.getFolder(cursor);
    if (!folder) break;
    ancestors.push(folder);
    cursor = folder.parentId;
  }

  return ancestors;
}

export function useBreadcrumbs(folderId: ItemId | null) {
  return useQuery({
    queryKey: ["dataroom", "breadcrumbs", folderId],
    queryFn: async () => buildBreadcrumbs(await loadAncestors(folderId), folderId),
  });
}
