import { describe, expect, it } from "vitest";
import {
  dedupeName,
  getFileExtension,
  stripExtension,
} from "@/features/dataroom/utils/file-name";

describe("getFileExtension", () => {
  it("returns the extension without the dot", () => {
    expect(getFileExtension("report.pdf")).toBe("pdf");
  });

  it("returns an empty string when there is no extension", () => {
    expect(getFileExtension("report")).toBe("");
  });

  it("treats a leading dot as a hidden file, not an extension", () => {
    expect(getFileExtension(".gitignore")).toBe("");
  });
});

describe("stripExtension", () => {
  it("removes the extension", () => {
    expect(stripExtension("report.pdf")).toBe("report");
  });

  it("leaves names without an extension untouched", () => {
    expect(stripExtension("report")).toBe("report");
  });
});

describe("dedupeName", () => {
  it("returns the original name when it is unique", () => {
    expect(dedupeName("report.pdf", ["other.pdf"])).toBe("report.pdf");
  });

  it("appends (1) when the name is taken", () => {
    expect(dedupeName("report.pdf", ["report.pdf"])).toBe("report (1).pdf");
  });

  it("increments until it finds a free name", () => {
    expect(
      dedupeName("report.pdf", ["report.pdf", "report (1).pdf", "report (2).pdf"]),
    ).toBe("report (3).pdf");
  });

  it("works for names without an extension", () => {
    expect(dedupeName("Untitled", ["Untitled"])).toBe("Untitled (1)");
  });
});
