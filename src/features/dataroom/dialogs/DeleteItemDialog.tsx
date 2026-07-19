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
import type { DataRoomItem } from "@/features/dataroom/model/types";

interface DeleteItemDialogProps {
  item: DataRoomItem;
  onClose: () => void;
  onConfirm: () => void;
}

function formatItemCount(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
}

function deleteDescription(item: DataRoomItem): string {
  if (item.type === "file") {
    return `"${item.name}" will be permanently deleted.`;
  }
  if (item.itemCount === 0) {
    return `"${item.name}" will be permanently deleted.`;
  }
  return `"${item.name}" and its ${formatItemCount(item.itemCount)} will be permanently deleted. This cannot be undone.`;
}

export function DeleteItemDialog({
  item,
  onClose,
  onConfirm,
}: DeleteItemDialogProps) {
  const handleDelete = () => {
    onConfirm();
    // Close immediately — the grid already drops the item in onMutate.
    onClose();
  };

  return (
    <AlertDialog open onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {item.type}?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteDescription(item)}
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
