import { and, eq, isNull, sql, type SQLWrapper } from "drizzle-orm";
import type {
  DataRoomItem,
  FileEntity,
  FolderEntity,
} from "../../src/features/dataroom/model/types.js";
import { getDb } from "./client.js";
import { toFileEntity, toFolderEntity } from "./mappers.js";
import { files, folders } from "./schema.js";

function parentFilter(
  column: typeof folders.parentId | typeof files.parentId,
  parentId: string | null,
): SQLWrapper {
  return parentId === null ? isNull(column) : eq(column, parentId);
}

/** Folders before files, alphabetical within each group. */
function sortItems(items: DataRoomItem[]): DataRoomItem[] {
  return [...items].sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function getFolderOwned(
  id: string,
  ownerId: string,
): Promise<FolderEntity | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(folders)
    .where(and(eq(folders.id, id), eq(folders.ownerId, ownerId)));
  return row ? toFolderEntity(row) : undefined;
}

export async function getFileOwned(
  id: string,
  ownerId: string,
): Promise<FileEntity | undefined> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, id), eq(files.ownerId, ownerId)));
  return row ? toFileEntity(row) : undefined;
}

export async function listChildren(
  parentId: string | null,
  ownerId: string,
): Promise<DataRoomItem[]> {
  const db = getDb();
  const [folderRows, fileRows] = await Promise.all([
    db
      .select()
      .from(folders)
      .where(and(eq(folders.ownerId, ownerId), parentFilter(folders.parentId, parentId))),
    db
      .select()
      .from(files)
      .where(and(eq(files.ownerId, ownerId), parentFilter(files.parentId, parentId))),
  ]);
  return sortItems([...folderRows.map(toFolderEntity), ...fileRows.map(toFileEntity)]);
}

export async function getSiblingNames(
  parentId: string | null,
  ownerId: string,
  excludeId?: string,
): Promise<string[]> {
  const db = getDb();
  const [folderRows, fileRows] = await Promise.all([
    db
      .select({ id: folders.id, name: folders.name })
      .from(folders)
      .where(and(eq(folders.ownerId, ownerId), parentFilter(folders.parentId, parentId))),
    db
      .select({ id: files.id, name: files.name })
      .from(files)
      .where(and(eq(files.ownerId, ownerId), parentFilter(files.parentId, parentId))),
  ]);
  return [...folderRows, ...fileRows]
    .filter((row) => row.id !== excludeId)
    .map((row) => row.name);
}

export async function createFolderRow(
  name: string,
  parentId: string | null,
  ownerId: string,
): Promise<FolderEntity> {
  const db = getDb();
  const [row] = await db
    .insert(folders)
    .values({ name, parentId, ownerId })
    .returning();
  return toFolderEntity(row);
}

export async function renameFolderRow(id: string, name: string): Promise<FolderEntity> {
  const db = getDb();
  const [row] = await db
    .update(folders)
    .set({ name, updatedAt: new Date() })
    .where(eq(folders.id, id))
    .returning();
  return toFolderEntity(row);
}

export async function deleteFolderRow(id: string): Promise<void> {
  const db = getDb();
  await db.delete(folders).where(eq(folders.id, id));
}

/** Blob pointers for every file nested anywhere under `folderId` (itself included), so they can be deleted from Blob storage before the cascade delete removes the rows. */
export async function getDescendantFileBlobsForFolder(
  folderId: string,
  ownerId: string,
): Promise<{ blobUrl: string; blobPathname: string }[]> {
  const db = getDb();
  const result = await db.execute(sql`
    WITH RECURSIVE descendant_folders AS (
      SELECT id FROM folders WHERE id = ${folderId} AND owner_id = ${ownerId}
      UNION ALL
      SELECT f.id FROM folders f
      JOIN descendant_folders df ON f.parent_id = df.id
    )
    SELECT blob_url, blob_pathname FROM files
    WHERE owner_id = ${ownerId} AND parent_id IN (SELECT id FROM descendant_folders)
  `);
  const rows = result.rows as { blob_url: string; blob_pathname: string }[];
  return rows.map((row) => ({ blobUrl: row.blob_url, blobPathname: row.blob_pathname }));
}

/** Root-first ancestor chain from the data room root down to (and including) `folderId`. */
export async function getBreadcrumbChain(
  folderId: string,
  ownerId: string,
): Promise<FolderEntity[]> {
  const db = getDb();
  const result = await db.execute(sql`
    WITH RECURSIVE ancestors AS (
      SELECT *, 0 AS depth FROM folders WHERE id = ${folderId} AND owner_id = ${ownerId}
      UNION ALL
      SELECT f.*, a.depth + 1 FROM folders f
      JOIN ancestors a ON f.id = a.parent_id
    )
    SELECT * FROM ancestors ORDER BY depth DESC
  `);
  const rows = result.rows as {
    id: string;
    name: string;
    parent_id: string | null;
    created_at: string | Date;
    updated_at: string | Date;
  }[];
  return rows.map((row) => ({
    id: row.id,
    type: "folder" as const,
    name: row.name,
    parentId: row.parent_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  }));
}

export async function createFileRow(input: {
  name: string;
  parentId: string | null;
  ownerId: string;
  mimeType: string;
  size: number;
  blobUrl: string;
  blobPathname: string;
}): Promise<FileEntity> {
  const db = getDb();
  const [row] = await db.insert(files).values(input).returning();
  return toFileEntity(row);
}

export async function renameFileRow(id: string, name: string): Promise<FileEntity> {
  const db = getDb();
  const [row] = await db
    .update(files)
    .set({ name, updatedAt: new Date() })
    .where(eq(files.id, id))
    .returning();
  return toFileEntity(row);
}

export async function deleteFileRow(id: string): Promise<void> {
  const db = getDb();
  await db.delete(files).where(eq(files.id, id));
}

export async function searchItems(
  query: string,
  ownerId: string,
): Promise<DataRoomItem[]> {
  const db = getDb();
  const pattern = `%${query}%`;
  const [folderRows, fileRows] = await Promise.all([
    db
      .select()
      .from(folders)
      .where(and(eq(folders.ownerId, ownerId), sql`${folders.name} ILIKE ${pattern}`)),
    db
      .select()
      .from(files)
      .where(and(eq(files.ownerId, ownerId), sql`${files.name} ILIKE ${pattern}`)),
  ]);
  return sortItems([...folderRows.map(toFolderEntity), ...fileRows.map(toFileEntity)]);
}
