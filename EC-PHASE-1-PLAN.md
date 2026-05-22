# Phase 1 Plan — Evaporating Cloud Builder

**Status:** Draft
**Target hours:** 6–10
**Stack:** React 19 + TypeScript 5.9 + Vite (same as CRT Builder)
**Architecture:** Separate app, shared conventions

---

## Design Philosophy

The Evaporating Cloud is a **fixed-topology thinking structure**, not a freeform graph. Five entities, five arrows, one conflict line — the diagram never changes shape. This means the tool's value concentrates in three places:

1. **Guided construction** — walking the practitioner through defining each entity in the right sequence
2. **Assumption surfacing** — the core analytical work happens on the arrows, not the boxes
3. **Export quality** — the cloud with its assumptions and injections needs to be communicable to others

The CRT Builder earned its complexity from flexible topology (arbitrary nodes, edges, junctions, layout). The EC Builder earns its complexity from **depth per connection** — each of the five arrows carries assumptions that need to be surfaced, challenged, and potentially resolved with injections.

### What this is NOT

This is not a simplified version of the CRT canvas with fewer nodes. ReactFlow, Dagre, and the drag-to-connect interaction model are likely unnecessary. A purpose-built SVG or CSS layout of the fixed cloud structure will be simpler, more reliable, and better suited to the EC's visual conventions.

---

## Data Model

```typescript
// Core entities
interface ECCloud {
  id: string;
  title: string;                    // User-provided name for this cloud
  createdAt: string;
  updatedAt: string;
  objective: string;                // A — the common objective
  requirementB: string;             // B — "In order to [A], I must [B]"
  requirementC: string;             // C — "In order to [A], I must [C]"
  prerequisiteD: string;            // D — "In order to [B], I must [D]"
  prerequisiteDPrime: string;       // D' — "In order to [C], I must [D']"
  conflict: ConflictStatement;      // D <-> D'
  arrows: ECArrow[];                // 5 arrows: A←B, A←C, B←D, C←D'
  assumptions: ECAssumption[];      // Assumptions behind each arrow + conflict
  injections: ECInjection[];        // Proposed resolutions
}

interface ConflictStatement {
  description: string;              // Why D and D' cannot coexist
}

// Each arrow connects two entities and carries assumptions
type ArrowId = 'A-B' | 'A-C' | 'B-D' | 'C-Dp' | 'D-Dp';

interface ECAssumption {
  id: string;
  arrowId: ArrowId;                 // Which connection this assumption underlies
  text: string;
  challenged: boolean;              // Has this been examined?
  valid: boolean | null;            // null = unchallenged, true = holds, false = invalid
  challengeNotes: string;           // Why it's valid or invalid
}

interface ECInjection {
  id: string;
  targetAssumptionId: string;       // Which assumption this injection breaks
  text: string;                     // The proposed action/condition
  feasibilityNotes: string;         // Can we actually do this?
  sufficiencyNotes: string;         // Does this fully resolve the conflict?
}
```

### Design notes on the model

