import { Link } from "react-router-dom";
import { Fragment } from "react";
import { useBreadcrumbs } from "@/features/dataroom/hooks/useBreadcrumbs";
import type { ItemId } from "@/features/dataroom/model/types";
import { cn } from "@/lib/utils";

interface BreadcrumbsProps {
  currentFolderId: ItemId | null;
}

export function Breadcrumbs({ currentFolderId }: BreadcrumbsProps) {
  const { data } = useBreadcrumbs(currentFolderId);
  const breadcrumbs = data?.entries ?? [];

  return (
    <nav
      aria-label="breadcrumb"
      className="flex min-h-14 flex-wrap items-center gap-1.5 border-b border-border bg-secondary/30 px-6 py-3"
    >
      {breadcrumbs.map((crumb, index) => {
        const isRoot = crumb.id === null;
        const isLast = index === breadcrumbs.length - 1;
        const isEven = index % 2 === 0;
        const chipClass = cn(
          "inline-flex items-center rounded-lg px-3 py-1.5 text-sm text-secondary-foreground transition-colors",
          isEven ? "bg-secondary" : "bg-muted",
          isLast
            ? "font-semibold ring-1 ring-primary/40"
            : "font-medium hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_8%)]",
        );

        return (
          <Fragment key={crumb.id ?? "root"}>
            {index > 0 && (
              <span aria-hidden="true" className="px-0.5 text-sm text-muted-foreground">
                /
              </span>
            )}
            {/* Root stays a link even when it's the only crumb (missing folder). */}
            {isRoot ? (
              <Link
                to="/"
                aria-current={isLast ? "page" : undefined}
                className={chipClass}
              >
                {crumb.name}
              </Link>
            ) : isLast ? (
              <span aria-current="page" className={chipClass}>
                {crumb.name}
              </span>
            ) : (
              <Link to={`/folder/${crumb.id}`} className={chipClass}>
                {crumb.name}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
