import { useParams } from "react-router-dom";
import { DataRoomHeader } from "@/features/dataroom/components/DataRoomHeader";
import { Breadcrumbs } from "@/features/dataroom/components/Breadcrumbs";
import { ContentsGrid } from "@/features/dataroom/components/ContentsGrid";
import { useFolderContents } from "@/features/dataroom/hooks/useFolderContents";
import type { ItemId } from "@/features/dataroom/model/types";

export function DataRoomPage() {
  const params = useParams<{ folderId?: string }>();
  const folderId: ItemId | null = params.folderId ?? null;
  const { data: items = [] } = useFolderContents(folderId);

  return (
    <div className="flex h-full flex-col">
      <DataRoomHeader folderId={folderId} />
      <Breadcrumbs currentFolderId={folderId} />
      <ContentsGrid items={items} folderId={folderId} />
    </div>
  );
}
