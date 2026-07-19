// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { RenameItemDialog } from "@/features/dataroom/dialogs/RenameItemDialog";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { renderWithProviders, resetFakeRepository } from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

describe("RenameItemDialog", () => {
  it("pre-fills the current name and confirms the new one", async () => {
    const folder = await dataRoomRepository.createFolder("Old name", null);
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithProviders(
      <RenameItemDialog
        item={folder}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    const input = await screen.findByLabelText("Name");
    expect(input).toHaveValue("Old name");

    fireEvent.change(input, { target: { value: "New name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onConfirm).toHaveBeenCalledWith("New name");
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps the dialog open and shows an error for illegal characters", async () => {
    const folder = await dataRoomRepository.createFolder("Old name", null);
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithProviders(
      <RenameItemDialog
        item={folder}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "bad/name" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText(/cannot contain/i)).toBeInTheDocument();
  });
});
