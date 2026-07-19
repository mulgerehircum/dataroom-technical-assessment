import { requireAuth } from "../server/auth.js";
import { HttpError, json, withHandler } from "../server/http.js";
import { getFolderOwned, listChildren } from "../server/db/queries.js";

export default withHandler(async (request) => {
  if (request.method !== "GET") throw new HttpError(405, "Method Not Allowed");

  const userId = await requireAuth(request);
  const parentId = new URL(request.url).searchParams.get("parentId");

  if (parentId) {
    const parent = await getFolderOwned(parentId, userId);
    if (!parent) throw new HttpError(404, "Folder not found");
  }

  return json(await listChildren(parentId, userId));
});
