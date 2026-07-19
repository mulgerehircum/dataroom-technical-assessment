import type { SupportedFileMimeType } from "@/features/dataroom/model/types";

export const ROOT_FOLDER_ID = null;
export const ROOT_FOLDER_NAME = "Data Room";

export const ALLOWED_FILE_MIME_TYPES: readonly SupportedFileMimeType[] = [
  "application/pdf",
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_ITEM_NAME_LENGTH = 120;

export const DB_NAME = "dataroom-db";
export const DB_VERSION = 1;
export const FOLDERS_STORE = "folders";
export const FILES_STORE = "files";
