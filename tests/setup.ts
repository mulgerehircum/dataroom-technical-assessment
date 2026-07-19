import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fakeDataRoomRepository } from "./fakes/fake-dataroom.repository";

// vitest.config test.globals isn't enabled, so RTL can't auto-detect
// `afterEach` to register its own cleanup — do it explicitly.
afterEach(() => {
  cleanup();
});

// Component tests exercise the real hooks/components against an in-memory
// fake instead of the real API — no network, no real Postgres per test run.
vi.mock("@/features/dataroom/storage/dataroom.repository", () => ({
  dataRoomRepository: fakeDataRoomRepository,
}));

// Clerk components require a real ClerkProvider (and network access) to
// initialize; tests don't have either, so stub the pieces this app uses.
vi.mock("@clerk/clerk-react", () => ({
  ClerkProvider: ({ children }: { children: unknown }) => children,
  SignedIn: ({ children }: { children: unknown }) => children,
  SignedOut: () => null,
  SignInButton: ({ children }: { children: unknown }) => children,
  UserButton: () => null,
  useAuth: () => ({ getToken: async () => "test-token" }),
}));
