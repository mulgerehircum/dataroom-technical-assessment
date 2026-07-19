import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFolderActions } from "@/features/dataroom/hooks/useFolderActions";
import { useFileActions } from "@/features/dataroom/hooks/useFileActions";
import type { DataRoomItem } from "@/features/dataroom/model/types";

interface RenameItemDialogProps {
  item: DataRoomItem;
  onClose: () => void;
}

export function RenameItemDialog({ item, onClose }: RenameItemDialogProps) {
  const [name, setName] = useState(item.name);
  const { renameFolder } = useFolderActions();
  const { renameFile } = useFileActions();

  const mutation = item.type === "folder" ? renameFolder : renameFile;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate(
      { id: item.id, name },
      {
        onSuccess: onClose,
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename {item.type}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 py-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
