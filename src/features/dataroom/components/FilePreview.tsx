import type { FileEntity } from "@/features/dataroom/model/types";

interface FilePreviewProps {
  file: FileEntity;
  onClose: () => void;
}

// TODO: render the PDF, e.g. an <iframe> over URL.createObjectURL(file.blob).
export function FilePreview({ file, onClose: _onClose }: FilePreviewProps) {
  return (
    <div className="p-6 text-sm text-muted-foreground">
      Preview for {file.name} (not yet implemented).
    </div>
  );
}
