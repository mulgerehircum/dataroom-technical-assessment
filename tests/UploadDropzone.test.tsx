// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { UploadDropzone } from "@/features/dataroom/components/UploadDropzone";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { renderWithProviders, resetDataRoomDB } from "./test-utils";

beforeEach(async () => {
  await resetDataRoomDB();
});

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("UploadDropzone", () => {
  it("uploads a pdf selected through the hidden file input", async () => {
    const { container } = renderWithProviders(
      <UploadDropzone folderId={null} />,
    );
    const file = new File(["pdf-bytes"], "report.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(async () => {
      expect(await dataRoomRepository.listChildren(null)).toHaveLength(1);
    });
    const [uploaded] = await dataRoomRepository.listChildren(null);
    expect(uploaded.name).toBe("report.pdf");
  });

  it("rejects a non-pdf file", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    const { container } = renderWithProviders(
      <UploadDropzone folderId={null} />,
    );
    const file = new File(["hi"], "notes.txt", { type: "text/plain" });

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
  });
});
