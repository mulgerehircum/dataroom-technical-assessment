import { useRef, useState, type DragEvent } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadFiles } from "@/features/dataroom/hooks/useUploadFiles";
import type { ItemId } from "@/features/dataroom/model/types";

interface EmptyStateProps {
  folderId: ItemId | null;
}

export function EmptyState({ folderId }: EmptyStateProps) {
  const { uploadFiles, conflictDialog } = useUploadFiles(folderId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);
    const dropped = event.dataTransfer.files;
    if (dropped && dropped.length > 0) {
      void uploadFiles(dropped);
    }
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "flex flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border bg-card p-12 text-muted-foreground transition-colors hover:bg-accent",
          isDragActive && "border-primary bg-accent text-foreground",
        )}
      >
        <UploadCloud className="size-10 text-text-tertiary" />
        <p className="text-[13.5px] font-medium">This folder is empty.</p>
        <p className="text-[12.5px]">Drop a PDF here or click to upload</p>
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
      </div>
      {conflictDialog}
    </>
  );
}
