import { SearchX } from "lucide-react";

interface SearchEmptyStateProps {
  query: string;
}

export function SearchEmptyState({ query }: SearchEmptyStateProps) {
  const trimmed = query.trim();

  return (
    <div
      role="status"
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-border bg-card p-12 text-center text-muted-foreground"
    >
      <SearchX className="size-10 text-text-tertiary" aria-hidden />
      <p className="text-[13.5px] font-medium text-foreground">
        {trimmed ? `No results for “${trimmed}”` : "No results"}
      </p>
      <p className="text-[12.5px]">Try a different name</p>
    </div>
  );
}
