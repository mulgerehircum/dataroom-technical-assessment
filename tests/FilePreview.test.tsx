// @vitest-environment jsdom
import { StrictMode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FilePreview } from "@/features/dataroom/components/FilePreview";
import type { FileEntity } from "@/features/dataroom/model/types";

function makeFile(): FileEntity {
  return {
    id: "f1",
    type: "file",
    name: "report.pdf",
    parentId: null,
    mimeType: "application/pdf",
    size: 3,
    blob: new Blob(["pdf"], { type: "application/pdf" }),
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("FilePreview", () => {
  it("never points the iframe at an object URL that's already been revoked", async () => {
    // React 18 StrictMode double-invokes effects in dev (mount, cleanup,
    // mount again) without re-running useMemo. Creating the blob URL in a
    // memo and revoking it in a separate effect leaves the iframe pointed
    // at a revoked URL once that double-invoke settles. Regression guard
    // for that: assert whatever URL is currently rendered was never revoked.
    let nextId = 0;
    const revoked: string[] = [];
    vi.spyOn(URL, "createObjectURL").mockImplementation(
      () => `blob:mock-${nextId++}`,
    );
    vi.spyOn(URL, "revokeObjectURL").mockImplementation((url: string) => {
      revoked.push(url);
    });

    render(
      <StrictMode>
        <FilePreview file={makeFile()} onClose={() => {}} />
      </StrictMode>,
    );

    const iframe = await screen.findByTitle("report.pdf");
    const currentSrc = iframe.getAttribute("src");

    expect(currentSrc).not.toBeNull();
    expect(revoked).not.toContain(currentSrc);

    vi.restoreAllMocks();
  });
});
