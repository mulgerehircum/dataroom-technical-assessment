import { FileText, Loader2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { FileEntity } from "@/features/dataroom/model/types";
import { formatFileSize } from "@/features/dataroom/utils/format-file-size";
import { cn } from "@/lib/utils";

interface FileItemProps {
  file: FileEntity;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FileItem({ file, onOpen, onRename, onDelete }: FileItemProps) {
  const isUploading = Boolean(file.isUploading);

  const tile = (
    <button
      type="button"
      onClick={onOpen}
      disabled={isUploading}
      aria-busy={isUploading}
      className={cn(
        "flex w-full flex-col items-center gap-2 rounded-md p-3 text-center hover:bg-accent",
        isUploading && "pointer-events-none opacity-70",
      )}
    >
      <span className="relative inline-flex size-10 items-center justify-center">
        <FileText className="size-10 text-muted-foreground" />
        {isUploading && (
          <Loader2
            className="absolute size-5 animate-spin text-primary"
            aria-label="Uploading"
          />
        )}
      </span>
      <span className="w-full truncate text-sm">{file.name}</span>
      <span className="text-xs text-muted-foreground">
        {isUploading ? "Uploading…" : formatFileSize(file.size)}
      </span>
    </button>
  );

  if (isUploading) return tile;

  return (
    <ContextMenu>
      <ContextMenuTrigger>{tile}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
