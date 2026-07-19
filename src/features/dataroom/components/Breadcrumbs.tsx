import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useBreadcrumbs } from "@/features/dataroom/hooks/useBreadcrumbs";
import type { ItemId } from "@/features/dataroom/model/types";

interface BreadcrumbsProps {
  currentFolderId: ItemId | null;
}

export function Breadcrumbs({ currentFolderId }: BreadcrumbsProps) {
  const { data: breadcrumbs = [] } = useBreadcrumbs(currentFolderId);

  return (
    <nav className="flex items-center gap-1 px-6 py-2 text-sm text-muted-foreground">
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <span key={crumb.id ?? "root"} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="size-3.5" />}
            {isLast ? (
              <span className="text-foreground">{crumb.name}</span>
            ) : (
              <Link
                to={crumb.id ? `/folder/${crumb.id}` : "/"}
                className="hover:text-foreground hover:underline"
              >
                {crumb.name}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
