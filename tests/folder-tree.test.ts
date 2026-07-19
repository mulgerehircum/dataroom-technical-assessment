import { describe, expect, it } from "vitest";
import {
  buildBreadcrumbs,
  getChildren,
  getDescendantIds,
  isDescendantOf,
} from "@/features/dataroom/utils/folder-tree";
import type {
  DataRoomItem,
  FolderEntity,
} from "@/features/dataroom/model/types";

function folder(id: string, name: string, parentId: string | null): FolderEntity {
  return {
    id,
    type: "folder",
    name,
    parentId,
    createdAt: 0,
    updatedAt: 0,
  };
}

function file(id: string, name: string, parentId: string | null): DataRoomItem {
  return {
    id,
    type: "file",
    name,
    parentId,
    mimeType: "application/pdf",
    size: 100,
    blob: new Blob(),
    createdAt: 0,
    updatedAt: 0,
  };
}

// root
//  └─ contracts (A)
//      ├─ vendor.pdf
//      └─ 2024 (B)
//          └─ nda.pdf
const contracts = folder("A", "Contracts", null);
const year2024 = folder("B", "2024", "A");
const vendorPdf = file("f1", "vendor.pdf", "A");
const ndaPdf = file("f2", "nda.pdf", "B");
const items: DataRoomItem[] = [contracts, year2024, vendorPdf, ndaPdf];

describe("getChildren", () => {
  it("returns only direct children of a folder", () => {
    expect(getChildren(items, "A").map((i) => i.id).sort()).toEqual(
      ["B", "f1"].sort(),
    );
  });

  it("returns root-level items for a null parentId", () => {
    expect(getChildren(items, null).map((i) => i.id)).toEqual(["A"]);
  });
});

describe("getDescendantIds", () => {
  it("collects nested folders and files recursively", () => {
    expect(getDescendantIds(items, "A").sort()).toEqual(
      ["B", "f1", "f2"].sort(),
    );
  });

  it("returns an empty array for a folder with no contents", () => {
    expect(getDescendantIds(items, "B").filter((id) => id !== "f2")).toEqual(
      [],
    );
  });
});

describe("buildBreadcrumbs", () => {
  it("walks up from the current folder to the root", () => {
    const breadcrumbs = buildBreadcrumbs([contracts, year2024], "B");
    expect(breadcrumbs.map((b) => b.name)).toEqual([
      "Data Room",
      "Contracts",
      "2024",
    ]);
  });

  it("returns just the root entry when at the top level", () => {
    const breadcrumbs = buildBreadcrumbs([contracts, year2024], null);
    expect(breadcrumbs).toEqual([{ id: null, name: "Data Room" }]);
  });
});

describe("isDescendantOf", () => {
  it("is true for a folder nested under the ancestor", () => {
    expect(isDescendantOf(items, "A", "B")).toBe(true);
  });

  it("is false for unrelated folders", () => {
    expect(isDescendantOf(items, "B", "A")).toBe(false);
  });
});
