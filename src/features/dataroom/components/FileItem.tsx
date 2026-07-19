import { FileText } from "lucide-react";
import type { FileEntity } from "@/features/dataroom/model/types";
import { formatFileSize } from "@/features/dataroom/utils/format-file-size";

interface FileItemProps {
  file: FileEntity;
}

// TODO: open FilePreview on click, add rename/delete via context menu.
export function FileItem({ file }: FileItemProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md p-3 text-center hover:bg-accent">
      <FileText className="size-10 text-muted-foreground" />
      <span className="w-full truncate text-sm">{file.name}</span>
      <span className="text-xs text-muted-foreground">
        {formatFileSize(file.size)}
      </span>
    </div>
  );
}
