import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dataRoomRepository,
  type FileConflictPolicy,
} from "@/features/dataroom/storage/dataroom.repository";
import { folderContentsQueryKey } from "@/features/dataroom/hooks/useFolderContents";
import type {
  DataRoomItem,
  FileEntity,
  ItemId,
} from "@/features/dataroom/model/types";

type FolderContentsSnapshot = [readonly unknown[], DataRoomItem[] | undefined][];

export function useFileActions() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const invalidateContents = () =>
    queryClient.invalidateQueries({ queryKey: ["dataroom", "folder-contents"] });

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
      const queryKey = folderContentsQueryKey(parentId);
      await queryClient.cancelQueries({ queryKey });

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

      queryClient.setQueryData<DataRoomItem[]>(queryKey, (current = []) => {
        const withoutReplaced =
          onConflict === "replace"
            ? current.filter(
                (item) =>
                  !(item.type === "file" && item.name === file.name && !item.isUploading),
              )
            : current;
        return [...withoutReplaced, optimisticFile];
      });

      return { queryKey, optimisticId };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      queryClient.setQueryData<DataRoomItem[]>(context.queryKey, (current = []) =>
        current.filter((item) => item.id !== context.optimisticId),
      );
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

  const renameFile = useMutation({
    mutationFn: ({ id, name }: { id: ItemId; name: string }) =>
      dataRoomRepository.renameFile(id, name),
    onSuccess: invalidateContents,
  });

  const deleteFile = useMutation({
    mutationFn: (id: ItemId) => dataRoomRepository.deleteFile(id),
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

  return { uploadFile, renameFile, deleteFile };
}
