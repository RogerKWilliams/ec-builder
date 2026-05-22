# CP1 Work Log — Entity Definition (The "Define" Phase)

## What was built

### Auto-create cloud on mount
- `CloudApp` dispatches `CREATE_CLOUD` in a `useEffect` when state is null
- The app is immediately interactive — no manual "New Cloud" step needed

### Click-to-edit entity boxes
- Each `EntityBox` in the SVG diagram is wrapped in a clickable `<g>` element
- Clicking an entity box sets `selectedEntity` state in `CloudApp`, which opens the side panel editor
- Clicking the diagram background (outside any entity) deselects

### EntityEditor side panel (`src/components/EntityEditor.tsx`)
- Side panel appears on the right when an entity is selected
- Shows entity label, role, and contextual guiding prompt
- Textarea for multi-sentence input
- Prompts dynamically reference filled entities:
  - A: "What is the common objective both sides share?"
  - B: "In order to achieve [A text], we must..."
  - C: "In order to achieve [A text], we must..."
  - D: "In order to have [B text], we must..."
  - D': "In order to have [C text], we must..."
  - Conflict: "Why can't we have both [D text] and [D' text]?"
- Save on blur or Enter (non-shift); Escape cancels and closes
- Close button (✕) in header

### Conflict line clickable
- Zigzag conflict line and label are wrapped in a clickable `<g>` with an invisible wider hit area
- Opens the same EntityEditor with `field='conflict'`
- Empty state shows "Click to define conflict..." instead of "CONFLICT"
- Selected state shows thicker line

### Cloud title input
- Text input in the topbar with placeholder "Name this conflict..."
- Updates cloud title via `SET_CLOUD` dispatch
- Styled consistently with the rest of the topbar

### Visual feedback
- **Empty entities**: muted fill (`#f1f5f9`), dashed border, italic prompt text showing in the box
- **Filled entities**: white fill, solid darker border (`#475569`), content text displayed (truncated at 24 chars)
- **Selected entity**: blue highlight border (`#3b82f6`), light blue fill
- **Progress indicator**: "X of 5 entities defined" in the topbar (right-aligned)

### Arrow reading-direction labels
- Small muted text near each arrow: "In order to... we must..."
- Positioned at the midpoint of each arrow, offset to avoid overlapping the line
- 8px font, `#94a3b8` color — informational, not dominant

## Files modified/created

- `src/components/App.tsx` — auto-create, title input, selection state, layout with side panel, progress indicator
- `src/components/CloudDiagram.tsx` — click handlers, selection highlighting, empty/filled styling, arrow labels, conflict click
- `src/components/EntityEditor.tsx` — **new**: side panel editor with contextual prompts
- `src/styles/app.css` — new CSS variables + styles for empty/filled/selected states, editor panel, title input, arrow labels, progress indicator

## Key design decisions

- **Side panel over inline SVG editing**: SVG foreignObject textareas are fragile. The diagram is the entry point (click), editing happens in a dedicated panel. This keeps the SVG clean and the editing experience reliable.
- **No enforcement of construction order**: Any entity can be edited at any time. The recommended A→B→C→D→D'→Conflict order is suggested by the prompts' dynamic references but never enforced.
- **Single Enter saves, Shift+Enter for newlines**: Consistent with common textarea conventions. Users who need multi-paragraph text use Shift+Enter.
- **Title via SET_CLOUD**: The title field isn't an EntityField, so it updates via SET_CLOUD with a spread of current state. This avoids adding a new action type for a simple field.

## State of the codebase
- TypeScript compiles clean
- All 12 existing unit tests pass
- No new tests added (CP1 is primarily UI interaction; testing will come with more complex logic in CP2+)
