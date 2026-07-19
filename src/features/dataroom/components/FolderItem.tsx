import { Link } from "react-router-dom";
import { MoreVertical } from "lucide-react";
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
import type { FolderEntity } from "@/features/dataroom/model/types";

interface FolderItemProps {
  folder: FolderEntity;
  onRename: () => void;
  onDelete: () => void;
}

function formatItemCount(count: number): string {
  return count === 1 ? "1 item" : `${count} items`;
}

export function FolderItem({ folder, onRename, onDelete }: FolderItemProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex items-center gap-2 rounded-[10px] border border-border bg-card pr-2 transition-colors hover:bg-accent">
          <Link
            to={`/folder/${folder.id}`}
            className="flex min-w-0 flex-1 items-center gap-3.5 px-[18px] py-[18px]"
          >
            <span
              className="relative size-8 shrink-0 rounded-[4px_8px_4px_4px] bg-folder-icon"
              aria-hidden
            >
              <span className="absolute -top-1.5 left-0 h-1.5 w-[18px] rounded-t-[3px] bg-folder-icon" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-wide uppercase">
                {folder.name}
              </span>
              <span className="mt-0.5 block text-xs text-text-tertiary">
                {formatItemCount(folder.itemCount)}
              </span>
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${folder.name}`}
                  className="size-[34px] shrink-0 border-0 bg-transparent shadow-none hover:bg-transparent"
                />
              }
            >
              <MoreVertical className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onRename}>Rename</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
