import { describe, expect, it } from "vitest";
import {
  SEARCH_HISTORY_MAX,
  loadSearchHistory,
  persistSearchHistory,
  pushSearchHistory,
  removeSearchHistory,
} from "@/features/dataroom/utils/search-history";

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const store = { ...initial };
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      for (const key of Object.keys(store)) delete store[key];
    },
    getItem(key: string) {
      return store[key] ?? null;
    },
    key() {
      return null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
  };
}

describe("pushSearchHistory", () => {
  it("prepends a new query", () => {
    expect(pushSearchHistory(["alpha"], "beta")).toEqual(["beta", "alpha"]);
  });

  it("trims whitespace", () => {
    expect(pushSearchHistory([], "  report  ")).toEqual(["report"]);
  });

  it("ignores empty queries", () => {
    expect(pushSearchHistory(["alpha"], "   ")).toEqual(["alpha"]);
  });

  it("dedupes case-insensitively and keeps the latest casing", () => {
    expect(pushSearchHistory(["Report", "other"], "REPORT")).toEqual([
      "REPORT",
      "other",
    ]);
  });

  it("caps at SEARCH_HISTORY_MAX", () => {
    const filled = Array.from({ length: SEARCH_HISTORY_MAX }, (_, i) => `q${i}`);
    const next = pushSearchHistory(filled, "newest");
    expect(next).toHaveLength(SEARCH_HISTORY_MAX);
    expect(next[0]).toBe("newest");
    expect(next).not.toContain(`q${SEARCH_HISTORY_MAX - 1}`);
  });
});

describe("removeSearchHistory", () => {
  it("removes a matching entry case-insensitively", () => {
    expect(removeSearchHistory(["Alpha", "beta"], "alpha")).toEqual(["beta"]);
  });

  it("leaves the list unchanged when there is no match", () => {
    expect(removeSearchHistory(["alpha"], "beta")).toEqual(["alpha"]);
  });
});

describe("loadSearchHistory / persistSearchHistory", () => {
  it("round-trips through storage", () => {
    const storage = memoryStorage();
    persistSearchHistory(["one", "two"], storage);
    expect(loadSearchHistory(storage)).toEqual(["one", "two"]);
  });

  it("returns [] for missing or invalid storage data", () => {
    expect(loadSearchHistory(memoryStorage())).toEqual([]);
    expect(loadSearchHistory(memoryStorage({ "dataroom:search-history": "{" }))).toEqual(
      [],
    );
    expect(
      loadSearchHistory(
        memoryStorage({ "dataroom:search-history": JSON.stringify([1, "ok", ""]) }),
      ),
    ).toEqual(["ok"]);
  });

  it("clears storage when persisting an empty list", () => {
    const storage = memoryStorage({
      "dataroom:search-history": JSON.stringify(["x"]),
    });
    persistSearchHistory([], storage);
    expect(storage.getItem("dataroom:search-history")).toBeNull();
  });
});
