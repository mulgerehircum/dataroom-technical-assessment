import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { DataRoomHeader } from "@/features/dataroom/components/DataRoomHeader";
import { Breadcrumbs } from "@/features/dataroom/components/Breadcrumbs";
import { ContentsGrid } from "@/features/dataroom/components/ContentsGrid";
import { ContentsSkeleton } from "@/features/dataroom/components/ContentsSkeleton";
import { QueryErrorState } from "@/features/dataroom/components/QueryErrorState";
import { SearchEmptyState } from "@/features/dataroom/components/SearchEmptyState";
import { UploadDropzone } from "@/features/dataroom/components/UploadDropzone";
import { FilePreview } from "@/features/dataroom/components/FilePreview";
import { CreateFolderDialog } from "@/features/dataroom/dialogs/CreateFolderDialog";
import { RenameItemDialog } from "@/features/dataroom/dialogs/RenameItemDialog";
import { DeleteItemDialog } from "@/features/dataroom/dialogs/DeleteItemDialog";
import { useFolderView } from "@/features/dataroom/hooks/useFolderView";
import { useFileActions } from "@/features/dataroom/hooks/useFileActions";
import { useFolderActions } from "@/features/dataroom/hooks/useFolderActions";
import { useSearch } from "@/features/dataroom/hooks/useSearch";
import { useSearchHistory } from "@/features/dataroom/hooks/useSearchHistory";
import { dataRoomFolderPath, dataRoomRootPath } from "@/features/dataroom/utils/routes";
import type {
  DataRoomItem,
  FileEntity,
  ItemId,
} from "@/features/dataroom/model/types";

interface DataRoomPageProps {
  /** Public read/write demo with no Clerk session behind it. */
  isDemo?: boolean;
}

export function DataRoomPage({ isDemo = false }: DataRoomPageProps) {
  const basePath = isDemo ? "/demo" : "";
  const params = useParams<{ folderId?: string }>();
  const folderId: ItemId | null = params.folderId ?? null;
  const navigate = useNavigate();
  const {
    data: folderView,
    isPending: folderPending,
    isFetched: folderFetched,
    isPlaceholderData: folderPlaceholder,
    isError: folderIsError,
    error: folderError,
    refetch: refetchFolder,
  } = useFolderView(folderId);
  const { deleteFolder, renameFolder } = useFolderActions();
  const { deleteFile, renameFile } = useFileActions();

  const [searchQuery, setSearchQuery] = useState("");
  const searchHistory = useSearchHistory();
  const {
    data: searchResults = [],
    isPending: searchPending,
    isError: searchIsError,
    error: searchError,
    refetch: refetchSearch,
  } = useSearch(searchQuery, searchHistory.add);
  const isSearching = searchQuery.trim().length > 0;
  const items = folderView?.items ?? [];
  // First load / new folder / new search only — background polls keep showing data.
  const showSkeleton = isSearching ? searchPending : folderPending;

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DataRoomItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DataRoomItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileEntity | null>(null);

  // Missing / deleted folder: empty ancestors after a real successful fetch
  // (ignore CLS placeholder and network errors — those get a retry UI).
  const folderMissing =
    folderId !== null &&
    folderFetched &&
    !folderPlaceholder &&
    !folderIsError &&
    (folderView?.ancestors.length ?? 0) === 0;

  useEffect(() => {
    if (!folderMissing) return;
    toast.error("This folder no longer exists.");
    navigate(dataRoomRootPath(basePath), { replace: true });
  }, [folderMissing, navigate, basePath]);

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const mutation =
      deleteTarget.type === "folder" ? deleteFolder : deleteFile;
    mutation.mutate(deleteTarget.id);
  };

  const handleConfirmRename = (name: string) => {
    if (!renameTarget) return;
    const mutation =
      renameTarget.type === "folder" ? renameFolder : renameFile;
    mutation.mutate({ id: renameTarget.id, name });
  };

  const clearSearch = () => setSearchQuery("");

  const showInFolder = (parentId: ItemId | null) => {
    clearSearch();
    navigate(parentId === null ? dataRoomRootPath(basePath) : dataRoomFolderPath(basePath, parentId));
  };

  if (folderMissing) {
    return null;
  }

  const mainContent = (() => {
    if (showSkeleton) return <ContentsSkeleton />;
    if (isSearching && searchIsError) {
      return (
        <QueryErrorState
          message={
            searchError instanceof Error
              ? searchError.message
              : "Search failed."
          }
          onRetry={() => {
            void refetchSearch();
          }}
        />
      );
    }
    if (isSearching && searchResults.length === 0) {
      return <SearchEmptyState query={searchQuery} />;
    }
    if (!isSearching && folderIsError) {
      return (
        <QueryErrorState
          message={
            folderError instanceof Error
              ? folderError.message
              : "Could not load this folder."
          }
          onRetry={() => {
            void refetchFolder();
          }}
        />
      );
    }
    return (
      <ContentsGrid
        items={isSearching ? searchResults : items}
        folderId={folderId}
        isSearching={isSearching}
        basePath={basePath}
        onCreateFolder={() => setIsCreateFolderOpen(true)}
        onRename={setRenameTarget}
        onDelete={setDeleteTarget}
        onPreviewFile={setPreviewFile}
        onOpenFolder={clearSearch}
        onShowInFolder={showInFolder}
      />
    );
  })();

  return (
    <div className="flex h-svh flex-col bg-background">
      <DataRoomHeader
        folderId={folderId}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onRenameFolder={setRenameTarget}
        searchHistory={searchHistory.history}
        onRemoveSearchHistory={searchHistory.remove}
        onClearSearchHistory={searchHistory.clear}
        uploadDisabled={isSearching}
        isDemo={isDemo}
      />
      {!isSearching && <Breadcrumbs currentFolderId={folderId} basePath={basePath} />}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        {mainContent}
      </div>

      <UploadDropzone folderId={folderId} disabled={isSearching} />

      <CreateFolderDialog
        parentId={folderId}
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
      />
      {renameTarget && (
        <RenameItemDialog
          item={renameTarget}
          onConfirm={handleConfirmRename}
          onClose={() => setRenameTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteItemDialog
          item={deleteTarget}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
