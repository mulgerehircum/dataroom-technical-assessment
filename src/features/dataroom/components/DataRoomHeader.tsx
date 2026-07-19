import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DataRoomHeaderProps {
  onCreateFolder: () => void;
}

export function DataRoomHeader({ onCreateFolder }: DataRoomHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-lg font-semibold">Data Room</h1>
      <Button size="sm" onClick={onCreateFolder}>
        <FolderPlus />
        New folder
      </Button>
    </header>
  );
}
