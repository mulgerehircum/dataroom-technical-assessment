// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { Breadcrumbs } from "@/features/dataroom/components/Breadcrumbs";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";
import { renderWithProviders, resetFakeRepository } from "./test-utils";

beforeEach(async () => {
  await resetFakeRepository();
});

describe("Breadcrumbs", () => {
  it("shows just the root when at the top level", async () => {
    renderWithProviders(<Breadcrumbs currentFolderId={null} />);

    const rootCrumb = await screen.findByRole("link", { name: "Data Room" });
    expect(rootCrumb).toHaveAttribute("href", "/");
  });

  it("walks up the ancestor chain to the root", async () => {
    const contracts = await dataRoomRepository.createFolder("Contracts", null);
    const year = await dataRoomRepository.createFolder("2024", contracts.id);

    renderWithProviders(<Breadcrumbs currentFolderId={year.id} />);

    expect(await screen.findByText("2024")).toBeInTheDocument();
    const contractsCrumb = screen.getByRole("link", { name: "Contracts" });
    expect(contractsCrumb).toHaveAttribute("href", `/folder/${contracts.id}`);
    const rootCrumb = screen.getByRole("link", { name: "Data Room" });
    expect(rootCrumb).toHaveAttribute("href", "/");

    // The current folder is plain text, not a link.
    expect(
      screen.queryByRole("link", { name: "2024" }),
    ).not.toBeInTheDocument();
  });
});
