// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { UploadDropzone } from "@/features/dataroom/components/UploadDropzone";
import { DataRoomHeader } from "@/features/dataroom/components/DataRoomHeader";
import { MAX_FILE_SIZE_BYTES } from "@/features/dataroom/model/constants";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import {
  failNext,
  renderDataRoomApp,
  renderWithProviders,
  resetFakeRepository,
} from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function dispatchFileDrag(
  type: "dragenter" | "dragleave" | "dragover" | "drop",
  files: File[] = [],
) {
  fireEvent(
    window,
    Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
      dataTransfer: {
        types: ["Files"],
        files: files as unknown as FileList,
      },
      preventDefault() {},
    }),
  );
}

function pdf(name: string, contents = "pdf-bytes"): File {
  return new File([contents], name, { type: "application/pdf" });
}

describe("UploadDropzone", () => {
  it("shows an overlay while dragging files over the window and uploads on drop", async () => {
    renderWithProviders(<UploadDropzone folderId={null} />);

    expect(screen.queryByText("Drop PDF to upload")).not.toBeInTheDocument();

    dispatchFileDrag("dragenter");
    expect(await screen.findByText("Drop PDF to upload")).toBeInTheDocument();

    dispatchFileDrag("drop", [pdf("report.pdf")]);

    await waitFor(async () => {
      expect(await dataRoomRepository.listChildren(null)).toHaveLength(1);
    });
    expect(screen.queryByText("Drop PDF to upload")).not.toBeInTheDocument();
    const [uploaded] = await dataRoomRepository.listChildren(null);
    expect(uploaded.name).toBe("report.pdf");
  });

  it("hides the overlay when the drag leaves the window", async () => {
    renderWithProviders(<UploadDropzone folderId={null} />);

    dispatchFileDrag("dragenter");
    expect(await screen.findByText("Drop PDF to upload")).toBeInTheDocument();

    dispatchFileDrag("dragleave");
    expect(screen.queryByText("Drop PDF to upload")).not.toBeInTheDocument();
  });

  it("uploads every dropped pdf and skips invalid files", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "");
    renderWithProviders(<UploadDropzone folderId={null} />);

    dispatchFileDrag("drop", [
      pdf("a.pdf"),
      new File(["hi"], "notes.txt", { type: "text/plain" }),
      pdf("b.pdf"),
    ]);

    await waitFor(async () => {
      expect(await dataRoomRepository.listChildren(null)).toHaveLength(2);
    });
    expect(errorSpy).toHaveBeenCalled();
    expect(successSpy).toHaveBeenCalledWith(
      expect.stringMatching(/2 uploaded.*1 skipped/i),
    );
  });
});

describe("DataRoomHeader upload", () => {
  it("uploads a pdf selected through the hidden file input", async () => {
    const { container } = renderWithProviders(
      <DataRoomHeader
        folderId={null}
        searchQuery=""
        onSearchQueryChange={() => {}}
        onCreateFolder={() => {}}
      />,
    );

    fireEvent.change(getFileInput(container), {
      target: { files: [pdf("report.pdf")] },
    });

    await waitFor(async () => {
      expect(await dataRoomRepository.listChildren(null)).toHaveLength(1);
    });
    const [uploaded] = await dataRoomRepository.listChildren(null);
    expect(uploaded.name).toBe("report.pdf");
  });

  it("rejects a non-pdf file", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    const { container } = renderWithProviders(
      <DataRoomHeader
        folderId={null}
        searchQuery=""
        onSearchQueryChange={() => {}}
        onCreateFolder={() => {}}
      />,
    );
    const file = new File(["hi"], "notes.txt", { type: "text/plain" });

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() => expect(errorSpy).toHaveBeenCalled());
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
  });

  it("rejects an oversized pdf", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    const { container } = renderWithProviders(
      <DataRoomHeader
        folderId={null}
        searchQuery=""
        onSearchQueryChange={() => {}}
        onCreateFolder={() => {}}
      />,
    );
    const file = pdf("huge.pdf");
    Object.defineProperty(file, "size", { value: MAX_FILE_SIZE_BYTES + 1 });

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/exceeds the 25 MB limit/i),
      ),
    );
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
  });
});

