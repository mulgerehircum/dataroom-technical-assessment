import { FileText } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { FileEntity } from "@/features/dataroom/model/types";
import { formatFileSize } from "@/features/dataroom/utils/format-file-size";

interface FileItemProps {
  file: FileEntity;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function FileItem({ file, onOpen, onRename, onDelete }: FileItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full flex-col items-center gap-2 rounded-md p-3 text-center hover:bg-accent"
        >
          <FileText className="size-10 text-muted-foreground" />
          <span className="w-full truncate text-sm">{file.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </span>
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onRename}>Rename</ContextMenuItem>
        <ContextMenuItem variant="destructive" onClick={onDelete}>
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
