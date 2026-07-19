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

  const folders = items.filter((item) => item.type === "folder");
  const files = items.filter((item) => item.type === "file");

  return (
    <div className="flex flex-col gap-8">
      {folders.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[11px] font-bold tracking-[0.06em] text-text-tertiary uppercase">
            Folders
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                onRename={() => onRename(folder)}
                onDelete={() => onDelete(folder)}
              />
            ))}
          </div>
        </section>
      )}

      {files.length > 0 && (
        <section className="flex flex-col">
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_2.5rem] gap-3 border-b border-border px-3 pb-2 text-[11px] font-bold tracking-[0.06em] text-text-tertiary uppercase">
            <span>Name</span>
            <span>Size</span>
            <span>Modified</span>
            <span className="sr-only">Actions</span>
          </div>
          <ul className="divide-y divide-border">
            {files.map((file) => (
              <li key={file.id}>
                <FileItem
                  file={file}
                  onOpen={() => onPreviewFile(file)}
                  onRename={() => onRename(file)}
                  onDelete={() => onDelete(file)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
