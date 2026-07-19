// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { RenameItemDialog } from "@/features/dataroom/dialogs/RenameItemDialog";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { renderWithProviders, resetFakeRepository } from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

describe("RenameItemDialog", () => {
  it("pre-fills the current name and saves the new one", async () => {
    const folder = await dataRoomRepository.createFolder("Old name", null);
    const onClose = vi.fn();

    renderWithProviders(<RenameItemDialog item={folder} onClose={onClose} />);

    const input = await screen.findByLabelText("Name");
    expect(input).toHaveValue("Old name");

    fireEvent.change(input, { target: { value: "New name" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect((await dataRoomRepository.getFolder(folder.id))?.name).toBe(
      "New name",
    );
  });

  it("renames a file through the same dialog", async () => {
    const file = await dataRoomRepository.createFile(
      new File(["pdf"], "report.pdf", { type: "application/pdf" }),
      null,
    );
    const onClose = vi.fn();

    renderWithProviders(<RenameItemDialog item={file} onClose={onClose} />);

    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "final.pdf" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [renamed] = await dataRoomRepository.listChildren(null);
    expect(renamed.name).toBe("final.pdf");
  });
});
