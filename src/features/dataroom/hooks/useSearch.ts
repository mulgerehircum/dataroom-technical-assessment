import { useQuery } from "@tanstack/react-query";
import { dataRoomRepository } from "@/features/dataroom/storage/dataroom.repository";

export function useSearch(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ["dataroom", "search", trimmed],
    queryFn: () => dataRoomRepository.search(trimmed),
    enabled: trimmed.length > 0,
  });
}
