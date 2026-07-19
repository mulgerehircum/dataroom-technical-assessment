import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  DB_NAME,
  DB_VERSION,
  FILES_STORE,
  FOLDERS_STORE,
} from "@/features/dataroom/model/constants";
import type {
  FileEntity,
  FolderEntity,
} from "@/features/dataroom/model/types";

/**
 * IndexedDB indexes silently omit records whose indexed field is `null`, so
 * root-level items (parentId: null) are persisted under this sentinel and
 * mapped back to `null` at the repository boundary.
 */
export const ROOT_PARENT_KEY = "__root__";

export interface StoredFolder extends Omit<FolderEntity, "parentId"> {
  parentId: string;
}

export interface StoredFile extends Omit<FileEntity, "parentId"> {
  parentId: string;
}

export interface DataRoomDBSchema extends DBSchema {
  [FOLDERS_STORE]: {
    key: string;
    value: StoredFolder;
    indexes: { byParentId: string };
  };
  [FILES_STORE]: {
    key: string;
    value: StoredFile;
    indexes: { byParentId: string };
  };
}

let dbPromise: Promise<IDBPDatabase<DataRoomDBSchema>> | null = null;

export function getDataRoomDB(): Promise<IDBPDatabase<DataRoomDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DataRoomDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const folders = db.createObjectStore(FOLDERS_STORE, {
          keyPath: "id",
        });
        folders.createIndex("byParentId", "parentId");

        const files = db.createObjectStore(FILES_STORE, { keyPath: "id" });
        files.createIndex("byParentId", "parentId");
      },
    });
  }
  return dbPromise;
}
