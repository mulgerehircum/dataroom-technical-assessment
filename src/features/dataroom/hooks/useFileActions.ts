import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  dataRoomRepository,
  type FileConflictPolicy,
} from "@/features/dataroom/storage/dataroom.repository";
import {
  folderViewQueryKey,
  type FolderViewData,
} from "@/features/dataroom/hooks/folder-view";
import { setFolderViewItems } from "@/features/dataroom/hooks/folder-view-cache";
import {
  optimisticRename,
  restoreRenameSnapshot,
} from "@/features/dataroom/hooks/optimistic-rename";
import type { FileEntity, ItemId } from "@/features/dataroom/model/types";

type FolderViewSnapshot = [readonly unknown[], FolderViewData | undefined][];

export function useFileActions() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const invalidateContents = () =>
    queryClient.invalidateQueries({ queryKey: ["dataroom"] });

  const uploadFile = useMutation({
    mutationFn: ({
      file,
      parentId,
      onConflict,
    }: {
      file: File;
      parentId: ItemId | null;
      onConflict?: FileConflictPolicy;
    }) => dataRoomRepository.createFile(file, parentId, { onConflict }),
    onMutate: async ({ file, parentId, onConflict }) => {
      await queryClient.cancelQueries({ queryKey: folderViewQueryKey(parentId) });

      const optimisticId = `pending-${crypto.randomUUID()}`;
      const optimisticFile: FileEntity = {
        id: optimisticId,
        type: "file",
        name: file.name,
        parentId,
        ownerId: userId ?? "",
        mimeType: "application/pdf",
        size: file.size,
        blobUrl: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isUploading: true,
      };

      setFolderViewItems(queryClient, parentId, (current) => {
        const withoutReplaced =
          onConflict === "replace"
            ? current.filter(
                (item) =>
                  !(
                    item.type === "file" &&
                    item.name === file.name &&
                    !item.isUploading
                  ),
              )
            : current;
        return [...withoutReplaced, optimisticFile];
      });

      return { parentId, optimisticId };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      setFolderViewItems(queryClient, context.parentId, (current) =>
        current.filter((item) => item.id !== context.optimisticId),
      );
    },
    onSuccess: (created, _variables, context) => {
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

  const renameFile = useMutation({
    mutationFn: ({ id, name }: { id: ItemId; name: string }) =>
      dataRoomRepository.renameFile(id, name),
    onMutate: async ({ id, name }) =>
      optimisticRename(queryClient, id, name),
    onError: (error, _variables, context) => {
      if (context) restoreRenameSnapshot(queryClient, context);
      toast.error(error instanceof Error ? error.message : "Rename failed");
    },
    onSettled: invalidateContents,
  });

  const deleteFile = useMutation({
    mutationFn: (id: ItemId) => dataRoomRepository.deleteFile(id),
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

  return { uploadFile, renameFile, deleteFile };
}
