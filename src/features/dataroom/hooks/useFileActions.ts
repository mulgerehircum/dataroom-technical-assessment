import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { folderContentsQueryKey } from "@/features/dataroom/hooks/useFolderContents";
import type {
  DataRoomItem,
  FileEntity,
  ItemId,
} from "@/features/dataroom/model/types";

export function useFileActions() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const invalidateContents = () =>
    queryClient.invalidateQueries({ queryKey: ["dataroom", "folder-contents"] });

  const uploadFile = useMutation({
    mutationFn: ({
      file,
      parentId,
    }: {
      file: File;
      parentId: ItemId | null;
    }) => dataRoomRepository.createFile(file, parentId),
    onMutate: async ({ file, parentId }) => {
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

      queryClient.setQueryData<DataRoomItem[]>(queryKey, (current = []) => [
        ...current,
        optimisticFile,
      ]);

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
      queryClient.setQueryData<DataRoomItem[]>(context.queryKey, (current = []) =>
        current.map((item) => (item.id === context.optimisticId ? created : item)),
      );
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
    onSuccess: invalidateContents,
  });

  return { uploadFile, renameFile, deleteFile };
}
