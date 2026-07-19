import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type { DataRoomItem, ItemId } from "@/features/dataroom/model/types";

type FolderContentsSnapshot = [readonly unknown[], DataRoomItem[] | undefined][];

export function useFolderActions() {
  const queryClient = useQueryClient();

  // Broad "dataroom" prefix so both folder-contents and breadcrumb queries
  // (which embed a renamed ancestor's name) refresh together.
  const invalidateContents = () =>
    queryClient.invalidateQueries({ queryKey: ["dataroom"] });

  const createFolder = useMutation({
    mutationFn: ({
      name,
      parentId,
    }: {
      name: string;
      parentId: ItemId | null;
    }) => dataRoomRepository.createFolder(name, parentId),
    onSuccess: invalidateContents,
  });

  const renameFolder = useMutation({
    mutationFn: ({ id, name }: { id: ItemId; name: string }) =>
      dataRoomRepository.renameFolder(id, name),
    onSuccess: invalidateContents,
  });

  const deleteFolder = useMutation({
    mutationFn: (id: ItemId) => dataRoomRepository.deleteFolder(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["dataroom", "folder-contents"] });
      const previous: FolderContentsSnapshot = queryClient.getQueriesData<
        DataRoomItem[]
      >({ queryKey: ["dataroom", "folder-contents"] });

      for (const [queryKey, data] of previous) {
        if (!data?.some((item) => item.id === id)) continue;
        queryClient.setQueryData<DataRoomItem[]>(
          queryKey,
          data.filter((item) => item.id !== id),
        );
      }

      return { previous };
    },
    onError: (_error, _id, context) => {
      if (!context) return;
      for (const [queryKey, data] of context.previous) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSettled: invalidateContents,
  });

  return { createFolder, renameFolder, deleteFolder };
}
