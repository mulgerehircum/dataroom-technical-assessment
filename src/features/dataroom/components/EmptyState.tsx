import { Inbox } from "lucide-react";

// TODO: differentiate "empty folder" copy from an upload call-to-action.
export function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[10px] border border-border bg-card p-12 text-muted-foreground">
      <Inbox className="size-10 text-text-tertiary" />
      <p className="text-[13.5px] font-medium">This folder is empty.</p>
    </div>
  );
}
