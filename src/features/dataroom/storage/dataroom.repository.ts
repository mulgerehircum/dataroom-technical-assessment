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

let activeRepository: DataRoomRepository = apiRepository;

/**
 * Swaps the live implementation (e.g. the read-only demo repository for
 * `/demo`). Call synchronously during render — never in an effect — so
 * queries that mount in the same commit see the right implementation.
 */
export function setDataRoomRepository(repository: DataRoomRepository): void {
  activeRepository = repository;
}

/** Stable object whose methods delegate to whichever implementation is currently active. */
export const dataRoomRepository: DataRoomRepository = {
  getFolderView: (folderId) => activeRepository.getFolderView(folderId),
  listChildren: (parentId) => activeRepository.listChildren(parentId),
  getFolder: (id) => activeRepository.getFolder(id),
  createFolder: (name, parentId) => activeRepository.createFolder(name, parentId),
  renameFolder: (id, name) => activeRepository.renameFolder(id, name),
  deleteFolder: (id) => activeRepository.deleteFolder(id),
  createFile: (file, parentId, options) =>
    activeRepository.createFile(file, parentId, options),
  renameFile: (id, name) => activeRepository.renameFile(id, name),
  deleteFile: (id) => activeRepository.deleteFile(id),
  search: (query) => activeRepository.search(query),
};
