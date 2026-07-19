import { useCallback, useState } from "react";
import {
  loadSearchHistory,
  persistSearchHistory,
  pushSearchHistory,
  removeSearchHistory,
} from "@/features/dataroom/utils/search-history";

export function useSearchHistory() {
  const [history, setHistory] = useState(loadSearchHistory);

  const add = useCallback((query: string) => {
    setHistory((prev) => {
      const next = pushSearchHistory(prev, query);
      if (next === prev || (next.length === prev.length && next.every((q, i) => q === prev[i]))) {
        return prev;
      }
      persistSearchHistory(next);
      return next;
    });
  }, []);

  const remove = useCallback((query: string) => {
    setHistory((prev) => {
      const next = removeSearchHistory(prev, query);
      if (next.length === prev.length) return prev;
      persistSearchHistory(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      persistSearchHistory([]);
      return [];
    });
  }, []);

  return { history, add, remove, clear };
}
