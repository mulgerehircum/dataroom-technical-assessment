// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderDataRoomApp, resetFakeRepository } from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("DataRoomPage", () => {
  it("shows the empty state at the root by default", async () => {
    renderDataRoomApp();
    expect(await screen.findByText("This folder is empty.")).toBeInTheDocument();
  });

  it("creates a folder, navigates into it, and updates the breadcrumb", async () => {
    renderDataRoomApp();

    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "Contracts" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    const folderLink = await screen.findByRole("link", { name: /Contracts/i });
    expect(folderLink).toHaveAttribute("href", expect.stringMatching(/^\/folder\//));

    fireEvent.click(folderLink);

    expect(await screen.findByText("This folder is empty.")).toBeInTheDocument();
    // Two "Contracts": the breadcrumb link and (previously) the grid card,
    // now only the breadcrumb text remains since we navigated inside it.
    const nav = screen.getByRole("navigation");
    expect(await within(nav).findByText("Contracts")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Data Room" })).toBeInTheDocument();
  });

  it("uploads a pdf and opens it in the preview dialog", async () => {
    const { container } = renderDataRoomApp();
    const file = new File(["pdf-bytes"], "report.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(getFileInput(container), { target: { files: [file] } });

    const fileButton = await screen.findByRole("button", {
      name: (accessibleName) =>
        accessibleName.includes("report.pdf") &&
        !accessibleName.startsWith("Actions"),
    });
    fireEvent.click(fileButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog", { name: "report.pdf" })).toBeInTheDocument();
    });
    // The iframe only mounts after FilePreview's effect creates the object
    // URL (see FilePreview.tsx), so wait for it rather than asserting sync.
    expect(await screen.findByTitle("report.pdf")).toHaveAttribute(
      "src",
      expect.stringContaining("blob:"),
    );
  });
});
