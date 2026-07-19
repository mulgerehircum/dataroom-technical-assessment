import { useRef, useState } from "react";
import { Clock, Pencil, Search, Upload, X } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBreadcrumbs } from "@/features/dataroom/hooks/useBreadcrumbs";
import { useUploadFiles } from "@/features/dataroom/hooks/useUploadFiles";
import { ROOT_FOLDER_NAME } from "@/features/dataroom/model/constants";
import type { FolderEntity, ItemId } from "@/features/dataroom/model/types";

interface DataRoomHeaderProps {
  folderId: ItemId | null;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onRenameFolder: (folder: FolderEntity) => void;
  searchHistory: string[];
  onRemoveSearchHistory: (query: string) => void;
  onClearSearchHistory: () => void;
  /** Hide/disable upload while search results are showing. */
  uploadDisabled?: boolean;
}

export function DataRoomHeader({
  folderId,
  searchQuery,
  onSearchQueryChange,
  onRenameFolder,
  searchHistory,
  onRemoveSearchHistory,
  onClearSearchHistory,
  uploadDisabled = false,
}: DataRoomHeaderProps) {
  const { uploadFiles, conflictDialog } = useUploadFiles(folderId);
  const { data } = useBreadcrumbs(folderId);
  const breadcrumbs = data?.entries ?? [];
  const currentFolder = data?.ancestors.at(-1) ?? null;
  const inputRef = useRef<HTMLInputElement>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isSearching = searchQuery.trim().length > 0;
  const title = isSearching
    ? "Search"
    : folderId === null
      ? ROOT_FOLDER_NAME
      : (breadcrumbs.at(-1)?.name ?? ROOT_FOLDER_NAME);

  const showHistory =
    historyOpen &&
    searchHistory.length > 0 &&
    searchQuery.trim() === "";

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:gap-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[12px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            Acme Data Room
          </p>
          <div className="flex items-center gap-1.5">
            <h1 className="truncate text-2xl font-extrabold tracking-tight">
              {title}
            </h1>
            {!isSearching && currentFolder && (
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
        <div className="relative order-last w-full max-w-sm sm:order-0 sm:flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            onFocus={() => setHistoryOpen(true)}
            onBlur={() => setHistoryOpen(false)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                if (searchQuery) {
                  onSearchQueryChange("");
                  return;
                }
                setHistoryOpen(false);
                event.currentTarget.blur();
              }
            }}
            placeholder="Search by name..."
            className="rounded-lg border-border bg-card pr-8 pl-8"
            aria-label="Search by name"
            aria-autocomplete="list"
            aria-expanded={showHistory}
            aria-controls={showHistory ? "search-history-list" : undefined}
          />
          {isSearching && (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute top-1/2 right-2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSearchQueryChange("")}
            >
              <X className="size-3.5" />
            </button>
          )}
          {showHistory && (
            <div
              id="search-history-list"
              role="listbox"
              aria-label="Recent searches"
              className="absolute top-full z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-md"
              onMouseDown={(event) => event.preventDefault()}
            >
              <ul className="max-h-64 overflow-y-auto py-1">
                {searchHistory.map((entry) => (
                  <li key={entry} role="option" className="flex items-center gap-1 px-1">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                      onClick={() => {
                        onSearchQueryChange(entry);
                        setHistoryOpen(false);
                      }}
                    >
                      <Clock className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{entry}</span>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove ${entry} from history`}
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => onRemoveSearchHistory(entry)}
                    >
                      <X className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border px-1 py-1">
                <button
                  type="button"
                  className="w-full rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => {
                    onClearSearchHistory();
                    setHistoryOpen(false);
                  }}
                >
                  Clear history
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!uploadDisabled && (
            <Button
              size="sm"
              onClick={() => inputRef.current?.click()}
              className="rounded-lg px-4 font-bold tracking-[0.02em] uppercase"
            >
              <Upload />
              Upload
            </Button>
          )}
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
