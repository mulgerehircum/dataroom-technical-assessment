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
  listChildren(parentId: ItemId | null): Promise<DataRoomItem[]>;
  getFolder(id: ItemId): Promise<FolderEntity | undefined>;
  /**
   * Ancestor chain root→leaf for `id`. Empty when the folder does not exist
   * (mirrors the API's 404 → [] handling on the client).
   */
  listBreadcrumbChain(id: ItemId): Promise<FolderEntity[]>;
  createFolder(name: string, parentId: ItemId | null): Promise<FolderEntity>;
  renameFolder(id: ItemId, name: string): Promise<void>;
  /** Deletes the folder and everything nested inside it. */
  deleteFolder(id: ItemId): Promise<void>;
  createFile(
    file: File,
    parentId: ItemId | null,
    options?: CreateFileOptions,
  ): Promise<FileEntity>;
  renameFile(id: ItemId, name: string): Promise<void>;
  deleteFile(id: ItemId): Promise<void>;
  search(query: string): Promise<DataRoomItem[]>;
}

/** Swap implementations here (e.g. an in-memory fake for tests) without touching call sites. */
export const dataRoomRepository: DataRoomRepository = apiRepository;
