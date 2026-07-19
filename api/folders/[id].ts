import { del } from "@vercel/blob";
import { requireAuth } from "../../server/auth.js";
import { HttpError, json, readJson, withHandler } from "../../server/http.js";
import {
  deleteFolderRow,
  getDescendantFileBlobsForFolder,
  getFolderOwned,
  getSiblingNames,
  renameFolderRow,
} from "../../server/db/queries.js";
import { validateItemName } from "../../src/features/dataroom/model/validation.js";
import { dedupeName } from "../../src/features/dataroom/utils/file-name.js";

interface RenameFolderBody {
  name: string;
}

function getFolderId(request: Request): string {
  // Parsed from the URL rather than relying on a framework-provided params
  // object, since the plain "/api" (non-Next.js) convention only documents
  // fetch(request) with no second argument.
  const segments = new URL(request.url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1];
}

export default withHandler(async (request) => {
  const userId = await requireAuth(request);
  const id = getFolderId(request);

  if (request.method === "GET") {
    const folder = await getFolderOwned(id, userId);
    if (!folder) throw new HttpError(404, "Folder not found");
    return json(folder);
  }

  if (request.method === "PATCH") {
    const existing = await getFolderOwned(id, userId);
    if (!existing) throw new HttpError(404, "Folder not found");

    const body = await readJson<RenameFolderBody>(request);
    const trimmedName = (body.name ?? "").trim();
    const validation = validateItemName(trimmedName);
    if (!validation.ok) throw new HttpError(400, validation.message);

    const siblingNames = await getSiblingNames(existing.parentId, userId, id);
    const folder = await renameFolderRow(id, dedupeName(trimmedName, siblingNames));
    return json(folder);
  }

  if (request.method === "DELETE") {
    const existing = await getFolderOwned(id, userId);
    if (!existing) throw new HttpError(404, "Folder not found");

    const blobs = await getDescendantFileBlobsForFolder(id, userId);
    if (blobs.length > 0) {
      await del(blobs.map((blob) => blob.blobUrl));
    }
    await deleteFolderRow(id); // cascades to nested folders/files via FK ON DELETE CASCADE
    return new Response(null, { status: 204 });
  }

  throw new HttpError(405, "Method Not Allowed");
});
