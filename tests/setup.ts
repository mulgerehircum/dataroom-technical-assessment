import "fake-indexeddb/auto";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// vitest.config test.globals isn't enabled, so RTL can't auto-detect
// `afterEach` to register its own cleanup — do it explicitly.
afterEach(() => {
  cleanup();
});

// jsdom doesn't implement Blob object URLs; FilePreview relies on them.
if (typeof URL.createObjectURL !== "function") {
  URL.createObjectURL = () => "blob:mock-url";
}
if (typeof URL.revokeObjectURL !== "function") {
  URL.revokeObjectURL = () => {};
}
