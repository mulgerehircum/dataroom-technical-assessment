import { requireAuth } from "../server/auth.js";
import { HttpError, json, withHandler } from "../server/http.js";
import {
  getBreadcrumbChain,
  getFolderOwned,
  listChildren,
} from "../server/db/queries.js";

/**
 * One round-trip for a folder page: ancestor chain + children.
 * `GET /api/view` → root. `GET /api/view?folderId=` → nested (404 if missing).
 */
export default withHandler(async (request) => {
  if (request.method !== "GET") throw new HttpError(405, "Method Not Allowed");

  const userId = await requireAuth(request);
  const folderId = new URL(request.url).searchParams.get("folderId");

  if (!folderId) {
    return json({
      ancestors: [],
      items: await listChildren(null, userId),
    });
  }

  const folder = await getFolderOwned(folderId, userId);
  if (!folder) throw new HttpError(404, "Folder not found");

  const [ancestors, items] = await Promise.all([
    getBreadcrumbChain(folderId, userId),
    listChildren(folderId, userId),
  ]);

  return json({ ancestors, items });
});
