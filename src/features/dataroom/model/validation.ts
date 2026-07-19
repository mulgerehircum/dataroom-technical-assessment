import {
  ALLOWED_FILE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_ITEM_NAME_LENGTH,
} from "@/features/dataroom/model/constants";

export type ValidationResult =
  | { ok: true }
  | { ok: false; message: string };

const ILLEGAL_NAME_CHARS = /[/\\:*?"<>|]/;

export function validateItemName(rawName: string): ValidationResult {
  const name = rawName.trim();

  if (name.length === 0) {
    return { ok: false, message: "Name cannot be empty." };
  }
  if (name.length > MAX_ITEM_NAME_LENGTH) {
    return {
      ok: false,
      message: `Name cannot exceed ${MAX_ITEM_NAME_LENGTH} characters.`,
    };
  }
  if (ILLEGAL_NAME_CHARS.test(name)) {
    return { ok: false, message: `Name cannot contain \\ / : * ? " < > |` };
  }

  return { ok: true };
}

export function validateFileUpload(file: File): ValidationResult {
  if (!ALLOWED_FILE_MIME_TYPES.includes(file.type as never)) {
    return { ok: false, message: "Only PDF files are supported." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      message: `File exceeds the ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB limit.`,
    };
  }

  return validateItemName(file.name);
}
