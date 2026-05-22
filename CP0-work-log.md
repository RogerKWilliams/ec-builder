# CP0 Work Log — Project Scaffolding + Data Model + Cloud Diagram

## What was built

### Project initialization
- Scaffolded Vite + React 19 + TypeScript 5.9 project (`ec-builder/`)
- Installed dependencies: `uuid` (runtime), `@types/uuid`, `vitest`, `jsdom` (dev)
- Configured Vitest with jsdom environment
- TypeScript strict mode enabled (matches CRT Builder conventions)

### New files

- `src/types/ec.ts` — Data model types
  - `ECCloud`: id, title, timestamps, 5 entity strings, conflict statement, assumptions array, injections array
  - `ArrowId`: union type `'A-B' | 'A-C' | 'B-D' | 'C-Dp' | 'D-Dp'` — arrows are implicit, referenced by ID rather than stored as objects
  - `ECAssumption`: id, arrowId, text, challenged, valid (boolean | null), challengeNotes
  - `ECInjection`: id, targetAssumptionId, text, feasibilityNotes, sufficiencyNotes
  - `ConflictStatement`: description string

- `src/state/cloudStore.tsx` — Context + useReducer state management
  - 9 actions: `CREATE_CLOUD`, `SET_CLOUD`, `UPDATE_ENTITY`, `ADD_ASSUMPTION`, `UPDATE_ASSUMPTION`, `REMOVE_ASSUMPTION`, `ADD_INJECTION`, `UPDATE_INJECTION`, `REMOVE_INJECTION`
  - `UPDATE_ENTITY` uses an `EntityField` discriminator to handle all 5 entities + conflict in one action — the conflict field writes to `conflict.description`, all others write directly
  - `REMOVE_ASSUMPTION` cascades: also removes any injections linked to the removed assumption
  - `CloudProvider` component and `useCloudStore` hook

- `src/state/cloudStore.test.ts` — 12 unit tests
  - CREATE_CLOUD: creates new cloud with empty entities
  - SET_CLOUD: full state replacement
  - UPDATE_ENTITY: objective, requirementB, conflict description, null-state guard
  - ADD_ASSUMPTION: adds to correct arrow with default fields
  - UPDATE_ASSUMPTION: partial update preserves untouched fields
  - REMOVE_ASSUMPTION: removes assumption + cascades to linked injections
  - ADD_INJECTION: links to target assumption
  - UPDATE_INJECTION: partial update preserves untouched fields
  - REMOVE_INJECTION: removes only the specified injection

- `src/components/CloudDiagram.tsx` — Purpose-built SVG cloud diagram
  - 800×500 viewBox, responsive via `preserveAspectRatio="xMidYMid meet"`
  - 5 entity boxes (180×70px) positioned in the standard EC layout:
    ```
          [A - Objective]
          /             \
     [B - Req]        [C - Req]
        |                |
     [D - Prereq] ⚡ [D' - Prereq]
    ```
  - 4 directed arrows with SVG arrowhead markers (B→A, C→A, D→B, D'→C)
  - Edge-point calculation for clean arrow termination at box boundaries
  - Red zigzag conflict line between D and D' with "CONFLICT" label
  - Entity boxes show label (A/B/C/D/D'), role (Objective/Requirement/Prerequisite), and truncated entity text when populated

- `src/components/App.tsx` — Root component with CloudProvider wrapping CloudDiagram
- `src/styles/app.css` — CSS variables for entity, arrow, and conflict styling; topbar header; centered diagram area
- `vitest.config.ts` — Vitest configuration with jsdom environment

## Key design decisions

- **Arrows are implicit**: The 5 connections are fixed by EC structure. No `ECArrow` objects stored — assumptions reference connections via `ArrowId`. This avoids over-engineering a fixed topology.
- **No ReactFlow/Dagre**: Purpose-built SVG is simpler and more appropriate for a fixed 5-node layout. Edge-point math handles arrow positioning; no layout engine needed.
- **Cascading assumption removal**: Removing an assumption also removes all injections targeting it, maintaining referential integrity without requiring manual cleanup.
- **CloudProvider starts with null state**: Like CRT Builder's `TreeProvider`, the initial state is null. `CREATE_CLOUD` initializes it. This allows future persistence to load saved state on mount.
- **Entity text truncation in diagram**: SVG text doesn't wrap, so entity content is truncated at 24 characters with ellipsis. Full editing UI will come in CP1.

## State of the codebase
- TypeScript compiles clean (`npx tsc -b --noEmit`)
- All 12 unit tests pass
- App renders the static cloud diagram (view-only — no interaction yet)

## Files created
```
ec-builder/
  src/
    types/ec.ts
    state/cloudStore.tsx
    state/cloudStore.test.ts
    components/App.tsx
    components/CloudDiagram.tsx
    styles/app.css
  main.tsx
  vitest.config.ts
```
