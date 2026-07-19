import { useEffect, useState } from "react";
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
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  // Create and revoke within the same effect (not split across useMemo +
  // useEffect) so React 18 StrictMode's dev-only double-invoke of effects
  // can't revoke a URL that a memo never recomputes, which otherwise leaves
  // the iframe pointed at an already-revoked blob URL.
  useEffect(() => {
    const url = URL.createObjectURL(file.blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file.blob]);

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{file.name}</DialogTitle>
        </DialogHeader>
        {objectUrl && (
          <iframe
            src={objectUrl}
            title={file.name}
            className="h-[70vh] w-full rounded-md border"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
