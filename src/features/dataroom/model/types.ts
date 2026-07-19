/**
 * Root-level items have `parentId: null`. Folders nest under other folders;
 * files always live inside a folder (or at the root).
 */
export type ItemId = string;

export interface FolderEntity {
  id: ItemId;
  type: "folder";
  name: string;
  parentId: ItemId | null;
  createdAt: number;
  updatedAt: number;
}

export type SupportedFileMimeType = "application/pdf";

export interface FileEntity {
  id: ItemId;
  type: "file";
  name: string;
  parentId: ItemId | null;
  mimeType: SupportedFileMimeType;
  size: number;
  /** Public Vercel Blob URL — usable directly as an <iframe>/<a> src. */
  blobUrl: string;
  createdAt: number;
  updatedAt: number;
  /** Client-only: optimistic row while the upload mutation is in flight. */
  isUploading?: boolean;
}

export type DataRoomItem = FolderEntity | FileEntity;

export interface BreadcrumbEntry {
  id: ItemId | null;
  name: string;
}
