# CP2 Work Log — Assumption Surfacing (The "Surface" Phase)

## What was built

### Generalized selection model (`App.tsx`)
- Replaced `selectedEntity: EntityField | null` with a discriminated union:
  ```ts
  type Selection =
    | { type: 'entity'; field: EntityField }
    | { type: 'arrow'; arrowId: ArrowId }
    | null;
  ```
- Exported as `Selection` from `App.tsx` (CloudDiagram imports it for prop typing)
- `CloudApp` now passes `selection`, `onSelectEntity`, and `onSelectArrow` to `CloudDiagram`
- Side panel conditionally renders `EntityEditor` (entity selected) or `ArrowDetail` (arrow selected) — never both
- Clicking diagram background still deselects (sets selection to `null`)

### Arrow click interaction (`CloudDiagram.tsx`)
- Each arrow now has an invisible 20px-wide hit area `<line>` rendered behind the visible arrow
- Hit area has `cursor: pointer` and calls `onSelectArrow(arrowId)` with `e.stopPropagation()` to prevent background deselection
- Conflict zigzag already had a hit area from CP1; its click handler now calls `onSelectArrow('D-Dp')` instead of `onSelectEntity('conflict')`
- Arrow-to-ArrowId mapping added to the `arrows` array: `{ from: 'B', to: 'A', arrowId: 'A-B' }` etc.

### Assumption count badges (`CloudDiagram.tsx`)
- `AssumptionBadge` SVG sub-component renders a circle + text near each arrow's midpoint
- Badge position is offset perpendicular to the arrow (opposite side from the label)
- Normal state: gray circle with count number
- "Needs attention" state (count === 0): amber circle with "!" exclamation mark
- Selected state: blue stroke ring around the badge
- Badges have `pointerEvents: 'none'` — clicks pass through to the arrow hit area

### "Needs attention" visual indicators (`CloudDiagram.tsx` + `app.css`)
- Arrows with zero assumptions render with:
  - Amber stroke color (`#f59e0b`)
  - Dashed line (`stroke-dasharray: 6 3`)
- Conflict line with zero assumptions gets the same dashed treatment + reduced opacity
- These indicators disappear as soon as the first assumption is added to that arrow

### ArrowDetail panel (`src/components/ArrowDetail.tsx`)
- Side panel component, same slot as EntityEditor
- **Header**: Arrow label (e.g., "A ← B" or "D ↔ D'"), role ("Connection" or "Conflict"), close button
- **Contextual prompt** per arrow type:
  - A←B / A←C: "Why do we believe [B/C text] is necessary for [A text]?"
  - B←D / C←D': "Why do we believe [D/D' text] is the way to achieve [B/C text]?"
  - D↔D': "Why do we believe [D text] and [D' text] cannot coexist?"
  - Prompts dynamically reference filled entity text, falling back to `[A]`, `[B]`, etc.
- **Add textarea**: Placeholder "Add an assumption...", Enter to add, Escape to close panel
- **Add button**: Blue, disabled when textarea is empty, focus returns to textarea after adding
- **Assumption list**: Each assumption rendered as `AssumptionItem` with:
  - Text display
  - Edit button → inline textarea (save on blur/Enter, cancel on Escape)
  - Delete button → dispatches `REMOVE_ASSUMPTION` (cascades to linked injections)
- **Empty state**: Italic prompt "No assumptions yet. What must be true for this connection to hold?"

### Arrow configuration mapping (`ArrowDetail.tsx`)
- `ARROW_CONFIG` record maps each `ArrowId` to `{ fromKey, toKey, label }`:
  - `'A-B'` → `{ fromKey: 'B', toKey: 'A', label: 'A ← B' }`
  - `'A-C'` → `{ fromKey: 'C', toKey: 'A', label: 'A ← C' }`
  - `'B-D'` → `{ fromKey: 'D', toKey: 'B', label: 'B ← D' }`
  - `'C-Dp'` → `{ fromKey: 'Dp', toKey: 'C', label: 'C ← D'' }`
  - `'D-Dp'` → `{ fromKey: 'D', toKey: 'Dp', label: 'D ↔ D'' }`

