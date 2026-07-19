// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { CreateFolderDialog } from "@/features/dataroom/dialogs/CreateFolderDialog";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { renderWithProviders, resetFakeRepository } from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

describe("CreateFolderDialog", () => {
  it("creates a folder at the root and closes on success", async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <CreateFolderDialog parentId={null} open onOpenChange={onOpenChange} />,
    );

    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "Contracts" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const children = await dataRoomRepository.listChildren(null);
    expect(children).toHaveLength(1);
    expect(children[0].name).toBe("Contracts");
  });

  it("rejects an empty name and keeps the dialog open", async () => {
    const onOpenChange = vi.fn();
    renderWithProviders(
      <CreateFolderDialog parentId={null} open onOpenChange={onOpenChange} />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Create" }));

    await waitFor(async () => {
      expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
    });
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
