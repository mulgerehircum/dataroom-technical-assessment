import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";

const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedSearchQuery(query: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(query);

  useEffect(() => {
    // Flush clears immediately so a stale term can't fire after the input is emptied.
    if (query === "") {
      setDebounced("");
      return;
    }

    const id = window.setTimeout(() => setDebounced(query), delayMs);
    return () => window.clearTimeout(id);
  }, [query, delayMs]);

  return debounced;
}

export function useSearch(query: string, onSearchSettled?: (query: string) => void) {
  const trimmed = query.trim();
  const searchQuery = useDebouncedSearchQuery(trimmed, SEARCH_DEBOUNCE_MS);
  const isDebouncing = trimmed.length > 0 && trimmed !== searchQuery;

  useEffect(() => {
    if (searchQuery.length > 0) {
      onSearchSettled?.(searchQuery);
    }
  }, [searchQuery, onSearchSettled]);

  const result = useQuery({
    queryKey: ["dataroom", "search", searchQuery],
    queryFn: () => dataRoomRepository.search(searchQuery),
    enabled: searchQuery.length > 0,
  });

  // Include debounce wait so the grid doesn't flash empty between keystrokes
  // and the first request.
  return {
    ...result,
    isPending: isDebouncing || (searchQuery.length > 0 && result.isPending),
  };
}
