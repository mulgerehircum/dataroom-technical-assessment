# Dataroom

A full-stack virtual data room: nested folders, PDF uploads, real per-user auth, and search —
deployed on Vercel.

**Live**: https://tailored-tech-fullstack-technical.vercel.app

## Stack

- **Frontend**: Vite + React 18 + TypeScript, React Router, TanStack Query, Tailwind v4 + shadcn/ui
  (`base-nova` style, base-ui/react primitives)
- **Backend**: Vercel Functions (plain `/api` directory, no Next.js) — each route exports
  `{ fetch(request: Request) }`, dispatching on `request.method` internally
- **Database**: Neon Postgres via Drizzle ORM (`drizzle-orm/neon-http`)
- **File storage**: Vercel Blob, public access, client-upload pattern (bytes go straight from the
  browser to Blob storage, never through a serverless function body)
- **Auth**: Clerk (`@clerk/clerk-react` client-side, `@clerk/backend` server-side)
- **Tests**: Vitest + Testing Library (component tests run under `jsdom` via a per-file
  `// @vitest-environment jsdom` pragma; the API layer is verified via `curl`/scripts against the
  real provisioned services rather than in the automated suite — see Testing below)

## Getting started

```bash
npm install
vercel link                          # one-time: associate this repo with the Vercel project
vercel env pull .env.local           # pulls DATABASE_URL, BLOB_READ_WRITE_TOKEN, Clerk keys, etc.
npm run db:push                      # push the Drizzle schema to Neon
npm run dev:full                     # vercel dev — runs the Vite frontend AND /api together
```

`npm run dev` (plain `vite`) still works for narrow frontend-only styling work, but the app calls
`/api/*` for everything now, so `vercel dev` is the real local dev command.

```bash
npm run test      # vitest run
npm run build     # tsc -b && vite build
npm run lint
```

## Data model

**`server/db/schema.ts`** (Drizzle, pushed via `drizzle-kit push`):

- `folders { id (uuid), name, parent_id (uuid, nullable, self-FK, ON DELETE CASCADE), owner_id, created_at, updated_at }`
- `files { id (uuid), name, parent_id (nullable FK to folders), owner_id, mime_type, size, blob_url, blob_pathname, created_at, updated_at }`

`parent_id: null` means "lives at the root." Unlike the earlier IndexedDB prototype (which needed a
`ROOT_PARENT_KEY` sentinel because IndexedDB indexes silently omit `null`-valued fields), Postgres
has no such problem — a real nullable FK with a plain index just works for both root and nested
listings. `ON DELETE CASCADE` on both FKs means folder cascade-delete is a single
`DELETE FROM folders WHERE id = $1` at the SQL level; the only application code is a pre-delete
recursive CTE (`getDescendantFileBlobsForFolder`) that collects nested files' blob URLs so they can
be removed from Blob storage before the rows disappear.

`owner_id` (the Clerk user id) scopes every query — there's no cross-user sharing; each user's data
room is fully private to them.

## Architecture

```
api/                          # Vercel Functions — one file per route, `export default { fetch }`
├── health.ts
├── items.ts                  # GET  /api/items?parentId=
├── search.ts                 # GET  /api/search?q=
├── folders/
│   ├── index.ts               # POST /api/folders
│   ├── [id].ts                 # GET/PATCH/DELETE /api/folders/:id
│   └── [id]/breadcrumbs.ts     # GET  /api/folders/:id/breadcrumbs
└── files/
    ├── index.ts                # POST /api/files (persist metadata after a blob upload)
    ├── [id].ts                  # PATCH/DELETE /api/files/:id
    └── upload-url.ts            # POST /api/files/upload-url (blob client-upload token)

server/                       # shared backend code, imported by api/* (NOT itself routable)
├── auth.ts                    # requireAuth() — Clerk verification
├── http.ts                    # HttpError, withHandler(), json()
└── db/                        # Drizzle schema, client, and query helpers

src/
├── app/                       # router, providers (Clerk/Query/Theme), App shell + auth gate
├── features/dataroom/
│   ├── components/            # presentational UI
│   ├── dialogs/                # create / rename / delete modals
│   ├── hooks/                   # TanStack Query hooks — the only thing UI talks to
│   ├── storage/                  # DataRoomRepository interface + fetch-based implementation
│   ├── model/                     # types, constants, validation (shared with the backend)
│   └── utils/                      # pure helpers (folder tree, file naming, formatting)
├── components/ui/              # shadcn primitives
└── lib/                         # cn(), id generation
```

