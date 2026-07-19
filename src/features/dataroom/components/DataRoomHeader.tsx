import type { ItemId } from "@/features/dataroom/model/types";

interface DataRoomHeaderProps {
  folderId: ItemId | null;
}

// TODO: add "New folder" / "Upload" actions once CreateFolderDialog and
// UploadDropzone are wired to useFolderActions / useFileActions.
export function DataRoomHeader(_props: DataRoomHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-lg font-semibold">Data Room</h1>
    </header>
  );
}