- **Arrows are implicit, not stored as objects.** The five connections are fixed by the EC structure. Assumptions reference their arrow by `ArrowId` rather than a separate arrow entity. This avoids over-engineering a fixed topology.
- **Assumptions are the core content.** A cloud with five entities but no assumptions is incomplete. The tool should make assumption surfacing feel like the natural next step, not an optional add-on.
- **Injections link to specific assumptions.** A good injection doesn't just "resolve the conflict" abstractly — it breaks a specific invalid assumption. This traceability is important for rigor.
- **The conflict connection (D↔D') also carries assumptions.** Why do we believe D and D' are truly incompatible? Sometimes the conflict itself rests on a challengeable assumption.

---

## Workflow Phases

The EC has a natural construction sequence that the tool should guide without enforcing rigidly:

1. **Define** — Name the cloud, enter the five entities and conflict statement
2. **Surface** — For each arrow, list the underlying assumptions (why do we believe this connection holds?)
3. **Challenge** — Examine each assumption: does it hold? What evidence supports or contradicts it?
4. **Inject** — For invalid assumptions, propose injections that break them
5. **Review** — See the complete cloud with all assumptions and injections; export

The practitioner should be able to move freely between phases — this is a thinking tool, not a wizard. But the UI should make the natural flow visible and easy to follow.

---

## Checkpoints

### CP0 — Project Scaffolding + Data Model + Cloud Diagram
**Target:** 1–2 hours

**Goal:** Working app shell with the EC data model, state management, and a static but well-rendered cloud diagram.

**Tasks:**
1. Initialize Vite + React + TypeScript project (mirror CRT Builder structure)
2. Define data model types (`ECCloud`, `ECAssumption`, `ECInjection`)
3. Implement state management (Context + useReducer) with actions: `createCloud`, `updateEntity`, `addAssumption`, `updateAssumption`, `removeAssumption`, `addInjection`, `updateInjection`, `removeInjection`, `setCloud`
4. Build the fixed cloud diagram component — purpose-built SVG or CSS layout showing the five entities, five arrows, and conflict line in the standard EC visual arrangement:
   ```
        [A - Objective]
        /             \
   [B - Req]        [C - Req]
      |                |
   [D - Prereq] ⚡ [D' - Prereq]
   ```
5. Entities display as boxes/cards; arrows as labeled connectors; conflict as a distinctive zigzag or lightning bolt line
6. Cloud diagram is responsive and centered — no canvas panning needed
7. Unit tests for reducer actions (target: 10–12 tests)

**Acceptance criteria:**
- App loads with empty cloud diagram showing all five entity slots
- Diagram renders the standard EC layout with clear visual hierarchy
- Reducer tests pass for all state operations
- TypeScript compiles clean

**Files likely created:**
- `src/types/ec.ts`
- `src/state/cloudStore.tsx`, `src/state/cloudStore.test.ts`
- `src/components/App.tsx`, `src/components/CloudDiagram.tsx`
- `src/styles/app.css`

---

### CP1 — Entity Definition (The "Define" Phase)
**Target:** 0.75–1.5 hours

**Goal:** Practitioner can fill in all five entities and the conflict statement, with guided prompts.

**Tasks:**
1. Build entity editing — click an entity box on the diagram to edit it inline or in a side panel
2. Each entity slot shows its role prompt:
   - A: "What is the common objective both sides share?"
   - B: "In order to achieve [A], we must..." (Requirement supporting D)
   - C: "In order to achieve [A], we must..." (Requirement supporting D')
   - D: "In order to have [B], we must..." (one side's position)
   - D': "In order to have [C], we must..." (the other side's position)
3. Conflict statement entry: "Why can't we have both [D] and [D']?"
4. Visual feedback: filled entities show content, empty ones show the guiding prompt
5. Reading direction indicators on arrows (e.g., "In order to... we must..." labels)
6. Cloud title input

**Acceptance criteria:**
- All five entities editable with contextual prompts
- Conflict statement editable
- Diagram updates in real-time as entities are filled in
- Arrow labels reflect the "In order to... we must..." reading direction
- Empty vs. filled states are visually distinct

**Files likely modified/created:**
- `src/components/CloudDiagram.tsx` (entity interaction)
- `src/components/EntityEditor.tsx` (inline or panel editing)

---

### CP2 — Assumption Surfacing (The "Surface" Phase)
**Target:** 1–1.5 hours

**Goal:** For each of the five arrows (including the conflict), the practitioner can list underlying assumptions.

**Tasks:**
1. Click an arrow/connection on the diagram to open its assumption panel
2. Assumption entry: textarea for adding new assumptions, one at a time
3. Each arrow shows an assumption count badge on the diagram
4. Assumption list per arrow with edit and delete
5. The conflict line (D↔D') is also selectable for assumptions
6. Visual indicator: arrows with zero assumptions are visually flagged (this is the core analytical work — the tool should encourage completeness)
7. Guided prompt per arrow type:
   - A←B / A←C: "Why do we believe [B/C] is necessary for [A]?"
   - B←D / C←D': "Why do we believe [D/D'] is the way to achieve [B/C]?"
   - D↔D': "Why do we believe [D] and [D'] cannot coexist?"

**Acceptance criteria:**
- Every arrow is selectable and opens an assumption panel
- Assumptions can be added, edited, and deleted per arrow
- Diagram shows assumption counts per arrow
- Arrows with no assumptions have a visual "needs attention" indicator
- At least 3 unit tests for assumption CRUD operations

---

### CP3 — Assumption Challenge + Injection (The "Challenge" and "Inject" Phases)
**Target:** 1–1.5 hours

**Goal:** Assumptions can be challenged (marked valid/invalid with notes), and injections can be proposed against invalid assumptions.

**Tasks:**
1. Each assumption gets a challenge workflow: mark as valid / invalid / unchallenged, with free-text notes explaining why
2. Visual states for assumptions: unchallenged (neutral), valid (confirmed), invalid (highlighted — this is where breakthroughs happen)
3. For invalid assumptions: "Add Injection" action to propose what would break this assumption
4. Injection fields: description, feasibility notes, sufficiency notes
5. Injection list with edit and delete
6. Diagram reflects challenge progress: arrows with all assumptions challenged show a "complete" indicator; arrows with invalid assumptions show a "breakthrough" indicator
7. Summary view: how many assumptions surfaced, challenged, found invalid; how many injections proposed

**Acceptance criteria:**
- Assumptions can be marked valid/invalid/unchallenged with notes
- Injections can be added against invalid assumptions
- Diagram visually reflects challenge progress
- Summary statistics are accurate
- At least 4 unit tests for challenge and injection operations

---

### CP4 — Persistence (Save/Load/Export)
**Target:** 0.75–1.5 hours

**Goal:** Full persistence and export, mirroring CRT Builder patterns.

**Tasks:**
1. localStorage auto-save with debounce (same pattern as CRT Builder)
2. Restore on app load
3. JSON file export/import with structural validation
4. Markdown export with full cloud content:
   - Cloud title and entities in reading-direction sentences
   - Assumptions grouped by arrow, with challenge status
   - Injections linked to their target assumptions
   - Summary statistics
5. "New Cloud" with confirmation dialog
6. File controls UI (New, Save, Load, Export JSON, Export MD)
7. Unit tests for persistence validation and markdown export (target: 8–10 tests)

**Acceptance criteria:**
- Auto-save works; reload restores full state
- JSON export produces importable file
- JSON import validates structure and rejects bad files
- Markdown export is readable and complete
- File controls accessible from all workflow phases

**Patterns to reference:** CRT Builder's `persistence.ts`, `exportJson.ts`, `importJson.ts`, `exportMarkdown.ts`

---

### CP5 — Review + Validation
**Target:** 0.75–1.5 hours

**Goal:** A review mode that presents the complete cloud analysis, with advisory validation checks.

**Tasks:**
1. Review panel/mode showing the complete cloud:
   - All entities and their relationships in sentence form
   - All assumptions grouped by arrow with challenge status
   - All injections with feasibility and sufficiency notes
   - Completeness indicators
2. Advisory validation checks:
   - Incomplete entities (any of the five still empty)
   - Arrows with no assumptions (analytical gap)
   - Unchallenged assumptions (work remaining)
   - Injections without feasibility or sufficiency notes
   - Conflict statement missing
3. Validation panel with grouped flags and completeness percentage
4. Print-friendly view or styling for the review mode

**Acceptance criteria:**
- Review mode displays complete cloud analysis
- Validation checks fire correctly for all flag types
- Completeness percentage is accurate
- At least 4 unit tests for validation logic

---

### CP6 — Polish + Testing
**Target:** 0.5–1 hour

**Goal:** Final integration testing, UX polish, and any deferred fixes.

**Tasks:**
1. End-to-end walkthrough: create cloud → define entities → surface assumptions → challenge → inject → review → export
2. Fix any interaction issues surfaced during walkthrough
3. Keyboard navigation where it matters (tab between entities, Escape to close panels)
4. Responsive check — usable on a laptop screen without horizontal scroll
5. Polish: consistent spacing, clear visual hierarchy, readable typography
6. Final TypeScript compile check
7. Commit

**Acceptance criteria:**
- Full workflow completable without errors
- All existing tests pass
- TypeScript compiles clean
- No obvious UX friction in the core workflow

---

## Estimated Source Structure

```
src/
  types/ec.ts                       # Data model
  state/cloudStore.tsx               # Context + useReducer
  state/cloudStore.test.ts           # Reducer tests
  components/
    App.tsx                          # Root
    CloudDiagram.tsx                 # Fixed-layout EC diagram (SVG or CSS)
    EntityEditor.tsx                 # Inline or panel entity editing
    ArrowDetail.tsx                  # Assumption panel for a selected arrow
    AssumptionCard.tsx               # Single assumption with challenge controls
    InjectionCard.tsx                # Single injection with feasibility/sufficiency
    ReviewPanel.tsx                  # Complete cloud analysis view
    ValidationPanel.tsx              # Advisory flags and completeness
    FileControls.tsx                 # New, Save, Load, Export
  utils/
    persistence.ts                   # localStorage + validation
    persistence.test.ts
    exportJson.ts                    # JSON download
    importJson.ts                    # JSON import + validation
    exportMarkdown.ts                # Cloud → Markdown
    exportMarkdown.test.ts
    validation.ts                    # Advisory checks
    validation.test.ts
  styles/app.css
```

**Estimated total:** ~20 source files, ~35 unit tests.

---

## Key Differences from CRT Builder

| Dimension | CRT Builder | EC Builder |
|-----------|-------------|------------|
| Topology | Arbitrary graph | Fixed 5-node structure |
| Canvas | ReactFlow + Dagre | Purpose-built SVG/CSS |
| Core interaction | Drag-to-connect | Click-to-edit, guided prompts |
| Depth per node | Label + type | Entity + assumptions + challenges + injections |
| Primary value | Construction | Analysis (assumption surfacing) |
| Dependencies | ReactFlow, Dagre, UUID | UUID only (beyond React) |
| Export complexity | Causal chains with junction notation | Structured analysis document |

---

## Risk Areas

1. **Diagram rendering** — Purpose-built SVG/CSS for the cloud layout is simpler than ReactFlow but untested in this project. CP0 should prove this out early. Fallback: use ReactFlow with fixed node positions if custom rendering proves too fiddly.

2. **Assumption UX** — The surfacing workflow needs to feel natural, not tedious. If clicking each arrow and typing assumptions feels like filling out a form, the tool fails its purpose. CP2 should prioritize flow over features.

3. **Scope creep into AI integration** — The EC is a natural candidate for AI-assisted assumption generation ("what assumptions might underlie this connection?"). This is explicitly **out of scope** for Phase 1. The tool should work well without AI; AI can be layered on in Phase 2 if warranted.

---

## Phase 1 Exclusions (Explicit)

- AI-assisted assumption generation or challenge suggestions
- Multiple clouds in a single session (one cloud at a time, like CRT)
- CRT → EC integration (selecting a conflict from a CRT to open as an EC)
- Collaboration or multi-user features
- Undo/redo
- Cloud templates or examples
- DOT/Mermaid/image export

---

*Plan drafted 2026-03-25. Follows checkpoint-driven methodology from TALM learnings.*
