import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DataRoomItem } from "@/features/dataroom/model/types";

interface RenameItemDialogProps {
  item: DataRoomItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// TODO: name input pre-filled with item.name, submit via the matching
// rename mutation from useFolderActions or useFileActions based on item.type.
export function RenameItemDialog({
  item: _item,
  open,
  onOpenChange,
}: RenameItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
