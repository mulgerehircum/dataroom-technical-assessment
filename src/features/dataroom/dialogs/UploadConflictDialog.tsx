import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FileConflictPolicy } from "@/features/dataroom/storage/dataroom.repository";

export type ConflictDialogResolution = FileConflictPolicy | "cancel";

export interface ConflictDialogRequest {
  fileName: string;
  remainingConflicts: number;
}

interface UploadConflictDialogProps {
  request: ConflictDialogRequest;
  onResolve: (
    resolution: ConflictDialogResolution,
    applyToAll: boolean,
  ) => void;
}

export function UploadConflictDialog({
  request,
  onResolve,
}: UploadConflictDialogProps) {
  const [applyToAll, setApplyToAll] = useState(false);
  const settledRef = useRef(false);
  const showApplyToAll = request.remainingConflicts > 0;

  useEffect(() => {
    settledRef.current = false;
    setApplyToAll(false);
  }, [request.fileName, request.remainingConflicts]);

  const settle = (
    resolution: ConflictDialogResolution,
    apply: boolean,
  ) => {
    if (settledRef.current) return;
    settledRef.current = true;
    onResolve(resolution, apply);
  };

  return (
    <AlertDialog open onOpenChange={(next) => !next && settle("cancel", false)}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>File already exists</AlertDialogTitle>
          <AlertDialogDescription>
            {`"${request.fileName}" already exists in this folder.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {showApplyToAll && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(event) => setApplyToAll(event.target.checked)}
              className="size-4 rounded border-border"
            />
            <span>Apply to all remaining conflicts</span>
          </label>
        )}
        <AlertDialogFooter className="sm:justify-end">
          <AlertDialogCancel onClick={() => settle("cancel", applyToAll)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="outline"
            onClick={() => settle("keepBoth", applyToAll)}
          >
            Keep both
          </AlertDialogAction>
          <AlertDialogAction onClick={() => settle("replace", applyToAll)}>
            Replace
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
