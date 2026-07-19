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
import type { ItemId } from "@/features/dataroom/model/types";

interface CreateFolderDialogProps {
  parentId: ItemId | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFolderDialog({
  parentId,
  open,
  onOpenChange,
}: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const { createFolder } = useFolderActions();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    createFolder.mutate(
      { name, parentId },
      {
        onSuccess: () => {
          setName("");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setName("");
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 py-2">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Untitled folder"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={createFolder.isPending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
