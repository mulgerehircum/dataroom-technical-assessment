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
    <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
      <div className="min-w-0">
        <p className="text-[12px] font-bold tracking-[0.08em] text-muted-foreground uppercase">
          Acme Data Room
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight">All Files</h1>
      </div>
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          placeholder="Search by name..."
          className="rounded-lg border-border bg-card pl-8"
        />
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Button
          size="sm"
          onClick={onCreateFolder}
          className="rounded-lg px-4 font-bold tracking-[0.02em] uppercase"
        >
          <FolderPlus />
          New folder
        </Button>
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}
