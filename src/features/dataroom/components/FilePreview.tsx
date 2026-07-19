import { Download, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import type { FileEntity } from "@/features/dataroom/model/types";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  file: FileEntity;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader className="flex-row items-center gap-3 space-y-0 pr-8">
          <DialogTitle className="min-w-0 flex-1 truncate">
            {file.name}
          </DialogTitle>
          <div className="flex shrink-0 items-center gap-1">
            <a
              href={file.blobUrl}
              download={file.name}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-lg",
              )}
            >
              <Download className="size-3.5" />
              Download
            </a>
            <a
              href={file.blobUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${file.name} in a new tab`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon-sm" }),
                "rounded-lg",
              )}
            >
              <ExternalLink className="size-4" />
            </a>
          </div>
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
