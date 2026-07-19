import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type { ItemId } from "@/features/dataroom/model/types";

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
    onSuccess: invalidateContents,
  });

  return { createFolder, renameFolder, deleteFolder };
}
