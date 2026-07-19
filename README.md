# Dataroom

A browser-only virtual data room: nested folders, PDF uploads, and CRUD on both, persisted client-side.

## Stack

- Vite + React 18 + TypeScript, React Router, TanStack Query
- Tailwind v4 + shadcn/ui (`base-nova` style, base-ui/react primitives) for UI
- `idb` (IndexedDB wrapper) for storage
- Vitest + Testing Library for tests (`fake-indexeddb` polyfills IndexedDB in Node; component tests
  run under `jsdom` via a per-file `// @vitest-environment jsdom` pragma)

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

All four CRUD flows (create/view/rename/delete, for both folders and files) work end to end and are
tested — storage, hooks, and UI.

- `model/*`, `utils/folder-tree.ts`, `utils/file-name.ts`, `utils/format-file-size.ts` — pure logic,
  covered by `tests/folder-tree.test.ts`, `tests/file-name.test.ts`
- `storage/db.ts` + `storage/indexeddb.repository.ts` — full CRUD against IndexedDB, including
  cascade-delete and name-collision handling via `dedupeName`, covered by
  `tests/indexeddb.repository.test.ts` (run against `fake-indexeddb`)
- `dialogs/*`, `components/UploadDropzone.tsx`, `components/FilePreview.tsx`,
  `components/Breadcrumbs.tsx` — real forms and interactions wired to `useFolderActions` /
  `useFileActions` / `useBreadcrumbs`, covered by component tests
  (`tests/CreateFolderDialog.test.tsx`, `tests/RenameItemDialog.test.tsx`,
  `tests/DeleteItemDialog.test.tsx`, `tests/UploadDropzone.test.tsx`, `tests/Breadcrumbs.test.tsx`)
- `tests/DataRoomPage.test.tsx` — integration test through the real route table: create a folder,
  navigate into it, confirm the breadcrumb updates, upload a PDF, open it in the preview dialog

Known gaps / next pass:

- Rename/delete are only reachable via each item's right-click context menu (no dedicated affordance
  for keyboard/touch users)
- No loading/error UI beyond `sonner` toasts on mutation failure — e.g. no skeleton while a folder's
  contents are loading
- `FilePreview` renders the PDF via a plain `<iframe>` — fine for modern browsers, no fallback for
  browsers that don't render PDFs inline
