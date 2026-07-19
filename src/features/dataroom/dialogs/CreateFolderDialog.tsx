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
import { useFolderActions } from "@/features/dataroom/hooks/useFolderActions";
import { validateItemName } from "@/features/dataroom/model/validation";
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
  const [error, setError] = useState<string | null>(null);
  const { createFolder } = useFolderActions();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const folderName = name.trim();
    const validation = validateItemName(folderName);
    if (!validation.ok) {
      setError(validation.message);
      return;
    }

    createFolder.mutate({ name: folderName, parentId });
    // Close immediately — the grid already shows an optimistic card.
    // Errors toast from the mutation hook.
    setName("");
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setName("");
          setError(null);
        }
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
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "folder-name-error" : undefined}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Untitled folder"
            />
            {error && (
              <p id="folder-name-error" className="text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim()}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
