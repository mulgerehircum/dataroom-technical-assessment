import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { folderContentsQueryKey } from "@/features/dataroom/hooks/useFolderContents";
import {
  optimisticRename,
  restoreRenameSnapshot,
} from "@/features/dataroom/hooks/optimistic-rename";
import type {
  DataRoomItem,
  FolderEntity,
  ItemId,
} from "@/features/dataroom/model/types";

type FolderContentsSnapshot = [readonly unknown[], DataRoomItem[] | undefined][];

export function useFolderActions() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

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
    onMutate: async ({ name, parentId }) => {
      const queryKey = folderContentsQueryKey(parentId);
      await queryClient.cancelQueries({ queryKey });

      const optimisticId = `pending-${crypto.randomUUID()}`;
      const optimisticFolder: FolderEntity = {
        id: optimisticId,
        type: "folder",
        name: name.trim(),
        parentId,
        ownerId: userId ?? "",
        itemCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isCreating: true,
      };

      queryClient.setQueryData<DataRoomItem[]>(queryKey, (current = []) => [
        ...current,
        optimisticFolder,
      ]);

      return { queryKey, optimisticId };
    },
    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData<DataRoomItem[]>(
          context.queryKey,
          (current = []) =>
            current.filter((item) => item.id !== context.optimisticId),
        );
      }
      toast.error(error instanceof Error ? error.message : "Create failed");
    },
    onSuccess: (created, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData<DataRoomItem[]>(context.queryKey, (current = []) => {
        const withoutOptimistic = current.filter(
          (item) => item.id !== context.optimisticId,
        );
        const withoutSameId = withoutOptimistic.filter(
          (item) => item.id !== created.id,
        );
        return [...withoutSameId, created];
      });
    },
    onSettled: invalidateContents,
  });

  const renameFolder = useMutation({
    mutationFn: ({ id, name }: { id: ItemId; name: string }) =>
      dataRoomRepository.renameFolder(id, name),
    onMutate: async ({ id, name }) =>
      optimisticRename(queryClient, id, name),
    onError: (error, _variables, context) => {
      if (context) restoreRenameSnapshot(queryClient, context);
      toast.error(error instanceof Error ? error.message : "Rename failed");
    },
    onSettled: invalidateContents,
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
      if (context) {
        for (const [queryKey, data] of context.previous) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(_error instanceof Error ? _error.message : "Delete failed");
    },
    onSettled: invalidateContents,
  });

  return { createFolder, renameFolder, deleteFolder };
}
