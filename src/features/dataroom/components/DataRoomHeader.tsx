import { FolderPlus, Search } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DataRoomHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onCreateFolder: () => void;
}

export function DataRoomHeader({
  searchQuery,
  onSearchQueryChange,
  onCreateFolder,
}: DataRoomHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 border-b px-6 py-4">
      <h1 className="shrink-0 text-lg font-semibold">Acme Corp.</h1>
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search by name..."
          className="pl-8"
        />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Button size="sm" onClick={onCreateFolder}>
          <FolderPlus />
          New folder
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
