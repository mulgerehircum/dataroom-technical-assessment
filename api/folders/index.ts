import { requireAuth } from "../../server/auth.js";
import { HttpError, json, readJson, withHandler } from "../../server/http.js";
import {
  createFolderRow,
  getFolderOwned,
  getSiblingNames,
} from "../../server/db/queries.js";
import { validateItemName } from "../../src/features/dataroom/model/validation.js";
import { dedupeName } from "../../src/features/dataroom/utils/file-name.js";

interface CreateFolderBody {
  name: string;
  parentId: string | null;
}

export default withHandler(async (request) => {
  if (request.method !== "POST") throw new HttpError(405, "Method Not Allowed");

  const userId = await requireAuth(request);
  const body = await readJson<CreateFolderBody>(request);
  const trimmedName = (body.name ?? "").trim();

  const validation = validateItemName(trimmedName);
  if (!validation.ok) throw new HttpError(400, validation.message);

  if (body.parentId) {
    const parent = await getFolderOwned(body.parentId, userId);
    if (!parent) throw new HttpError(404, "Parent folder not found");
  }

  const siblingNames = await getSiblingNames(body.parentId ?? null, userId);
  const folder = await createFolderRow(
    dedupeName(trimmedName, siblingNames),
    body.parentId ?? null,
    userId,
  );
  return json(folder, 201);
});
