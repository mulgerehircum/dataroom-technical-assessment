import type { SupportedFileMimeType } from "./types.js";

export const ROOT_FOLDER_ID = null;
export const ROOT_FOLDER_NAME = "Data Room";

export const ALLOWED_FILE_MIME_TYPES: readonly SupportedFileMimeType[] = [
  "application/pdf",
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_ITEM_NAME_LENGTH = 120;
