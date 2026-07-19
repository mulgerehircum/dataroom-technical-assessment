import { useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFileActions } from "@/features/dataroom/hooks/useFileActions";
import type { ItemId } from "@/features/dataroom/model/types";

interface UploadDropzoneProps {
  folderId: ItemId | null;
}

export function UploadDropzone({ folderId }: UploadDropzoneProps) {
  const { uploadFile } = useFileActions();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const upload = (file: File) => {
    uploadFile.mutate(
      { file, parentId: folderId },
      { onError: (error) => toast.error(error.message) },
    );
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const file = event.dataTransfer.files[0];
    if (file) upload(file);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragActive(true);
      }}
      onDragLeave={() => setIsDragActive(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[10px] border border-dashed border-border bg-card p-6 text-[13.5px] text-muted-foreground transition-colors hover:bg-accent",
        isDragActive && "border-primary bg-accent text-foreground",
      )}
    >
      <UploadCloud className="size-6" />
      Drag a PDF here or click to upload
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
