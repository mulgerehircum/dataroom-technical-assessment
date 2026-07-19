import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type { ItemId } from "@/features/dataroom/model/types";

export function useFileActions() {
  const queryClient = useQueryClient();

  const invalidateContents = () =>
    queryClient.invalidateQueries({
      queryKey: ["dataroom", "folder-contents"],
    });

  const uploadFile = useMutation({
    mutationFn: ({
      file,
      parentId,
    }: {
      file: File;
      parentId: ItemId | null;
    }) => dataRoomRepository.createFile(file, parentId),
    onSuccess: invalidateContents,
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
