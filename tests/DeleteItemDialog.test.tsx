// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { DeleteItemDialog } from "@/features/dataroom/dialogs/DeleteItemDialog";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { renderWithProviders, resetFakeRepository } from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

describe("DeleteItemDialog", () => {
  it("warns that a non-empty folder and its items will be deleted", async () => {
    const parent = await dataRoomRepository.createFolder("Contracts", null);
    await dataRoomRepository.createFolder("2024", parent.id);
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithProviders(
      <DeleteItemDialog
        item={{ ...parent, itemCount: 1 }}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );

    expect(
      screen.getByText(
        /"Contracts" and its 1 item will be permanently deleted\. This cannot be undone\./i,
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("uses a softer confirmation for an empty folder", async () => {
    const folder = await dataRoomRepository.createFolder("Empty", null);
    const onClose = vi.fn();

    renderWithProviders(
      <DeleteItemDialog
        item={{ ...folder, itemCount: 0 }}
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/"Empty" will be permanently deleted\./i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument();
  });

  it("confirms deleting a single file", async () => {
    const file = await dataRoomRepository.createFile(
      new File(["pdf"], "report.pdf", { type: "application/pdf" }),
      null,
    );
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    renderWithProviders(
      <DeleteItemDialog
        item={file}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
