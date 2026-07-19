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

describe("optimistic rename", () => {
  it("updates the folder name in the grid before renameFolder resolves", async () => {
    await dataRoomRepository.createFolder("Old name", null);
    renderDataRoomApp();
    await waitForContentsLoaded();

    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = dataRoomRepository.renameFolder.bind(dataRoomRepository);
    vi.spyOn(dataRoomRepository, "renameFolder").mockImplementation(
      async (id, name) => {
        await gate;
        return original(id, name);
      },
    );

    await screen.findByRole("link", { name: /Old name/i });
    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Old name" }),
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: /rename/i }));
    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "New name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("link", { name: /New name/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Old name/i })).toBeNull();
    expect(screen.queryByRole("dialog", { name: /Rename/i })).toBeNull();

    release();
    await waitFor(async () => {
      const [folder] = await dataRoomRepository.listChildren(null);
      expect(folder?.name).toBe("New name");
    });
  });

  it("restores the old name when renameFolder fails", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    await dataRoomRepository.createFolder("Old name", null);
    renderDataRoomApp();
    await waitForContentsLoaded();

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Old name" }),
    );
    fireEvent.click(await screen.findByRole("menuitem", { name: /rename/i }));
    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "New name" },
    });

    failNext("renameFolder", new Error("Rename failed"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith("Rename failed"),
    );
    expect(
      await screen.findByRole("link", { name: /Old name/i }),
    ).toBeInTheDocument();
  });
});
