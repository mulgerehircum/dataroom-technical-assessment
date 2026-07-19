// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import {
  failNext,
  renderDataRoomApp,
  resetFakeRepository,
} from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
  vi.restoreAllMocks();
});

describe("optimistic delete", () => {
  it("removes a file from the grid before deleteFile resolves", async () => {
    await dataRoomRepository.createFile(
      new File(["pdf"], "report.pdf", { type: "application/pdf" }),
      null,
    );
    renderDataRoomApp();

    await screen.findByRole("button", {
      name: (accessibleName) =>
        accessibleName.includes("report.pdf") &&
        !accessibleName.startsWith("Actions"),
    });

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = dataRoomRepository.deleteFile.bind(dataRoomRepository);
    vi.spyOn(dataRoomRepository, "deleteFile").mockImplementation(async (id) => {
      await gate;
      return original(id);
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for report.pdf" }),
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: /delete/i }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(
        screen.queryByRole("button", {
          name: (accessibleName) =>
            accessibleName.includes("report.pdf") &&
            !accessibleName.startsWith("Actions"),
        }),
      ).toBeNull();
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();

    release();
    await waitFor(async () => {
      expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
    });
  });

  it("restores a file in the grid when deleteFile fails", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    await dataRoomRepository.createFile(
      new File(["pdf"], "report.pdf", { type: "application/pdf" }),
      null,
    );
    renderDataRoomApp();

    await screen.findByRole("button", {
      name: (accessibleName) =>
        accessibleName.includes("report.pdf") &&
        !accessibleName.startsWith("Actions"),
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for report.pdf" }),
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: /delete/i }));

    failNext("deleteFile", new Error("Delete failed"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith("Delete failed"),
    );

    expect(
      await screen.findByRole("button", {
        name: (accessibleName) =>
          accessibleName.includes("report.pdf") &&
          !accessibleName.startsWith("Actions"),
      }),
    ).toBeInTheDocument();
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(1);
  });

  it("restores a folder in the grid when deleteFolder fails", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    await dataRoomRepository.createFolder("Contracts", null);
    renderDataRoomApp();

    const folderLink = await screen.findByRole("link", { name: /Contracts/i });
    fireEvent.contextMenu(folderLink);
    fireEvent.click(await screen.findByRole("menuitem", { name: /delete/i }));

    failNext("deleteFolder", new Error("Delete failed"));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith("Delete failed"),
    );

    expect(
      await screen.findByRole("link", { name: /Contracts/i }),
    ).toBeInTheDocument();
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(1);
  });
});
