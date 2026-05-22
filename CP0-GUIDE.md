# CP0 — Project Scaffolding + Data Model + Cloud Diagram

**Goal:** Working app shell with the EC data model, state management, and a static but well-rendered cloud diagram.

**Target:** 1–2 hours

---

## Tasks

1. Initialize Vite + React + TypeScript project
   - `npm create vite@latest ec-builder -- --template react-ts`
   - Enable strict mode in `tsconfig.json`
   - Verify dev server runs clean

2. Define data model in `src/types/ec.ts`
   - `ECCloud`: id, title, createdAt, updatedAt, objective, requirementB, requirementC, prerequisiteD, prerequisiteDPrime, conflict (ConflictStatement), assumptions (ECAssumption[]), injections (ECInjection[])
   - `ArrowId`: `'A-B' | 'A-C' | 'B-D' | 'C-Dp' | 'D-Dp'`
   - `ECAssumption`: id, arrowId, text, challenged, valid (boolean | null), challengeNotes
   - `ECInjection`: id, targetAssumptionId, text, feasibilityNotes, sufficiencyNotes
   - `ConflictStatement`: description

3. Implement state management in `src/state/cloudStore.tsx`
   - Context + useReducer pattern (same approach as CRT Builder)
   - Actions: `CREATE_CLOUD`, `UPDATE_ENTITY`, `ADD_ASSUMPTION`, `UPDATE_ASSUMPTION`, `REMOVE_ASSUMPTION`, `ADD_INJECTION`, `UPDATE_INJECTION`, `REMOVE_INJECTION`, `SET_CLOUD`
   - `UPDATE_ENTITY` handles all five entities + conflict via a field discriminator
   - Provider component wrapping App

4. Build cloud diagram in `src/components/CloudDiagram.tsx`
   - Purpose-built SVG (not ReactFlow) — the topology is fixed
   - Standard EC layout:
     ```
           [A - Objective]
           /             \
      [B - Req]        [C - Req]
         |                |
      [D - Prereq] ⚡ [D' - Prereq]
     ```
   - Five entity boxes with role labels (Objective, Requirement, Prerequisite)
   - Five arrows (A←B, A←C, B←D, C←D') as directed lines/paths
   - Conflict line (D↔D') as visually distinct zigzag or lightning bolt
   - Responsive sizing — centered, fits a laptop viewport without scrolling
   - Empty state: boxes show role labels, no content yet

5. Wire up root App component
   - CloudStore provider → App → CloudDiagram
   - Basic page structure: title bar + diagram area

6. Write reducer unit tests in `src/state/cloudStore.test.ts`
   - Install Vitest: `npm install -D vitest`
   - Target: 10–12 tests covering all reducer actions
   - Test: create cloud, update each entity type, add/update/remove assumption, add/update/remove injection, set cloud (full replace)

7. Basic styling in `src/styles/app.css`
   - Clean defaults, readable typography
   - Entity box styles (border, padding, role label)
   - Arrow/line styles
   - Conflict line distinct from regular arrows

---

## Acceptance Criteria

- [ ] App loads and renders the five-entity cloud diagram
- [ ] Diagram shows all five entity slots with role labels
- [ ] Five arrows and one conflict line are visible with correct topology
- [ ] Diagram is centered and fits viewport without horizontal scroll
- [ ] All reducer tests pass (10+)
- [ ] TypeScript compiles clean (`npx tsc -b --noEmit`)

---

## Files Created

```
src/
  types/ec.ts
  state/cloudStore.tsx
  state/cloudStore.test.ts
  components/App.tsx
  components/CloudDiagram.tsx
  styles/app.css
```

---

## Notes

- No interaction yet — diagram is view-only in this checkpoint
- SVG is the recommended rendering approach; if it proves too fiddly for responsive text wrapping, CSS grid/flexbox with positioned connectors is the fallback
- Keep the SVG viewBox proportions reasonable (~800x500 or similar) — the cloud is wider than it is tall
- UUID library needed for IDs: `npm install uuid && npm install -D @types/uuid`
