import { createClerkClient } from "@clerk/backend";
import { HttpError } from "./http.js";

// NOTE: the currently-installed @clerk/backend (3.11.7) exports a synchronous
// `createClerkClient(options)` factory, not the `await clerkClient()` shape
// shown in some current Clerk docs (which describe a newer/differently
// versioned API surface) — verified against this package's own .d.ts files.
let _client: ReturnType<typeof createClerkClient> | null = null;
function getClerkClient() {
  if (!_client) {
    _client = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!,
      publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY!,
    });
  }
  return _client;
}

export class AuthError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

const authorizedParties = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined,
  "https://tailored-tech-fullstack-technical.vercel.app",
  // Local Vite (`npm run dev`) and vercel/dev defaults
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://localhost:3210",
].filter((party): party is string => Boolean(party));

export async function requireAuth(request: Request): Promise<string> {
  const state = await getClerkClient().authenticateRequest(request, {
    authorizedParties,
  });

  if (!state.isAuthenticated) {
    const detail =
      "reason" in state && state.reason ? String(state.reason) : "Unauthorized";
    console.error("[auth]", detail, {
      hasAuthorization: Boolean(request.headers.get("authorization")),
      origin: request.headers.get("origin"),
    });
    throw new AuthError(detail);
  }

  const userId = state.toAuth().userId;
  if (!userId) throw new AuthError();
  return userId;
}
