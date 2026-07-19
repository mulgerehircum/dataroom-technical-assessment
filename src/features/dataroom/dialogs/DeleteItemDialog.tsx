import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { DataRoomItem } from "@/features/dataroom/model/types";

interface DeleteItemDialogProps {
  item: DataRoomItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// TODO: confirm copy (warn about cascade delete for folders), submit via
// the matching delete mutation from useFolderActions or useFileActions.
export function DeleteItemDialog({
  item: _item,
  open,
  onOpenChange,
}: DeleteItemDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete item</AlertDialogTitle>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
