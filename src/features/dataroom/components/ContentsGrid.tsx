import type { DataRoomItem, FileEntity } from "@/features/dataroom/model/types";
import { FolderItem } from "@/features/dataroom/components/FolderItem";
import { FileItem } from "@/features/dataroom/components/FileItem";
import { EmptyState } from "@/features/dataroom/components/EmptyState";

interface ContentsGridProps {
  items: DataRoomItem[];
  onRename: (item: DataRoomItem) => void;
  onDelete: (item: DataRoomItem) => void;
  onPreviewFile: (file: FileEntity) => void;
}

export function ContentsGrid({
  items,
  onRename,
  onDelete,
  onPreviewFile,
}: ContentsGridProps) {
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) =>
        item.type === "folder" ? (
          <FolderItem
            key={item.id}
            folder={item}
            onRename={() => onRename(item)}
            onDelete={() => onDelete(item)}
          />
        ) : (
          <FileItem
            key={item.id}
            file={item}
            onOpen={() => onPreviewFile(item)}
            onRename={() => onRename(item)}
            onDelete={() => onDelete(item)}
          />
        ),
      )}
    </div>
  );
}
