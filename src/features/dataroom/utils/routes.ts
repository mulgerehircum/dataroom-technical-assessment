import type { ItemId } from "@/features/dataroom/model/types";

/**
 * Route builders parameterized by `basePath` so the same components work
 * under both the real app ("" — routes are `/`, `/folder/:id`) and the
 * public demo ("/demo" — routes are `/demo`, `/demo/folder/:id`).
 */
export function dataRoomRootPath(basePath: string): string {
  return basePath || "/";
}

export function dataRoomFolderPath(basePath: string, folderId: ItemId): string {
  return `${basePath}/folder/${folderId}`;
}
