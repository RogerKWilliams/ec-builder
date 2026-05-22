# CP4 Work Log — Persistence (Save/Load/Export)

## What was built

### localStorage auto-save (`persistence.ts`, `App.tsx`)
- Debounced write (2-second delay) triggers on every state change via `useEffect` watching `state`
- Storage key: `ec-builder-cloud`, timestamp key: `ec-builder-last-saved`
- On mount, `loadFromLocalStorage()` restores the saved cloud; falls back to `CREATE_CLOUD` if nothing saved
- `debounce()` utility returns `[debouncedFn, cancelFn]` — cancel is called on cleanup

### Ctrl+S manual save (`App.tsx`)
- `keydown` listener on `window` intercepts Ctrl+S / Cmd+S, calls `saveToLocalStorage()` immediately (bypasses debounce)
- Updates `lastSaved` state to reflect the manual save timestamp

### JSON export (`exportJson.ts`)
- Downloads full `ECCloud` as pretty-printed JSON via Blob + programmatic anchor click
- Filename: `{slugified-title}-{YYYY-MM-DD}.json`, defaulting to `ec-cloud-{date}.json` if untitled

### JSON import with validation (`importJson.ts`, `persistence.ts`)
- `importCloudFromFile(file)` returns `Promise<ImportResult>` — either `{ ok: true, cloud }` or `{ ok: false, error }`
- Validation via `validateECCloud()`:
  - Checks all required top-level fields exist with correct types (`id`, `objective`, `requirementB`, `requirementC`, `prerequisiteD`, `prerequisiteDPrime`, `conflict`)
  - Validates `conflict` is an object with a `description` string
  - Validates every assumption has `id`, `arrowId` (must be one of `A-B`, `A-C`, `B-D`, `C-Dp`, `D-Dp`), and `text`
  - Validates every injection has `id`, `targetAssumptionId`, and `text`
  - Empty strings pass — content is not enforced, only structure
- Confirmation dialog if current cloud has content before replacing

### Markdown export (`exportMarkdown.ts`)
- Full structured document with natural reading-direction sentences:
  - **The Conflict** section: all five entities in "In order to [X], we must [Y]" format, plus conflict statement
  - **Assumptions** section: grouped by arrow (A←B, B←D, A←C, C←D', D↔D'), each showing status (Unchallenged/Valid/Invalid), challenge notes, and linked injections with feasibility/sufficiency notes
  - **Injections Summary** section: flat list of all injections with target assumption context
  - **Analysis Status** section: entities defined, assumptions surfaced/challenged, invalid found, injections proposed
- Empty sections show placeholder text ("*No assumptions surfaced yet.*")
- Download as `{title}-{date}.md`

### "New Cloud" action (`FileControls.tsx`, `App.tsx`)
- Clears localStorage and timestamp, dispatches `CREATE_CLOUD`
- Confirmation dialog if current cloud has any content (title, entities, conflict, assumptions, or injections)

### File controls UI (`FileControls.tsx`, `app.css`)
- Five buttons in the topbar: New, Save, Load, Export JSON, Export MD
- Hidden file input for Load (accepts `.json` only), resets after each use so the same file can be re-loaded
- Last-saved timestamp displayed as "Saved HH:MM" with full ISO string in title attribute
- Compact styling that fits naturally in the existing topbar layout

### Unit tests (16 new tests)
- `persistence.test.ts` (10 tests): valid cloud accepted, empty strings accepted, null rejected, string rejected, missing fields rejected, missing conflict rejected, invalid arrowId rejected, missing assumption id rejected, missing injection targetAssumptionId rejected, non-array assumptions rejected
- `exportMarkdown.test.ts` (6 tests): title + entities present, assumption statuses rendered correctly, injections nested under assumptions, empty cloud handled gracefully, analysis status counts accurate, injections summary section populated

## Files created

- `src/utils/persistence.ts` — localStorage save/load, `validateECCloud()`, `debounce()`
- `src/utils/exportJson.ts` — JSON file download
- `src/utils/importJson.ts` — JSON file import + validation
- `src/utils/exportMarkdown.ts` — Markdown export + download
- `src/components/FileControls.tsx` — file action buttons + timestamp display
- `src/utils/persistence.test.ts` — 10 validation tests
- `src/utils/exportMarkdown.test.ts` — 6 markdown export tests

## Files modified

- `src/components/App.tsx` — localStorage restore on mount, debounced auto-save, Ctrl+S handler, FileControls wired into topbar with import/new/save callbacks
- `src/styles/app.css` — `.file-controls`, `.file-btn`, `.last-saved` styles

## Key design decisions

- **Same format for save and export**: Following CRT Builder pattern — `ECCloud` is serialized identically to localStorage and to JSON file export. No separate serialization layer.
- **Validation checks structure, not content**: Empty strings pass validation. This allows saving/exporting partially-filled clouds and ensures forward compatibility if optional fields are added later.
- **ArrowId validation in assumptions**: Unlike the CRT Builder which only spot-checks the first node/edge, EC validation checks every assumption's `arrowId` against the known set. The assumption array is typically small, so exhaustive validation is cheap and catches more corruption.
- **Debounce ref pattern**: The debounced save function is stored in a `useRef` to avoid recreating it on every render while still being able to call `cancel()` on cleanup.
- **FileControls as pure component**: All state management (save, import, new) is handled by callbacks from the parent. FileControls only manages the file input ref and confirmation dialogs.

## State of the codebase
- TypeScript compiles clean (`tsc -b --noEmit` — zero errors)
- All 38 unit tests pass (22 from CP0–CP3 + 16 new CP4 tests)
- No regressions in existing functionality
