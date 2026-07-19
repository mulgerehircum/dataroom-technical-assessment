import { useState } from "react";
import { useParams } from "react-router-dom";
import { DataRoomHeader } from "@/features/dataroom/components/DataRoomHeader";
import { Breadcrumbs } from "@/features/dataroom/components/Breadcrumbs";
import { ContentsGrid } from "@/features/dataroom/components/ContentsGrid";
import { ContentsSkeleton } from "@/features/dataroom/components/ContentsSkeleton";
import { UploadDropzone } from "@/features/dataroom/components/UploadDropzone";
import { FilePreview } from "@/features/dataroom/components/FilePreview";
import { CreateFolderDialog } from "@/features/dataroom/dialogs/CreateFolderDialog";
import { RenameItemDialog } from "@/features/dataroom/dialogs/RenameItemDialog";
import { DeleteItemDialog } from "@/features/dataroom/dialogs/DeleteItemDialog";
import { useFileActions } from "@/features/dataroom/hooks/useFileActions";
import { useFolderActions } from "@/features/dataroom/hooks/useFolderActions";
import { useFolderContents } from "@/features/dataroom/hooks/useFolderContents";
import { useSearch } from "@/features/dataroom/hooks/useSearch";
import { useSearchHistory } from "@/features/dataroom/hooks/useSearchHistory";
import type {
  DataRoomItem,
  FileEntity,
  ItemId,
} from "@/features/dataroom/model/types";

export function DataRoomPage() {
  const params = useParams<{ folderId?: string }>();
  const folderId: ItemId | null = params.folderId ?? null;
  const { data: items = [], isPending: folderPending } =
    useFolderContents(folderId);
  const { deleteFolder, renameFolder } = useFolderActions();
  const { deleteFile, renameFile } = useFileActions();

  const [searchQuery, setSearchQuery] = useState("");
  const searchHistory = useSearchHistory();
  const { data: searchResults = [], isPending: searchPending } = useSearch(
    searchQuery,
    searchHistory.add,
  );
  const isSearching = searchQuery.trim().length > 0;
  // First load / new folder / new search only — background polls keep showing data.
  const showSkeleton = isSearching ? searchPending : folderPending;

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DataRoomItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DataRoomItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileEntity | null>(null);

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
      />
      {!isSearching && <Breadcrumbs currentFolderId={folderId} />}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        {showSkeleton ? (
          <ContentsSkeleton />
        ) : (
          <ContentsGrid
            items={isSearching ? searchResults : items}
            folderId={folderId}
            onCreateFolder={() => setIsCreateFolderOpen(true)}
            onRename={setRenameTarget}
            onDelete={setDeleteTarget}
            onPreviewFile={setPreviewFile}
          />
        )}
      </div>

      <UploadDropzone folderId={folderId} />

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
