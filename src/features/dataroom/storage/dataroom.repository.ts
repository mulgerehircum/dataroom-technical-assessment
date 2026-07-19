import type {
  DataRoomItem,
  FileEntity,
  FolderEntity,
  ItemId,
} from "@/features/dataroom/model/types";
import { apiRepository } from "@/features/dataroom/storage/api.repository";

export type FileConflictPolicy = "keepBoth" | "replace";

export interface CreateFileOptions {
  /** Defaults to `keepBoth` (append " (n)" before the extension). */
  onConflict?: FileConflictPolicy;
}

/** Storage-agnostic contract the hooks layer depends on. */
export interface DataRoomRepository {
  /**
   * Folder page payload: ancestors + children.
   * Missing folder (404) → empty ancestors. Other failures throw.
   */
  getFolderView(folderId: ItemId | null): Promise<{
    ancestors: FolderEntity[];
    items: DataRoomItem[];
  }>;
  listChildren(parentId: ItemId | null): Promise<DataRoomItem[]>;
  getFolder(id: ItemId): Promise<FolderEntity | undefined>;
  createFolder(name: string, parentId: ItemId | null): Promise<FolderEntity>;
  renameFolder(id: ItemId, name: string): Promise<FolderEntity>;
  /** Deletes the folder and everything nested inside it. */
  deleteFolder(id: ItemId): Promise<void>;
  createFile(
    file: File,
    parentId: ItemId | null,
    options?: CreateFileOptions,
  ): Promise<FileEntity>;
  renameFile(id: ItemId, name: string): Promise<FileEntity>;
  deleteFile(id: ItemId): Promise<void>;
  search(query: string): Promise<DataRoomItem[]>;
}

/** Swap implementations here (e.g. an in-memory fake for tests) without touching call sites. */
export const dataRoomRepository: DataRoomRepository = apiRepository;
