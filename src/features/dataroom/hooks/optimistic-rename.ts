import type { QueryClient } from "@tanstack/react-query";
import type {
  BreadcrumbEntry,
  DataRoomItem,
  FolderEntity,
  ItemId,
} from "@/features/dataroom/model/types";

type QuerySnapshot<T> = [readonly unknown[], T | undefined][];

export interface RenameCacheSnapshot {
  contents: QuerySnapshot<DataRoomItem[]>;
  breadcrumbs: QuerySnapshot<BreadcrumbEntry[]>;
  search: QuerySnapshot<DataRoomItem[]>;
  folder: FolderEntity | undefined;
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
  const folderQueryKey = ["dataroom", "folder", id] as const;

  await queryClient.cancelQueries({ queryKey: ["dataroom"] });

  const contents = queryClient.getQueriesData<DataRoomItem[]>({
    queryKey: ["dataroom", "folder-contents"],
  });
  const breadcrumbs = queryClient.getQueriesData<BreadcrumbEntry[]>({
    queryKey: ["dataroom", "breadcrumbs"],
  });
  const search = queryClient.getQueriesData<DataRoomItem[]>({
    queryKey: ["dataroom", "search"],
  });
  const folder = queryClient.getQueryData<FolderEntity>(folderQueryKey);

  for (const [queryKey, data] of contents) {
    if (!data?.some((item) => item.id === id)) continue;
    queryClient.setQueryData<DataRoomItem[]>(
      queryKey,
      data.map((item) =>
        item.id === id ? { ...item, name: trimmed, updatedAt: now } : item,
      ),
    );
  }

  for (const [queryKey, data] of breadcrumbs) {
    if (!data?.some((crumb) => crumb.id === id)) continue;
    queryClient.setQueryData<BreadcrumbEntry[]>(
      queryKey,
      data.map((crumb) =>
        crumb.id === id ? { ...crumb, name: trimmed } : crumb,
      ),
    );
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
    queryClient.setQueryData<FolderEntity>(folderQueryKey, {
      ...folder,
      name: trimmed,
      updatedAt: now,
    });
  }

  return { contents, breadcrumbs, search, folder, folderQueryKey };
}

export function restoreRenameSnapshot(
  queryClient: QueryClient,
  snapshot: RenameCacheSnapshot,
): void {
  for (const [queryKey, data] of snapshot.contents) {
    queryClient.setQueryData(queryKey, data);
  }
  for (const [queryKey, data] of snapshot.breadcrumbs) {
    queryClient.setQueryData(queryKey, data);
  }
  for (const [queryKey, data] of snapshot.search) {
    queryClient.setQueryData(queryKey, data);
  }
  queryClient.setQueryData(snapshot.folderQueryKey, snapshot.folder);
}
