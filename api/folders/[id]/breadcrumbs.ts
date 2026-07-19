import { requireAuth } from "../../../server/auth.js";
import { HttpError, json, withHandler } from "../../../server/http.js";
import { getBreadcrumbChain, getFolderOwned } from "../../../server/db/queries.js";

function getFolderId(request: Request): string {
  // .../folders/<id>/breadcrumbs
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 2];
}

export default withHandler(async (request) => {
  if (request.method !== "GET") throw new HttpError(405, "Method Not Allowed");

  const userId = await requireAuth(request);
  const id = getFolderId(request);

  const folder = await getFolderOwned(id, userId);
  if (!folder) throw new HttpError(404, "Folder not found");

  return json(await getBreadcrumbChain(id, userId));
});
