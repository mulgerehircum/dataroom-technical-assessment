import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QueryErrorStateProps {
  message?: string;
  onRetry: () => void;
}

export function QueryErrorState({
  message = "Something went wrong.",
  onRetry,
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-border bg-card p-12 text-center"
    >
      <AlertCircle className="size-10 text-text-tertiary" aria-hidden />
      <div className="space-y-1">
        <p className="text-[13.5px] font-medium text-foreground">{message}</p>
        <p className="text-[12.5px] text-muted-foreground">
          Check your connection and try again.
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onRetry}
        className="rounded-lg"
      >
        Try again
      </Button>
    </div>
  );
}
