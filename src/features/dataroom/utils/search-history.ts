export const SEARCH_HISTORY_KEY = "dataroom:search-history";
export const SEARCH_HISTORY_MAX = 8;

export function loadSearchHistory(
  storage: Pick<Storage, "getItem"> = localStorage,
): string[] {
  try {
    const raw = storage.getItem(SEARCH_HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .slice(0, SEARCH_HISTORY_MAX);
  } catch {
    return [];
  }
}

export function persistSearchHistory(
  history: string[],
  storage: Pick<Storage, "setItem" | "removeItem"> = localStorage,
): void {
  if (history.length === 0) {
    storage.removeItem(SEARCH_HISTORY_KEY);
    return;
  }
  storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
}

/** Prepends `query` (trimmed), case-insensitive dedupe, newest first, capped. */
export function pushSearchHistory(
  history: string[],
  query: string,
  max = SEARCH_HISTORY_MAX,
): string[] {
  const trimmed = query.trim();
  if (!trimmed) return history;

  const needle = trimmed.toLowerCase();
  const without = history.filter((entry) => entry.toLowerCase() !== needle);
  return [trimmed, ...without].slice(0, max);
}

export function removeSearchHistory(
  history: string[],
  query: string,
): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return history;
  return history.filter((entry) => entry.toLowerCase() !== needle);
}
