import type { QueryClient } from "@tanstack/react-query";
import { folderQueryKey } from "@/features/dataroom/hooks/useFolder";
import type { FolderViewData } from "@/features/dataroom/hooks/folder-view";
import type {
  DataRoomItem,
  FolderEntity,
  ItemId,
} from "@/features/dataroom/model/types";

type QuerySnapshot<T> = [readonly unknown[], T | undefined][];

export interface RenameCacheSnapshot {
  views: QuerySnapshot<FolderViewData>;
  search: QuerySnapshot<DataRoomItem[]>;
  folder: FolderEntity | null | undefined;
  folderQueryKey: readonly unknown[];
}

/** Apply an optimistic rename across every dataroom cache that may show the name. */
export async function optimisticRename(
  queryClient: QueryClient,
  id: ItemId,
  name: string,
): Promise<RenameCacheSnapshot> {
  const trimmed = name.trim();
  const now = Date.now();
  const singleFolderKey = folderQueryKey(id);

  await queryClient.cancelQueries({ queryKey: ["dataroom"] });

  const views = queryClient.getQueriesData<FolderViewData>({
    queryKey: ["dataroom", "folder-view"],
  });
  const search = queryClient.getQueriesData<DataRoomItem[]>({
    queryKey: ["dataroom", "search"],
  });
  const folder = queryClient.getQueryData<FolderEntity | null>(singleFolderKey);

  for (const [queryKey, data] of views) {
    if (!data) continue;
    const touchesItem = data.items.some((item) => item.id === id);
    const touchesCrumb = data.entries.some((crumb) => crumb.id === id);
    const touchesAncestor = data.ancestors.some((ancestor) => ancestor.id === id);
    if (!touchesItem && !touchesCrumb && !touchesAncestor) continue;

    queryClient.setQueryData<FolderViewData>(queryKey, {
      entries: data.entries.map((crumb) =>
        crumb.id === id ? { ...crumb, name: trimmed } : crumb,
      ),
      ancestors: data.ancestors.map((ancestor) =>
        ancestor.id === id
          ? { ...ancestor, name: trimmed, updatedAt: now }
          : ancestor,
      ),
      items: data.items.map((item) =>
        item.id === id ? { ...item, name: trimmed, updatedAt: now } : item,
      ),
    });
  }

  for (const [queryKey, data] of search) {
    if (!data?.some((item) => item.id === id)) continue;
    queryClient.setQueryData<DataRoomItem[]>(
      queryKey,
      data.map((item) =>
        item.id === id ? { ...item, name: trimmed, updatedAt: now } : item,
      ),
    );
  }

  if (folder) {
    queryClient.setQueryData<FolderEntity>(singleFolderKey, {
      ...folder,
      name: trimmed,
      updatedAt: now,
    });
  }

  return { views, search, folder, folderQueryKey: singleFolderKey };
}

export function restoreRenameSnapshot(
  queryClient: QueryClient,
  snapshot: RenameCacheSnapshot,
): void {
  for (const [queryKey, data] of snapshot.views) {
    queryClient.setQueryData(queryKey, data);
  }
  for (const [queryKey, data] of snapshot.search) {
    queryClient.setQueryData(queryKey, data);
  }
  queryClient.setQueryData(snapshot.folderQueryKey, snapshot.folder);
}
