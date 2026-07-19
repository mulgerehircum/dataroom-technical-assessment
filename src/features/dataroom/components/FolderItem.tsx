import { Link } from "react-router-dom";
import { Folder } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import type { FolderEntity } from "@/features/dataroom/model/types";

interface FolderItemProps {
  folder: FolderEntity;
  onRename: () => void;
  onDelete: () => void;
}

export function FolderItem({ folder, onRename, onDelete }: FolderItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Link
          to={`/folder/${folder.id}`}
          className="flex flex-col items-center gap-2 rounded-md p-3 text-center hover:bg-accent"
        >
          <Folder className="size-10 text-muted-foreground" />
          <span className="w-full truncate text-sm">{folder.name}</span>
        </Link>
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
