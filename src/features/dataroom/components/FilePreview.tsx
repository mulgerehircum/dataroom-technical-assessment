import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FileEntity } from "@/features/dataroom/model/types";

interface FilePreviewProps {
  file: FileEntity;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
        </DialogHeader>
        <iframe
          src={file.blobUrl}
          title={file.name}
          className="h-[70vh] w-full rounded-md border"
        />
      </DialogContent>
    </Dialog>
  );
}
