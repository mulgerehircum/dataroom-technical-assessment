import { Folder } from "lucide-react";
import type { FolderEntity } from "@/features/dataroom/model/types";

interface FolderItemProps {
  folder: FolderEntity;
}

// TODO: navigate into the folder on click, add rename/delete via context menu.
export function FolderItem({ folder }: FolderItemProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md p-3 text-center hover:bg-accent">
      <Folder className="size-10 text-muted-foreground" />
      <span className="w-full truncate text-sm">{folder.name}</span>
    </div>
  );
}
