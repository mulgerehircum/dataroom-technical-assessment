import { Inbox } from "lucide-react";

// TODO: differentiate "empty folder" copy from an upload call-to-action.
export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-muted-foreground">
      <Inbox className="size-10" />
      <p className="text-sm">This folder is empty.</p>
    </div>
  );
}
