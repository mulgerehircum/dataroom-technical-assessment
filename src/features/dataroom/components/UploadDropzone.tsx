import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import { useUploadFiles } from "@/features/dataroom/hooks/useUploadFiles";
import type { ItemId } from "@/features/dataroom/model/types";

interface UploadDropzoneProps {
  folderId: ItemId | null;
  /** Ignore desktop drags (e.g. while search results are showing). */
  disabled?: boolean;
}

function isFileDrag(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

/** Full-window overlay that appears only while dragging files from the desktop. */
export function UploadDropzone({
  folderId,
  disabled = false,
}: UploadDropzoneProps) {
  const { uploadFiles, conflictDialog } = useUploadFiles(folderId);
  const [isDragActive, setIsDragActive] = useState(false);

  useEffect(() => {
    if (disabled) {
      setIsDragActive(false);
      return;
    }

    let dragDepth = 0;

    const reset = () => {
      dragDepth = 0;
      setIsDragActive(false);
    };

    const onDragEnter = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepth += 1;
      setIsDragActive(true);
    };

    const onDragLeave = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      dragDepth -= 1;
      if (dragDepth <= 0) reset();
    };

    const onDragOver = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
    };

    const onDrop = (event: DragEvent) => {
      if (!isFileDrag(event)) return;
      event.preventDefault();
      reset();
      const dropped = event.dataTransfer?.files;
      if (dropped && dropped.length > 0) {
        void uploadFiles(dropped);
      }
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [disabled, folderId, uploadFiles]);

  return (
    <>
      {isDragActive && !disabled && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-6"
        >
          <div className="flex w-full max-w-lg flex-col items-center justify-center gap-2 rounded-[10px] border-2 border-dashed border-primary bg-card px-8 py-16 text-[15px] font-medium text-foreground shadow-sm">
            <UploadCloud className="size-10 text-primary" />
            Drop PDF to upload
          </div>
        </div>
      )}
      {conflictDialog}
    </>
  );
}
