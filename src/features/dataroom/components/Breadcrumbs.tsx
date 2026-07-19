import type { ItemId } from "@/features/dataroom/model/types";

interface BreadcrumbsProps {
  currentFolderId: ItemId | null;
}

// TODO: load ancestor folders and render via buildBreadcrumbs().
export function Breadcrumbs(_props: BreadcrumbsProps) {
  return (
    <nav className="px-6 py-2 text-sm text-muted-foreground">Data Room</nav>
  );
}
