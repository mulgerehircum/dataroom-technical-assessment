// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { toast } from "sonner";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { renderDataRoomApp, resetFakeRepository } from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

function getFileInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

async function waitForContentsLoaded() {
  expect(
    await screen.findByRole("button", { name: /New (sub)?folder/i }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("status", { name: "Loading contents" })).toBeNull();
}

async function searchFor(query: string) {
  const input = screen.getByPlaceholderText("Search by name...");
  fireEvent.change(input, { target: { value: query } });
  await waitFor(
    () => {
      expect(
        screen.queryByRole("status", { name: "Loading contents" }),
      ).toBeNull();
    },
    { timeout: 2000 },
  );
}

describe("DataRoomPage", () => {
  it("shows create affordances at the root after loading", async () => {
    renderDataRoomApp();
    await waitForContentsLoaded();
    expect(screen.getByRole("button", { name: "New folder" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New file" })).toBeInTheDocument();
  });

  it("creates a folder, navigates into it, and updates the breadcrumb", async () => {
    renderDataRoomApp();
    await waitForContentsLoaded();

    fireEvent.click(screen.getByRole("button", { name: "New folder" }));
    fireEvent.change(await screen.findByLabelText("Name"), {
      target: { value: "Contracts" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    const folderLink = await screen.findByRole("link", { name: /Contracts/i });
    expect(folderLink).toHaveAttribute("href", expect.stringMatching(/^\/folder\//));

    fireEvent.click(folderLink);

    expect(
      await screen.findByRole("button", { name: "New subfolder of Contracts" }),
    ).toBeInTheDocument();
    // Two "Contracts": the breadcrumb link and (previously) the grid card,
    // now only the breadcrumb text remains since we navigated inside it.
    const nav = screen.getByRole("navigation");
    expect(await within(nav).findByText("Contracts")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "Data Room" })).toBeInTheDocument();
  });

  it("redirects home when the folder id does not exist", async () => {
    const errorSpy = vi.spyOn(toast, "error").mockImplementation(() => "");
    const viewSpy = vi.spyOn(dataRoomRepository, "getFolderView");
    renderDataRoomApp("/folder/missing-folder-id");

    expect(
      await screen.findByRole("button", { name: "New folder" }),
    ).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith("This folder no longer exists.");
    // One view call for the dead folder, then root remounts with folderId null.
    expect(
      viewSpy.mock.calls.filter(([id]) => id === "missing-folder-id"),
    ).toHaveLength(1);
    errorSpy.mockRestore();
    viewSpy.mockRestore();
  });

  it("uploads a pdf and opens it in the preview dialog", async () => {
    const { container } = renderDataRoomApp();
    await waitForContentsLoaded();
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

  it("shows a loading skeleton before folder contents resolve", async () => {
    renderDataRoomApp();
    expect(
      screen.getByRole("status", { name: "Loading contents" }),
    ).toBeInTheDocument();
    await waitForContentsLoaded();
  });

  it("shows an empty state when search has no matches", async () => {
    renderDataRoomApp();
    await waitForContentsLoaded();

    await searchFor("zzzz-no-match");

    expect(
      await screen.findByText('No results for “zzzz-no-match”'),
    ).toBeInTheDocument();
    expect(screen.getByText("Try a different name")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "New folder" })).toBeNull();
  });

  it("shows the parent path on folder search matches", async () => {
    const contracts = await dataRoomRepository.createFolder("Contracts", null);
    await dataRoomRepository.createFolder("2024", contracts.id);

    renderDataRoomApp();
    await waitForContentsLoaded();

    await searchFor("2024");

    const folderLink = await screen.findByRole("link", { name: /2024/i });
    expect(folderLink).toHaveTextContent("Data Room / Contracts");
    expect(folderLink).not.toHaveTextContent("item");
  });

  it("opens a folder from search and clears the query", async () => {
    const contracts = await dataRoomRepository.createFolder("Contracts", null);
    await dataRoomRepository.createFolder("Nested", contracts.id);

    renderDataRoomApp();
    await waitForContentsLoaded();

    await searchFor("Nested");

    fireEvent.click(await screen.findByRole("link", { name: /Nested/i }));

    expect(
      await screen.findByRole("button", { name: "New subfolder of Nested" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by name...")).toHaveValue("");
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("shows a file search hit in its parent folder", async () => {
    const contracts = await dataRoomRepository.createFolder("Contracts", null);
    await dataRoomRepository.createFile(
      new File(["pdf"], "nda.pdf", { type: "application/pdf" }),
      contracts.id,
    );

    renderDataRoomApp();
    await waitForContentsLoaded();

    await searchFor("nda");

    fireEvent.click(screen.getByRole("button", { name: "Actions for nda.pdf" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Show in folder" }));

    expect(
      await screen.findByRole("button", { name: "New subfolder of Contracts" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by name...")).toHaveValue("");
    expect(
      await screen.findByRole("button", {
        name: (accessibleName) =>
          accessibleName.includes("nda.pdf") &&
          !accessibleName.startsWith("Actions"),
      }),
    ).toBeInTheDocument();
  });
});
