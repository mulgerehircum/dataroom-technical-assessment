import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import {
  folderViewQueryKey,
  type FolderViewData,
} from "@/features/dataroom/hooks/folder-view";
import { setFolderViewItems } from "@/features/dataroom/hooks/folder-view-cache";
import {
  optimisticRename,
  restoreRenameSnapshot,
} from "@/features/dataroom/hooks/optimistic-rename";
import type { FolderEntity, ItemId } from "@/features/dataroom/model/types";

type FolderViewSnapshot = [readonly unknown[], FolderViewData | undefined][];

export function useFolderActions() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

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
      await queryClient.cancelQueries({ queryKey: folderViewQueryKey(parentId) });

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

      setFolderViewItems(queryClient, parentId, (current) => [
        ...current,
        optimisticFolder,
      ]);

      return { parentId, optimisticId };
    },
    onError: (error, _variables, context) => {
      if (context) {
        setFolderViewItems(queryClient, context.parentId, (current) =>
          current.filter((item) => item.id !== context.optimisticId),
        );
      }
      toast.error(error instanceof Error ? error.message : "Create failed");
    },
    onSuccess: (created, variables, context) => {
      if (created.name !== variables.name.trim()) {
        toast.message(`Saved as "${created.name}"`);
      }
      if (!context) return;
      setFolderViewItems(queryClient, context.parentId, (current) => {
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
    onSuccess: (updated, { id, name }) => {
      if (updated.name === name.trim()) return;
      toast.message(`Saved as "${updated.name}"`);
      void optimisticRename(queryClient, id, updated.name);
    },
    onSettled: invalidateContents,
  });

  const deleteFolder = useMutation({
    mutationFn: (id: ItemId) => dataRoomRepository.deleteFolder(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["dataroom", "folder-view"] });
      const previous: FolderViewSnapshot = queryClient.getQueriesData<FolderViewData>({
        queryKey: ["dataroom", "folder-view"],
      });

      for (const [queryKey, data] of previous) {
        if (!data?.items.some((item) => item.id === id)) continue;
        queryClient.setQueryData<FolderViewData>(queryKey, {
          ...data,
          items: data.items.filter((item) => item.id !== id),
        });
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
