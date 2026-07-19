import type { ItemId } from "@/features/dataroom/model/types";

interface UploadDropzoneProps {
  folderId: ItemId | null;
}

// TODO: wire drag-and-drop + a hidden <input type="file" accept="application/pdf">
// to useFileActions().uploadFile, validating with validateFileUpload().
export function UploadDropzone(_props: UploadDropzoneProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-sm text-muted-foreground">
      Drag PDF files here to upload
    </div>
  );
}
