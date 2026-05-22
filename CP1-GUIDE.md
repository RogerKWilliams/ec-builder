# CP1 — Entity Definition (The "Define" Phase)

**Goal:** Practitioner can fill in all five entities and the conflict statement with guided contextual prompts.

**Target:** 0.75–1.5 hours

---

## Tasks

1. Make entity boxes interactive
   - Click an entity box on the diagram to select it
   - Selected entity opens an editing interface (inline overlay or side panel — choose whichever feels more natural during implementation)
   - Escape or click-away to deselect

2. Entity editing with contextual prompts
   - Each entity slot shows a role-specific guiding prompt when empty:
     - A (Objective): "What is the common objective both sides share?"
     - B (Requirement): "In order to achieve [A], we must..."
     - C (Requirement): "In order to achieve [A], we must..."
     - D (Prerequisite): "In order to have [B], we must..."
     - D' (Prerequisite): "In order to have [C], we must..."
   - Prompts dynamically reference other filled entities (e.g., once A is filled, B's prompt reads "In order to achieve [actual A text], we must...")
   - Textarea input — entities can be multi-sentence
   - Save on blur or Enter; Escape cancels

3. Conflict statement editing
   - Conflict line (D↔D') is also clickable
   - Prompt: "Why can't we have both [D] and [D']?"
   - Same edit interaction as entity boxes

4. Cloud title input
   - Text input at the top of the page
   - Placeholder: "Name this conflict..."

5. Visual feedback for filled vs. empty states
   - Empty entities: muted styling, guiding prompt visible
   - Filled entities: full styling, content displayed (truncated if long, full text on hover or in editor)
   - Partially complete cloud: visual progress indication (e.g., "3 of 5 entities defined")

6. Arrow reading-direction labels
   - Each arrow shows the logical reading direction on or near the line
   - A←B: "In order to... we must..."
   - These labels are subtle (small text, muted color) — informational, not dominant

---

## Acceptance Criteria

- [ ] All five entities are editable by clicking on the diagram
- [ ] Conflict statement is editable by clicking the conflict line
- [ ] Empty entities show contextual guiding prompts
- [ ] Prompts dynamically reference other filled entities
- [ ] Diagram updates in real-time as entities are filled in
- [ ] Filled vs. empty states are visually distinct
- [ ] Cloud title is editable
- [ ] Arrow reading-direction labels are visible

---

## Files Modified/Created

- `src/components/CloudDiagram.tsx` — add click handlers, selection state
- `src/components/EntityEditor.tsx` — new: editing interface for entities
- `src/styles/app.css` — filled/empty states, editor styling

---

## Patterns to Reference

- CRT Builder's `CRTNodeComponent.tsx` for inline editing interaction (double-click to edit, though here we use single-click)
- State updates via `UPDATE_ENTITY` action dispatched from editor

---

## Notes

- The entity editing interaction is the most important UX decision in this checkpoint. If inline editing on the SVG diagram feels cramped, a side panel is fine — the key is that clicking the diagram element is the entry point.
- Keep the guiding prompts concise. They're scaffolding for the practitioner's thinking, not instructions.
- The recommended construction order for practitioners is A → B → C → D → D' → Conflict, but the tool should not enforce this. Any entity can be edited at any time.
