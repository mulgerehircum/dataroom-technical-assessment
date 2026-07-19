import { requireAuth } from "../server/auth.js";
import { HttpError, json, withHandler } from "../server/http.js";
import { searchItems } from "../server/db/queries.js";

export default withHandler(async (request) => {
  if (request.method !== "GET") throw new HttpError(405, "Method Not Allowed");

  const userId = await requireAuth(request);
  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();

  if (!query) return json([]);
  return json(await searchItems(query, userId));
});
