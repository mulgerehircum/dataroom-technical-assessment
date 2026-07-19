# Dataroom

A browser-only virtual data room: nested folders, PDF uploads, and CRUD on both, persisted client-side.

## Stack

- Vite + React 18 + TypeScript, React Router, TanStack Query
- Tailwind v4 + shadcn/ui (`base-nova` style, base-ui/react primitives) for UI
- `idb` (IndexedDB wrapper) for storage, Vitest for unit tests

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # vitest run
npm run build    # tsc -b && vite build
npm run lint
```

## Data model

Folders and files share one flat address space keyed by `parentId`:

- `FolderEntity { id, name, parentId: ItemId | null, createdAt, updatedAt }`
- `FileEntity { id, name, parentId: ItemId | null, mimeType, size, blob, createdAt, updatedAt }`

`parentId: null` means "lives at the root" — there is no synthetic root folder row. This keeps
tree logic (`src/features/dataroom/utils/folder-tree.ts`) simple: breadcrumbs, listing children,
and cascade-delete are all plain array walks over `DataRoomItem[]`, independent of storage.

**IndexedDB gotcha:** IndexedDB indexes silently omit any record whose indexed field is `null`,
so root-level items would be invisible to a `parentId` index. The storage layer (`storage/db.ts`)
persists `parentId` under a `ROOT_PARENT_KEY` sentinel instead and maps it back to `null` at the
repository boundary — the rest of the app never sees the sentinel.

Files are stored as `Blob`s directly in IndexedDB (no external upload target — "browser memory" per
the brief), only PDFs are accepted (`ALLOWED_FILE_MIME_TYPES` in `model/constants.ts`).

## Architecture

```
src/
├── app/                     # router, providers, App shell
├── features/dataroom/
│   ├── components/          # presentational UI (grid, items, header, breadcrumbs, preview)
│   ├── dialogs/             # create / rename / delete modals
│   ├── hooks/                # TanStack Query hooks — the only thing UI talks to
│   ├── storage/              # DataRoomRepository interface + IndexedDB implementation
│   ├── model/                 # types, constants, validation
│   └── utils/                 # pure helpers (folder tree, file naming, formatting)
├── components/ui/            # shadcn primitives
└── lib/                       # cn(), id generation
```

The UI never talks to IndexedDB directly — it goes through `dataRoomRepository`
(`storage/dataroom.repository.ts`), so the storage engine can be swapped (e.g. an in-memory fake
for tests) without touching components or hooks.

## Status

This is a structural scaffold, not a finished feature. Real, tested code:

- `model/*`, `utils/folder-tree.ts`, `utils/file-name.ts`, `utils/format-file-size.ts` (covered by
  `tests/folder-tree.test.ts`, `tests/file-name.test.ts`)
- `storage/db.ts` — the actual IndexedDB schema (stores, indexes, upgrade path)
- App shell (`app/*`, `main.tsx`), routing, providers, and the hooks-to-repository wiring

Stubbed for a follow-up pass (each throws / renders a placeholder with a `TODO` comment at the call
site):

- `storage/indexeddb.repository.ts` — CRUD methods against the schema in `db.ts`
- Dialogs (`CreateFolderDialog`, `RenameItemDialog`, `DeleteItemDialog`) — currently render empty
  shells with no form
- `UploadDropzone`, `FilePreview` — no drag-drop or PDF rendering yet
- `DataRoomHeader`, `Breadcrumbs` — no actions or live breadcrumb trail yet

None of the four CRUD flows (create/view/rename/delete for folders and files) are functionally
wired end-to-end yet; `useFolderContents` / `useFolderActions` / `useFileActions` already call the
repository contract, so completing `indexeddb.repository.ts` is what unblocks all of them at once.
