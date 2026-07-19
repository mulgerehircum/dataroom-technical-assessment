import { requireAuth } from "../../server/auth.js";
import { HttpError, json, readJson, withHandler } from "../../server/http.js";
import {
  createFileRow,
  getFolderOwned,
  getSiblingNames,
} from "../../server/db/queries.js";
import { validateFileUpload } from "../../src/features/dataroom/model/validation.js";
import { dedupeName } from "../../src/features/dataroom/utils/file-name.js";

interface CreateFileBody {
  name: string;
  parentId: string | null;
  mimeType: string;
  size: number;
  blobUrl: string;
  blobPathname: string;
}

export default withHandler(async (request) => {
  if (request.method !== "POST") throw new HttpError(405, "Method Not Allowed");

  const userId = await requireAuth(request);
  const body = await readJson<CreateFileBody>(request);

  // Re-validate server-side even though the client already checked before
  // uploading — never trust client-only validation once there's a real backend.
  const validation = validateFileUpload({
    name: body.name,
    type: body.mimeType,
    size: body.size,
  });
  if (!validation.ok) throw new HttpError(400, validation.message);

  if (body.parentId) {
    const parent = await getFolderOwned(body.parentId, userId);
    if (!parent) throw new HttpError(404, "Parent folder not found");
  }

  const siblingNames = await getSiblingNames(body.parentId ?? null, userId);

  const file = await createFileRow({
    name: dedupeName(body.name.trim(), siblingNames),
    parentId: body.parentId ?? null,
    ownerId: userId,
    mimeType: body.mimeType,
    size: body.size,
    blobUrl: body.blobUrl,
    blobPathname: body.blobPathname,
  });
  return json(file, 201);
});