## Files modified/created

- `src/components/App.tsx` — new `Selection` type (exported), generalized selection state, two callbacks (`handleSelectEntity`, `handleSelectArrow`), conditional panel rendering for entity vs arrow
- `src/components/CloudDiagram.tsx` — new props (`selection`, `onSelectArrow`), arrow click hit areas, `AssumptionBadge` sub-component, assumption count computation, needs-attention CSS classes on arrows/conflict
- `src/components/ArrowDetail.tsx` — **new**: arrow detail panel with assumption CRUD, `AssumptionItem` sub-component with inline editing
- `src/components/ArrowDetail.test.ts` — **new**: 5 unit tests for assumption interactions
- `src/styles/app.css` — new CSS variables (`--badge-*`, `--arrow-selected-color`, `--arrow-attention-color`, `--assumption-*`, `--delete-color`), arrow selected/attention states, badge styles, arrow detail panel styles, assumption list/item styles

## Key design decisions

- **Selection discriminated union over two separate state variables**: A single `Selection` type guarantees mutual exclusivity — you can't have both an entity and an arrow selected. This simplifies the panel rendering logic.
- **Hit areas on arrows**: SVG lines with 2px stroke are nearly impossible to click. Transparent 20px-wide lines underneath catch the clicks. Same pattern already used for the conflict zigzag in CP1.
- **Badge position perpendicular to arrow**: Badges sit on the opposite side from the "In order to..." label text, avoiding overlap.
- **Amber "needs attention" over red**: Red is reserved for the conflict line. Amber signals "incomplete" without implying error.
- **Conflict line opens ArrowDetail, not EntityEditor**: In CP1 the conflict click opened EntityEditor for the conflict description. Now it opens ArrowDetail for conflict assumptions. The conflict description is still editable by clicking entity D or D' area — or could be revisited if needed. (The conflict _statement_ editing via entity click on the zigzag was removed in favor of assumption surfacing, which is the core CP2 workflow.)
- **No React Testing Library**: Not in dependencies. Tests exercise assumption CRUD through the reducer, which is where the logic lives. The component is a thin UI layer over dispatch calls.

## State of the codebase
- TypeScript compiles clean (`tsc -b --noEmit` — zero errors)
- All 17 unit tests pass (12 from CP0/CP1 + 5 new CP2 tests)
- No regressions in existing functionality

## CP2 patch: split D-D' click zones

### Problem
CP2 repurposed the entire conflict zigzag click to open ArrowDetail for assumptions, losing the ability to edit the conflict _description_ from the diagram.

### Solution
Split the D-D' junction into two stacked click zones separated by the zigzag line:

- **Above the zigzag** (transparent `<rect>`, y: zigzagY-48 to zigzagY): calls `onSelectEntity('conflict')` → opens EntityEditor for the conflict statement. Shows "CONFLICT" label (or "Click to define conflict..." when empty).
- **Below the zigzag** (transparent `<rect>`, y: zigzagY to zigzagY+48): calls `onSelectArrow('D-Dp')` → opens ArrowDetail for assumption CRUD. Shows "Click to add assumptions..." (when empty) or "N assumption(s)" count, with the AssumptionBadge below.

The zigzag path itself has `pointerEvents: 'none'` — clicks pass through to whichever zone the cursor is in. Visual highlight states are independent: conflict label highlights on entity selection, assumptions label/badge highlight on arrow selection.

### Files modified
- `src/components/CloudDiagram.tsx` — replaced single `<g>` click handler with two transparent `<rect>` hit zones; moved badge below zigzag; added assumptions count label
- `src/styles/app.css` — added `.ec-conflict-assumptions-label` and its `.ec-conflict-selected` variant

### State of the codebase
- TypeScript compiles clean (`tsc -b --noEmit` — zero errors)
- All 17 unit tests pass — no regressions
