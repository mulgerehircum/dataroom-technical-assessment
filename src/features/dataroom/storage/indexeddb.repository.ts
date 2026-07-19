import { getDataRoomDB } from "@/features/dataroom/storage/db";
import type { DataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import type {
  FileEntity,
  FolderEntity,
  ItemId,
} from "@/features/dataroom/model/types";

/** IndexedDB-backed repository. Methods are stubs until the storage layer is filled in. */
export const indexedDBRepository: DataRoomRepository = {
  async listChildren(_parentId: ItemId | null) {
    await getDataRoomDB();
    throw new Error("Not implemented: listChildren");
  },

  async getFolder(_id: ItemId): Promise<FolderEntity | undefined> {
    throw new Error("Not implemented: getFolder");
  },

  async createFolder(
    _name: string,
    _parentId: ItemId | null,
  ): Promise<FolderEntity> {
    throw new Error("Not implemented: createFolder");
  },

  async renameFolder(_id: ItemId, _name: string): Promise<void> {
    throw new Error("Not implemented: renameFolder");
  },

  async deleteFolder(_id: ItemId): Promise<void> {
    throw new Error("Not implemented: deleteFolder");
  },

  async createFile(_file: File, _parentId: ItemId | null): Promise<FileEntity> {
    throw new Error("Not implemented: createFile");
  },

  async renameFile(_id: ItemId, _name: string): Promise<void> {
    throw new Error("Not implemented: renameFile");
  },

  async deleteFile(_id: ItemId): Promise<void> {
    throw new Error("Not implemented: deleteFile");
  },
};
