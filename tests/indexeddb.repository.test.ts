import { beforeEach, describe, expect, it } from "vitest";
import { FILES_STORE, FOLDERS_STORE } from "@/features/dataroom/model/constants";
import { getDataRoomDB } from "@/features/dataroom/storage/db";
import { indexedDBRepository as repo } from "@/features/dataroom/storage/indexeddb.repository";

function makePdfFile(name: string, content = "pdf-bytes"): File {
  return new File([content], name, { type: "application/pdf" });
}

beforeEach(async () => {
  const db = await getDataRoomDB();
  await db.clear(FOLDERS_STORE);
  await db.clear(FILES_STORE);
});

describe("folders", () => {
  it("creates a folder at the root and lists it", async () => {
    const folder = await repo.createFolder("Contracts", null);
    expect(folder.parentId).toBeNull();
    expect(await repo.listChildren(null)).toEqual([folder]);
  });

  it("nests folders inside other folders", async () => {
    const parent = await repo.createFolder("Contracts", null);
    const child = await repo.createFolder("2024", parent.id);

    expect(child.parentId).toBe(parent.id);
    expect(await repo.listChildren(parent.id)).toEqual([child]);
  });

  it("dedupes folder names within the same parent", async () => {
    await repo.createFolder("Contracts", null);
    const second = await repo.createFolder("Contracts", null);
    expect(second.name).toBe("Contracts (1)");
  });

  it("rejects an empty name", async () => {
    await expect(repo.createFolder("   ", null)).rejects.toThrow();
  });

  it("renames a folder", async () => {
    const folder = await repo.createFolder("Old name", null);
    await repo.renameFolder(folder.id, "New name");

    expect((await repo.getFolder(folder.id))?.name).toBe("New name");
  });

  it("deletes a folder and everything nested inside it", async () => {
    const parent = await repo.createFolder("Contracts", null);
    const child = await repo.createFolder("2024", parent.id);
    await repo.createFile(makePdfFile("nda.pdf"), child.id);

    await repo.deleteFolder(parent.id);

    expect(await repo.getFolder(parent.id)).toBeUndefined();
    expect(await repo.getFolder(child.id)).toBeUndefined();
    expect(await repo.listChildren(child.id)).toEqual([]);
    expect(await repo.listChildren(null)).toEqual([]);
  });

  it("leaves sibling folders untouched when deleting one", async () => {
    const a = await repo.createFolder("A", null);
    const b = await repo.createFolder("B", null);

    await repo.deleteFolder(a.id);

    expect(await repo.getFolder(b.id)).toEqual(b);
  });
});

describe("files", () => {
  it("uploads a pdf and lists it", async () => {
    const file = await repo.createFile(makePdfFile("report.pdf"), null);
    expect(file.mimeType).toBe("application/pdf");

    // fake-indexeddb's structured clone downgrades File to Blob on
    // round-trip (real browsers preserve it), so compare fields rather
    // than the blob's identity/prototype.
    const items = await repo.listChildren(null);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: file.id,
      name: file.name,
      type: "file",
      mimeType: "application/pdf",
      size: file.size,
    });
  });

  it("rejects non-pdf uploads", async () => {
    const textFile = new File(["hi"], "notes.txt", { type: "text/plain" });
    await expect(repo.createFile(textFile, null)).rejects.toThrow();
  });

  it("dedupes file names within the same parent", async () => {
    await repo.createFile(makePdfFile("report.pdf"), null);
    const second = await repo.createFile(makePdfFile("report.pdf"), null);
    expect(second.name).toBe("report (1).pdf");
  });

  it("renames a file", async () => {
    const file = await repo.createFile(makePdfFile("report.pdf"), null);
    await repo.renameFile(file.id, "final.pdf");

    const [renamed] = await repo.listChildren(null);
    expect(renamed.name).toBe("final.pdf");
  });

  it("deletes a file", async () => {
    const file = await repo.createFile(makePdfFile("report.pdf"), null);
    await repo.deleteFile(file.id);

    expect(await repo.listChildren(null)).toEqual([]);
  });
});