The UI never calls `fetch` directly — it goes through `dataRoomRepository`
(`storage/dataroom.repository.ts`), bound to `api.repository.ts` (a `fetch`-based implementation of
the same `DataRoomRepository` interface the old IndexedDB version implemented). That interface
boundary is why swapping storage engines this session touched almost no UI code: hooks, dialogs,
and components were written against the interface from the start.

**Auth token plumbing**: `useAuth().getToken()` is hook-bound and can't be called from the
plain-module `dataRoomRepository`. A small bridge (`storage/auth-token.ts`) exposes
`setTokenGetter`/`getAuthToken`; a `ClerkTokenBridge` component (in `App.tsx`) calls `setTokenGetter`
once from inside `<SignedIn>`, and `api.repository.ts` reads the current token via `getAuthToken()`
before every request.

### A real Vercel deployment gotcha worth knowing

Files imported by `api/*.ts` — including ones several directories away in `src/` — must use
relative imports with **explicit `.js` extensions** (e.g. `from "../server/auth.js"`, not
`from "../server/auth"`). Vercel compiles Functions with Node's strict ESM module resolution, which
requires extensions on relative specifiers; local tooling (`vite`, and this repo's own
`tsconfig.api.json` in `bundler` resolution mode) doesn't enforce this, so it type-checks and runs
fine under `vercel dev` and silently breaks only once actually deployed
(`ERR_MODULE_NOT_FOUND` in the function logs). Caught and fixed this session — see git history.

## Auth

Clerk gates the entire app: `App.tsx` renders `<SignedIn>`/`<SignedOut>` around the router, so no
data-fetching hook ever mounts while signed out. Sign-in is a modal (`<SignInButton mode="modal">`),
supporting both social login (Google) and email/password out of the box. Every `/api` route calls
`requireAuth(request)` first, which verifies the bearer token via `@clerk/backend`'s
`createClerkClient(...).authenticateRequest()` and returns the Clerk user id used to scope every
query.

## Search

Filename-only, case-insensitive substring match (`ILIKE`) across the whole data room (not just the
current folder) — `GET /api/search?q=`. The header's search input replaces the folder grid with
results while a query is active; clicking a folder result navigates into it, clicking a file result
opens it directly.

## Testing

- **Pure logic** (`model/*`, `utils/*`): unit tests, `tests/folder-tree.test.ts`,
  `tests/file-name.test.ts`
- **Components/dialogs/pages**: Testing Library against `tests/fakes/fake-dataroom.repository.ts`,
  an in-memory stand-in for `DataRoomRepository` (swapped in via `vi.mock` in `tests/setup.ts`,
  which also mocks `@clerk/clerk-react` since components now render `<UserButton>` etc.) — no real
  network or database involved, same role `fake-indexeddb` used to play before the migration
- **Backend (`/api`, `server/`)**: not covered by the automated suite — verified manually via
  `curl`/throwaway scripts against the real provisioned Neon/Blob/Clerk services during development
  (folder CRUD + cascade delete + dedupe naming, file upload → blob → delete round-trip, auth
  rejecting unauthenticated requests). Spinning up ephemeral real Postgres per CI run wasn't in
  scope for this pass — an accepted boundary, not an oversight.

## Status

All required functional CRUD (folders: create/nest/view/rename/cascade-delete; files:
upload-PDF-only/view/rename/delete) works end to end, tested, and deployed. All three optional
extra-credit items from the brief are implemented: **deployed publicly** (Vercel, real Postgres +
Blob storage), **authentication** (Clerk, social + email/password), **search** (filename, whole data
room).

Known gaps, given the time-boxed nature of this pass:

- Rename/delete are only reachable via each item's right-click context menu — no dedicated
  affordance for keyboard/touch users
- No loading/error UI beyond `sonner` toasts on mutation failure
- Search UX is minimal (no result highlighting, no "jump to this file's location" breadcrumb)
- `FilePreview` renders PDFs via a plain `<iframe src={blobUrl}>` — no fallback for browsers that
  don't render PDFs inline
- Public blob access means a leaked/guessed file URL is viewable without auth; per-user isolation is
  enforced at the Postgres/API ownership layer, not by URL secrecy — a deliberate, documented MVP
  tradeoff, not an oversight
