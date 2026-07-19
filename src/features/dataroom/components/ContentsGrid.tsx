import type { DataRoomItem, ItemId } from "@/features/dataroom/model/types";
import { FolderItem } from "@/features/dataroom/components/FolderItem";
import { FileItem } from "@/features/dataroom/components/FileItem";
import { EmptyState } from "@/features/dataroom/components/EmptyState";

interface ContentsGridProps {
  items: DataRoomItem[];
  folderId: ItemId | null;
}

export function ContentsGrid({ items, folderId: _folderId }: ContentsGridProps) {
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) =>
        item.type === "folder" ? (
          <FolderItem key={item.id} folder={item} />
        ) : (
          <FileItem key={item.id} file={item} />
        ),
      )}
    </div>
  );
}
