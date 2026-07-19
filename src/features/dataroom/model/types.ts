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
  /** Clerk user id of the folder owner. */
  ownerId: string;
  /** Immediate child folders + files (not recursive). */
  itemCount: number;
  createdAt: number;
  updatedAt: number;
  /** Client-only: optimistic card while createFolder is in flight. */
  isCreating?: boolean;
  /**
   * Ancestor path for search results, e.g. `"Data Room / Contracts"`.
   * Absent in normal folder listings.
   */
  path?: string;
}

export type SupportedFileMimeType = "application/pdf";

export interface FileEntity {
  id: ItemId;
  type: "file";
  name: string;
  parentId: ItemId | null;
  /** Clerk user id of the file owner. */
  ownerId: string;
  mimeType: SupportedFileMimeType;
  size: number;
  /** Public Vercel Blob URL — usable directly as an <iframe>/<a> src. */
  blobUrl: string;
  createdAt: number;
  updatedAt: number;
  /** Client-only: optimistic row while the upload mutation is in flight. */
  isUploading?: boolean;
  /**
   * Ancestor path for search results, e.g. `"Data Room / Contracts"`.
   * Absent in normal file listings.
   */
  path?: string;
}

export type DataRoomItem = FolderEntity | FileEntity;

export interface BreadcrumbEntry {
  id: ItemId | null;
  name: string;
}
