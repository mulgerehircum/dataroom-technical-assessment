// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { DeleteItemDialog } from "@/features/dataroom/dialogs/DeleteItemDialog";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { renderWithProviders, resetFakeRepository } from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

describe("DeleteItemDialog", () => {
  it("deletes a folder and everything nested inside it", async () => {
    const parent = await dataRoomRepository.createFolder("Contracts", null);
    await dataRoomRepository.createFolder("2024", parent.id);
    const onClose = vi.fn();

    renderWithProviders(<DeleteItemDialog item={parent} onClose={onClose} />);

    expect(
      screen.getByText(/and everything inside it will be permanently deleted/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
  });

  it("deletes a single file", async () => {
    const file = await dataRoomRepository.createFile(
      new File(["pdf"], "report.pdf", { type: "application/pdf" }),
      null,
    );
    const onClose = vi.fn();

    renderWithProviders(<DeleteItemDialog item={file} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(await dataRoomRepository.listChildren(null)).toHaveLength(0);
  });
});