describe("upload conflicts and partial failure", () => {
  it("offers replace, keep both, or cancel when a filename already exists", async () => {
    await dataRoomRepository.createFile(pdf("report.pdf"), null);
    const { container } = renderDataRoomApp();

    await screen.findByRole("button", {
      name: (accessibleName) =>
        accessibleName.includes("report.pdf") &&
        !accessibleName.startsWith("Actions"),
    });

    fireEvent.change(getFileInput(container), {
      target: { files: [pdf("report.pdf", "replacement")] },
    });

    expect(
      await screen.findByText(/"report\.pdf" already exists in this folder/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Keep both" }));

    await waitFor(async () => {
      const items = await dataRoomRepository.listChildren(null);
      expect(items).toHaveLength(2);
      expect(items.map((item) => item.name).sort()).toEqual([
        "report (1).pdf",
        "report.pdf",
      ]);
    });
  });

  it("replaces an existing file when Replace is chosen", async () => {
    const original = await dataRoomRepository.createFile(
      pdf("report.pdf", "original"),
      null,
    );
    const { container } = renderDataRoomApp();

    await screen.findByRole("button", {
      name: (accessibleName) =>
        accessibleName.includes("report.pdf") &&
        !accessibleName.startsWith("Actions"),
    });

    fireEvent.change(getFileInput(container), {
      target: { files: [pdf("report.pdf", "replacement")] },
    });

    fireEvent.click(await screen.findByRole("button", { name: "Replace" }));

    await waitFor(async () => {
      const items = await dataRoomRepository.listChildren(null);
      expect(items).toHaveLength(1);
      expect(items[0]?.id).toBe(original.id);
      expect(items[0]?.name).toBe("report.pdf");
    });
  });

  it("continues uploading after a single file fails in a multi-file batch", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    const successSpy = vi.spyOn(toast, "success").mockImplementation(() => "");
    const { container } = renderDataRoomApp();

    const original = dataRoomRepository.createFile.bind(dataRoomRepository);
    vi.spyOn(dataRoomRepository, "createFile").mockImplementation(
      async (file, parentId, options) => {
        if (file.name === "fail.pdf") {
          throw new Error("Network error");
        }
        return original(file, parentId, options);
      },
    );

    fireEvent.change(getFileInput(container), {
      target: { files: [pdf("ok.pdf"), pdf("fail.pdf"), pdf("also-ok.pdf")] },
    });

    await waitFor(async () => {
      expect(await dataRoomRepository.listChildren(null)).toHaveLength(2);
    });
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/fail\.pdf: Network error/i),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/2 uploaded.*1 failed/i),
    );
    expect(successSpy).not.toHaveBeenCalled();
  });

  it("rolls back an optimistic upload row when createFile fails", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    failNext("createFile", new Error("Upload exploded"));
    const { container } = renderDataRoomApp();

    fireEvent.change(getFileInput(container), {
      target: { files: [pdf("report.pdf")] },
    });

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/report\.pdf: Upload exploded/i),
      ),
    );
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
    expect(
      screen.queryByRole("button", {
        name: (accessibleName) => accessibleName.includes("report.pdf"),
      }),
    ).not.toBeInTheDocument();
  });
});

describe("refresh-safe persistence", () => {
  it("still shows uploaded files after the app remounts", async () => {
    await dataRoomRepository.createFile(pdf("persisted.pdf"), null);

    const first = renderDataRoomApp();
    expect(
      await screen.findByRole("button", {
        name: (accessibleName) =>
          accessibleName.includes("persisted.pdf") &&
          !accessibleName.startsWith("Actions"),
      }),
    ).toBeInTheDocument();
    first.unmount();

    renderDataRoomApp();
    expect(
      await screen.findByRole("button", {
        name: (accessibleName) =>
          accessibleName.includes("persisted.pdf") &&
          !accessibleName.startsWith("Actions"),
      }),
    ).toBeInTheDocument();
  });
});
