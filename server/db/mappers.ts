import type {
  FileEntity,
  FolderEntity,
} from "../../src/features/dataroom/model/types.js";
import type { files, folders } from "./schema.js";

export function toFolderEntity(row: typeof folders.$inferSelect): FolderEntity {
  return {
    id: row.id,
    type: "folder",
    name: row.name,
    parentId: row.parentId,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

export function toFileEntity(row: typeof files.$inferSelect): FileEntity {
  return {
    id: row.id,
    type: "file",
    name: row.name,
    parentId: row.parentId,
    mimeType: row.mimeType as FileEntity["mimeType"],
    size: row.size,
    blobUrl: row.blobUrl,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}
