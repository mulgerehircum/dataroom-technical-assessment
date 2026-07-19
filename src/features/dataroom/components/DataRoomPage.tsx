import { useState } from "react";
import { useParams } from "react-router-dom";
import { DataRoomHeader } from "@/features/dataroom/components/DataRoomHeader";
import { Breadcrumbs } from "@/features/dataroom/components/Breadcrumbs";
import { ContentsGrid } from "@/features/dataroom/components/ContentsGrid";
import { UploadDropzone } from "@/features/dataroom/components/UploadDropzone";
import { FilePreview } from "@/features/dataroom/components/FilePreview";
import { CreateFolderDialog } from "@/features/dataroom/dialogs/CreateFolderDialog";
import { RenameItemDialog } from "@/features/dataroom/dialogs/RenameItemDialog";
import { DeleteItemDialog } from "@/features/dataroom/dialogs/DeleteItemDialog";
import { useFolderContents } from "@/features/dataroom/hooks/useFolderContents";
import { useSearch } from "@/features/dataroom/hooks/useSearch";
import type {
  DataRoomItem,
  FileEntity,
  ItemId,
} from "@/features/dataroom/model/types";

export function DataRoomPage() {
  const params = useParams<{ folderId?: string }>();
  const folderId: ItemId | null = params.folderId ?? null;
  const { data: items = [] } = useFolderContents(folderId);

  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults = [] } = useSearch(searchQuery);
  const isSearching = searchQuery.trim().length > 0;

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DataRoomItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DataRoomItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileEntity | null>(null);

  return (
    <div className="flex h-svh flex-col bg-background">
      <DataRoomHeader
        folderId={folderId}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
      {!isSearching && <Breadcrumbs currentFolderId={folderId} />}

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
        <ContentsGrid
          items={isSearching ? searchResults : items}
          folderId={folderId}
          onCreateFolder={() => setIsCreateFolderOpen(true)}
          onRename={setRenameTarget}
          onDelete={setDeleteTarget}
          onPreviewFile={setPreviewFile}
        />
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
          onClose={() => setRenameTarget(null)}
        />
      )}
      {deleteTarget && (
        <DeleteItemDialog
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
