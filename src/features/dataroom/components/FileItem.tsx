import { Loader2, MoreHorizontal } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { FileEntity } from "@/features/dataroom/model/types";
import { formatFileSize } from "@/features/dataroom/utils/format-file-size";
import { cn } from "@/lib/utils";

interface FileItemProps {
  file: FileEntity;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function formatModifiedDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function FileItem({ file, onOpen, onRename, onDelete }: FileItemProps) {
  const isUploading = Boolean(file.isUploading);

  const row = (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_2.5rem] items-center gap-3 px-3 py-3 transition-colors hover:bg-accent",
        isUploading && "pointer-events-none opacity-70",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        disabled={isUploading}
        aria-busy={isUploading}
        className="flex min-w-0 items-center gap-3 text-left"
      >
        <span className="relative flex h-[34px] w-[30px] shrink-0 items-center justify-center rounded-[3px] bg-file-pdf text-[9px] font-extrabold tracking-wide text-background">
          PDF
          {isUploading && (
            <Loader2
              className="absolute size-4 animate-spin text-background"
              aria-label="Uploading"
            />
          )}
        </span>
        <span className="truncate text-[13.5px] font-medium">{file.name}</span>
      </button>

      <span className="text-[12.5px] text-muted-foreground">
        {isUploading ? "…" : formatFileSize(file.size)}
      </span>

      <span className="text-[12.5px] text-muted-foreground">
        {isUploading ? "Uploading…" : formatModifiedDate(file.updatedAt)}
      </span>

      {isUploading ? (
        <span />
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                aria-label={`Actions for ${file.name}`}
                className="size-[34px] justify-self-end rounded-[7px] border-border bg-transparent hover:bg-accent"
              />
            }
          >
            <MoreHorizontal className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  if (isUploading) return row;

  return (
    <ContextMenu>
      <ContextMenuTrigger>{row}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
