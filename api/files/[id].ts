import { del } from "@vercel/blob";
import { requireAuth } from "../../server/auth.js";
import { HttpError, json, readJson, withHandler } from "../../server/http.js";
import {
  deleteFileRow,
  getFileOwned,
  getSiblingNames,
  renameFileRow,
} from "../../server/db/queries.js";
import { validateItemName } from "../../src/features/dataroom/model/validation.js";
import { dedupeName } from "../../src/features/dataroom/utils/file-name.js";

interface RenameFileBody {
  name: string;
}

function getFileId(request: Request): string {
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

export default withHandler(async (request) => {
  const userId = await requireAuth(request);
  const id = getFileId(request);

  if (request.method === "PATCH") {
    const existing = await getFileOwned(id, userId);
    if (!existing) throw new HttpError(404, "File not found");

    const body = await readJson<RenameFileBody>(request);
    const trimmedName = (body.name ?? "").trim();
    const validation = validateItemName(trimmedName);
    if (!validation.ok) throw new HttpError(400, validation.message);

    const siblingNames = await getSiblingNames(existing.parentId, userId, id);
    const file = await renameFileRow(id, dedupeName(trimmedName, siblingNames));
    return json(file);
  }

  if (request.method === "DELETE") {
    const existing = await getFileOwned(id, userId);
    if (!existing) throw new HttpError(404, "File not found");

    await del(existing.blobUrl);
    await deleteFileRow(id);
    return new Response(null, { status: 204 });
  }

  throw new HttpError(405, "Method Not Allowed");
});
