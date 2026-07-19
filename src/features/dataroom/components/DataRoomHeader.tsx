import { useRef } from "react";
import { Pencil, Search, Upload } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/features/dataroom/hooks/useBreadcrumbs";
import { useFolder } from "@/features/dataroom/hooks/useFolder";
import { useUploadFiles } from "@/features/dataroom/hooks/useUploadFiles";
import type { FolderEntity, ItemId } from "@/features/dataroom/model/types";

interface DataRoomHeaderProps {
  folderId: ItemId | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onRenameFolder: (folder: FolderEntity) => void;
}

export function DataRoomHeader({
  folderId,
  searchQuery,
  onSearchQueryChange,
  onRenameFolder,
}: DataRoomHeaderProps) {
  const { uploadFiles, conflictDialog } = useUploadFiles(folderId);
  const { data: breadcrumbs = [] } = useBreadcrumbs(folderId);
  const { data: currentFolder } = useFolder(folderId);
  const inputRef = useRef<HTMLInputElement>(null);
  const title =
    folderId === null ? "All Files" : (breadcrumbs.at(-1)?.name ?? "All Files");

  return (
    <>
      <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
        <div className="min-w-0">
          <p className="text-[12px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Acme Data Room
          </p>
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-2xl font-extrabold tracking-tight">
              {title}
            </h1>
            {currentFolder && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Rename ${currentFolder.name}`}
                onClick={() => onRenameFolder(currentFolder)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <Pencil className="size-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder="Search by name..."
            className="rounded-lg border-border bg-card pl-8"
          />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg px-4 font-bold tracking-[0.02em] uppercase"
          >
            <Upload />
            Upload
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
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
      </header>
      {conflictDialog}
    </>
  );
}
