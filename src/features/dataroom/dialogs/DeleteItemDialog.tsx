import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFolderActions } from "@/features/dataroom/hooks/useFolderActions";
import { useFileActions } from "@/features/dataroom/hooks/useFileActions";
import type { DataRoomItem } from "@/features/dataroom/model/types";

interface DeleteItemDialogProps {
  item: DataRoomItem;
  onClose: () => void;
}

export function DeleteItemDialog({ item, onClose }: DeleteItemDialogProps) {
  const { deleteFolder } = useFolderActions();
  const { deleteFile } = useFileActions();

  const handleDelete = () => {
    const mutation = item.type === "folder" ? deleteFolder : deleteFile;
    mutation.mutate(item.id, {
      onSuccess: onClose,
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <AlertDialog open onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {item.type}?</AlertDialogTitle>
          <AlertDialogDescription>
            {item.type === "folder"
              ? `"${item.name}" and everything inside it will be permanently deleted.`
              : `"${item.name}" will be permanently deleted.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
