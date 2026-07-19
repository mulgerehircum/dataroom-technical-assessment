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

async function waitForContentsLoaded() {
  expect(
    await screen.findByRole("button", { name: /New (sub)?folder/i }),
  ).toBeInTheDocument();
}

async function createFolderNamed(name: string) {
  fireEvent.click(screen.getByRole("button", { name: "New folder" }));
  fireEvent.change(await screen.findByLabelText("Name"), {
    target: { value: name },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create" }));
}

describe("optimistic create folder", () => {
  it("shows the new folder in the grid before createFolder resolves", async () => {
    renderDataRoomApp();
    await waitForContentsLoaded();

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = dataRoomRepository.createFolder.bind(dataRoomRepository);
    vi.spyOn(dataRoomRepository, "createFolder").mockImplementation(
      async (name, parentId) => {
        await gate;
        return original(name, parentId);
      },
    );

    await createFolderNamed("Contracts");

    expect(await screen.findByText(/Creating/)).toBeInTheDocument();
    expect(screen.getByText("Contracts")).toBeInTheDocument();

    release();

    await waitFor(() => {
      expect(screen.queryByText(/Creating/)).toBeNull();
    });
    expect(
      await screen.findByRole("link", { name: /Contracts/i }),
    ).toBeInTheDocument();
  });

  it("removes the optimistic folder when createFolder fails", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    renderDataRoomApp();
    await waitForContentsLoaded();

    failNext("createFolder", new Error("Create failed"));
    await createFolderNamed("Contracts");

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith("Create failed"),
    );
    expect(screen.queryByText("Contracts")).toBeNull();
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
  });
});
