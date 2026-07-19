import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ItemId } from "@/features/dataroom/model/types";

interface CreateFolderDialogProps {
  parentId: ItemId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// TODO: name input + validateItemName(), submit via useFolderActions().createFolder.
export function CreateFolderDialog({
  parentId: _parentId,
  open,
  onOpenChange,
}: CreateFolderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
