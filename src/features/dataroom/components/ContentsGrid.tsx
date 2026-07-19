import { useRef } from "react";
import { FilePlus, FolderPlus } from "lucide-react";
import type { DataRoomItem, FileEntity, ItemId } from "@/features/dataroom/model/types";
import { FolderItem } from "@/features/dataroom/components/FolderItem";
import { FileItem } from "@/features/dataroom/components/FileItem";
import { useBreadcrumbs } from "@/features/dataroom/hooks/useBreadcrumbs";
import { useUploadFiles } from "@/features/dataroom/hooks/useUploadFiles";

interface ContentsGridProps {
  items: DataRoomItem[];
  folderId: ItemId | null;
  isSearching?: boolean;
  onCreateFolder: () => void;
  onRename: (item: DataRoomItem) => void;
  onDelete: (item: DataRoomItem) => void;
  onPreviewFile: (file: FileEntity) => void;
  onOpenFolder?: () => void;
  onShowInFolder?: (folderId: ItemId | null) => void;
}

function NewFolderTile({
  folderId,
  parentFolderName,
  onClick,
}: {
  folderId: ItemId | null;
  parentFolderName: string | null;
  onClick: () => void;
}) {
  const isSubfolder = folderId !== null;
  const title = isSubfolder ? "New subfolder" : "New folder";
  const subtitle = isSubfolder
    ? parentFolderName
      ? `of ${parentFolderName}`
      : "Create"
    : "Create";
  const label = isSubfolder
    ? parentFolderName
      ? `New subfolder of ${parentFolderName}`
      : "New subfolder"
    : "New folder";

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex items-center gap-3.5 rounded-[10px] border border-dashed border-border bg-transparent px-[18px] py-[18px] text-left text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-foreground"
    >
      <span
        className="flex size-8 shrink-0 items-center justify-center rounded-[4px_8px_4px_4px] border border-dashed border-current"
        aria-hidden
      >
        <FolderPlus className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold tracking-wide uppercase">
          {title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-text-tertiary">
          {subtitle}
        </span>
      </span>
    </button>
  );
}

function NewFileTile({ folderId }: { folderId: ItemId | null }) {
  const { uploadFiles, conflictDialog } = useUploadFiles(folderId);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        aria-label="New file"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center gap-3 rounded-[10px] border border-dashed border-border bg-transparent px-3 py-3 text-left text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-foreground"
      >
        <span
          className="flex h-[34px] w-[30px] shrink-0 items-center justify-center rounded-[3px] border border-dashed border-current"
          aria-hidden
        >
          <FilePlus className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-medium">
            New file
          </span>
          <span className="mt-0.5 block truncate text-xs text-text-tertiary">
            PDF
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(event) => {
          const selected = event.target.files;
          if (selected && selected.length > 0) {
            void uploadFiles(selected);
          }
          event.target.value = "";
        }}
      />
      {conflictDialog}
    </>
  );
}

export function ContentsGrid({
  items,
  folderId,
  isSearching = false,
  onCreateFolder,
  onRename,
  onDelete,
  onPreviewFile,
  onOpenFolder,
  onShowInFolder,
}: ContentsGridProps) {
  const { data } = useBreadcrumbs(folderId);
  const breadcrumbs = data?.entries ?? [];
  const parentFolderName =
    folderId === null ? null : (breadcrumbs.at(-1)?.name ?? null);

  const folders = items.filter((item) => item.type === "folder");
  const files = items.filter((item) => item.type === "file");
  const showFolders = !isSearching || folders.length > 0;
  const showFiles = !isSearching || files.length > 0;

  return (
    <div className="flex flex-col gap-8">
      {showFolders && (
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
                onOpen={onOpenFolder}
              />
            ))}
            {!isSearching && (
              <NewFolderTile
                folderId={folderId}
                parentFolderName={parentFolderName}
                onClick={onCreateFolder}
              />
            )}
          </div>
        </section>
      )}

      {showFiles && (
        <section className="flex flex-col">
          <div className="grid grid-cols-[minmax(0,1fr)_2.5rem] gap-3 border-b border-border px-3 pb-2 text-[11px] font-bold tracking-[0.06em] text-text-tertiary uppercase md:grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_8rem_2.5rem]">
            <span>Name</span>
            <span className="hidden md:block">Size</span>
            <span className="hidden md:block">Modified</span>
            <span className="hidden md:block">Owner</span>
            <span className="sr-only">Actions</span>
          </div>
          {files.length > 0 && (
            <ul className="divide-y divide-border">
              {files.map((file) => (
                <li key={file.id}>
                  <FileItem
                    file={file}
                    onOpen={() => onPreviewFile(file)}
                    onRename={() => onRename(file)}
                    onDelete={() => onDelete(file)}
                    onShowInFolder={
                      isSearching && onShowInFolder
                        ? () => onShowInFolder(file.parentId)
                        : undefined
                    }
                  />
                </li>
              ))}
            </ul>
          )}
          {!isSearching && (
            <div className="py-3">
              <NewFileTile folderId={folderId} />
            </div>
          )}
        </section>
      )}
    </div>
  );
}
