import { Skeleton } from "@/components/ui/skeleton";

function FolderCardSkeleton() {
  return (
    <div
      className="flex items-center gap-3.5 rounded-[10px] border border-border bg-card px-[18px] py-[18px]"
      aria-hidden
    >
      <Skeleton className="size-8 shrink-0 rounded-[4px_8px_4px_4px]" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

function FileRowSkeleton() {
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_8rem_2.5rem] items-center gap-3 px-3 py-3"
      aria-hidden
    >
      <div className="flex min-w-0 items-center gap-3">
        <Skeleton className="h-[34px] w-[30px] shrink-0 rounded-[3px]" />
        <Skeleton className="h-3.5 w-40 max-w-full" />
      </div>
      <Skeleton className="h-3 w-10" />
      <Skeleton className="h-3 w-16" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-6 shrink-0 rounded-full" />
        <Skeleton className="h-3 w-14" />
      </div>
      <Skeleton className="size-[34px] justify-self-end rounded-[7px]" />
    </div>
  );
}

/** Placeholder layout matching ContentsGrid — folders grid + file list. */
export function ContentsSkeleton() {
  return (
    <div
      className="flex flex-col gap-8"
      role="status"
      aria-busy="true"
      aria-label="Loading contents"
    >
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] font-bold tracking-[0.06em] text-text-tertiary uppercase">
          Folders
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <FolderCardSkeleton />
          <FolderCardSkeleton />
          <FolderCardSkeleton />
        </div>
      </section>

      <section className="flex flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_7.5rem_8rem_2.5rem] gap-3 border-b border-border px-3 pb-2 text-[11px] font-bold tracking-[0.06em] text-text-tertiary uppercase">
          <span>Name</span>
          <span>Size</span>
          <span>Modified</span>
          <span>Owner</span>
          <span className="sr-only">Actions</span>
        </div>
        <ul className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <li key={index}>
              <FileRowSkeleton />
            </li>
          ))}
        </ul>
      </section>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
