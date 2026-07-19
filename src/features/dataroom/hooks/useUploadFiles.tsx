import { useCallback, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UploadConflictDialog,
  type ConflictDialogRequest,
  type ConflictDialogResolution,
} from "@/features/dataroom/dialogs/UploadConflictDialog";
import { useFileActions } from "@/features/dataroom/hooks/useFileActions";
import { folderContentsQueryKey } from "@/features/dataroom/hooks/useFolderContents";
import type { FolderViewData } from "@/features/dataroom/hooks/folder-view";
import { validateFileUpload } from "@/features/dataroom/model/validation";
import type { DataRoomItem, ItemId } from "@/features/dataroom/model/types";
import type { FileConflictPolicy } from "@/features/dataroom/storage/dataroom.repository";

interface UploadOutcome {
  uploaded: number;
  failed: number;
  skipped: number;
}

function summarizeOutcomes(total: number, outcome: UploadOutcome): void {
  if (total <= 1) return;

  const parts: string[] = [];
  if (outcome.uploaded > 0) {
    parts.push(`${outcome.uploaded} uploaded`);
  }
  if (outcome.failed > 0) {
    parts.push(`${outcome.failed} failed`);
  }
  if (outcome.skipped > 0) {
    parts.push(`${outcome.skipped} skipped`);
  }
  if (parts.length === 0) return;

  const message = parts.join(", ");
  if (outcome.failed > 0) {
    toast.error(message);
  } else if (outcome.skipped > 0 && outcome.uploaded === 0) {
    toast.message(message);
  } else {
    toast.success(message);
  }
}

function findConflictingFileName(
  items: DataRoomItem[] | undefined,
  fileName: string,
): boolean {
  return (
    items?.some(
      (item) =>
        item.type === "file" && item.name === fileName && !item.isUploading,
    ) ?? false
  );
}

/**
 * Validates, resolves name conflicts, and uploads one or more files into
 * `folderId`. Renders `conflictDialog` while a Replace / Keep both / Cancel
 * choice is pending.
 */
export function useUploadFiles(folderId: ItemId | null) {
  const queryClient = useQueryClient();
  const { uploadFile } = useFileActions();
  const uploadFileRef = useRef(uploadFile);
  uploadFileRef.current = uploadFile;

  const [conflictRequest, setConflictRequest] =
    useState<ConflictDialogRequest | null>(null);
  const conflictResolverRef = useRef<
    | ((value: {
        resolution: ConflictDialogResolution;
        applyToAll: boolean;
      }) => void)
    | null
  >(null);

  const askConflict = useCallback(
    (
      fileName: string,
      remainingConflicts: number,
    ): Promise<{
      resolution: ConflictDialogResolution;
      applyToAll: boolean;
    }> =>
      new Promise((resolve) => {
        conflictResolverRef.current = resolve;
        setConflictRequest({ fileName, remainingConflicts });
      }),
    [],
  );

  const handleConflictResolve = (
    resolution: ConflictDialogResolution,
    applyToAll: boolean,
  ) => {
    const resolve = conflictResolverRef.current;
    conflictResolverRef.current = null;
    setConflictRequest(null);
    resolve?.({ resolution, applyToAll });
  };

  const uploadFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const files = Array.from(incoming);
      if (files.length === 0) return;

      const outcome: UploadOutcome = { uploaded: 0, failed: 0, skipped: 0 };
      const valid: File[] = [];

      for (const file of files) {
        const validation = validateFileUpload(file);
        if (!validation.ok) {
          outcome.skipped += 1;
          toast.error(`${file.name}: ${validation.message}`);
          continue;
        }
        valid.push(file);
      }

      if (valid.length === 0) {
        summarizeOutcomes(files.length, outcome);
        return;
      }

      const queryKey = folderContentsQueryKey(folderId);
      const siblings = queryClient.getQueryData<FolderViewData>(queryKey)?.items;
      const conflicting = valid.filter((file) =>
        findConflictingFileName(siblings, file.name),
      );
      let applyPolicy: FileConflictPolicy | "cancel" | null = null;
      let conflictIndex = 0;

      for (const file of valid) {
        const hasConflict = findConflictingFileName(
          queryClient.getQueryData<FolderViewData>(queryKey)?.items,
          file.name,
        );

        let onConflict: FileConflictPolicy | undefined;

        if (hasConflict) {
          const remaining = conflicting.length - conflictIndex - 1;
          conflictIndex += 1;

          let resolution: ConflictDialogResolution;
          if (applyPolicy !== null) {
            resolution = applyPolicy;
          } else {
            const answer = await askConflict(file.name, remaining);
            resolution = answer.resolution;
            if (answer.applyToAll) {
              applyPolicy = resolution;
            }
          }

          if (resolution === "cancel") {
            outcome.skipped += 1;
            continue;
          }
          onConflict = resolution;
        }

        try {
          await uploadFileRef.current.mutateAsync({
            file,
            parentId: folderId,
            onConflict,
          });
          outcome.uploaded += 1;
        } catch (error) {
          outcome.failed += 1;
          const message =
            error instanceof Error ? error.message : "Upload failed";
          toast.error(`${file.name}: ${message}`);
        }
      }

      summarizeOutcomes(files.length, outcome);
    },
    [askConflict, folderId, queryClient],
  );

  const conflictDialog = conflictRequest ? (
    <UploadConflictDialog
      request={conflictRequest}
      onResolve={handleConflictResolve}
    />
  ) : null;

  return { uploadFiles, conflictDialog };
}
