import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { requireAuth } from "../../server/auth.js";
import { HttpError, withHandler } from "../../server/http.js";
import {
  ALLOWED_FILE_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "../../src/features/dataroom/model/constants.js";

export default withHandler(async (request) => {
  if (request.method !== "POST") throw new HttpError(405, "Method Not Allowed");

  // Gates token issuance on being signed in; the client attaches its bearer
  // token to this request the same way it does for every other /api call.
  await requireAuth(request);

  const body = (await request.json()) as HandleUploadBody;

  const jsonResponse = await handleUpload({
    body,
    request,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: [...ALLOWED_FILE_MIME_TYPES],
      maximumSizeInBytes: MAX_FILE_SIZE_BYTES,
      // Pathname is the display filename; without a suffix, uploading
      // "CV.pdf" in a second folder (or replacing in-place) collides.
      addRandomSuffix: true,
    }),
  });

  return Response.json(jsonResponse);
});
