import { useState, type FormEvent } from "react";
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
import type { DataRoomItem } from "@/features/dataroom/model/types";

interface RenameItemDialogProps {
  item: DataRoomItem;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export function RenameItemDialog({
  item,
  onClose,
  onConfirm,
}: RenameItemDialogProps) {
  const [name, setName] = useState(item.name);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next = name.trim();
    if (!next || next === item.name) {
      onClose();
      return;
    }
    onConfirm(next);
    // Close immediately — caches already show the new name in onMutate.
    onClose();
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
            <Button type="submit" disabled={!name.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
