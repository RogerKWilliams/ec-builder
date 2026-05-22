# CP3 — Assumption Challenge + Injection

**Goal:** Assumptions can be challenged (marked valid/invalid with notes), and injections can be proposed against invalid assumptions.

**Target:** 1–1.5 hours

---

## Tasks

1. Add challenge controls to each assumption
   - Three-state toggle: Unchallenged (default) → Valid → Invalid
   - Challenge notes textarea: "Why is this assumption valid/invalid?"
   - Notes field appears when status changes from Unchallenged
   - Visual states:
     - Unchallenged: neutral/muted styling
     - Valid: confirmed styling (subtle green or checkmark)
     - Invalid: highlighted styling (amber/orange — this is where breakthroughs live)

2. Injection creation from invalid assumptions
   - Invalid assumptions show an "Add Injection" button
   - Injection fields:
     - Text (required): "What action or condition would break this assumption?"
     - Feasibility notes (optional): "Can we actually do this?"
     - Sufficiency notes (optional): "Does this fully resolve the conflict?"
   - Valid and unchallenged assumptions do not show the injection button
   - An assumption can have multiple injections

3. Injection display and management
   - Injections listed under their parent assumption
   - Each injection shows all three fields, editable inline
   - Delete action per injection
   - Visual connection: injection is clearly nested under its assumption

4. Diagram progress indicators
   - Arrows reflect challenge progress:
     - All assumptions challenged (all valid or invalid): "complete" indicator (e.g., checkmark)
     - At least one invalid assumption: "breakthrough" indicator (e.g., star or highlight)
     - Mix of challenged and unchallenged: partial progress (e.g., half-filled badge)
   - These replace or augment the count badges from CP2

5. Summary statistics
   - Display somewhere accessible (bottom of assumption panel, or a dedicated summary area):
     - Total assumptions surfaced
     - Challenged vs. unchallenged count
     - Valid vs. invalid count
     - Total injections proposed
   - Keep it compact — this is reference info, not the focus

6. Unit tests for challenge and injection operations
   - Update assumption challenge status and notes
   - Add injection to an assumption
   - Update injection fields
   - Remove injection
   - Target: 4–5 tests minimum

---

## Acceptance Criteria

- [ ] Each assumption has a three-state challenge toggle (unchallenged/valid/invalid)
- [ ] Challenge notes are editable when status is valid or invalid
- [ ] Invalid assumptions show "Add Injection" action
- [ ] Injections can be added, edited, and deleted
- [ ] Injections are visually nested under their parent assumption
- [ ] Diagram arrows reflect challenge progress
- [ ] Summary statistics are accurate
- [ ] Unit tests pass for challenge and injection operations

---

## Files Modified/Created

- `src/components/AssumptionCard.tsx` — add challenge controls, injection trigger
- `src/components/InjectionCard.tsx` — new: injection display with feasibility/sufficiency fields
- `src/components/ArrowDetail.tsx` — summary statistics
- `src/components/CloudDiagram.tsx` — progress indicators on arrows

---

## Patterns to Reference

- CRT Builder's `ValidationPanel.tsx` for advisory indicator styling
- State updates: `UPDATE_ASSUMPTION` for challenge status/notes, `ADD_INJECTION` / `UPDATE_INJECTION` / `REMOVE_INJECTION` for injections

---

## Notes

- The invalid-assumption-to-injection flow is the tool's highest-value interaction. It should feel like a natural next step: "This assumption doesn't hold — so what would we do about it?" Make the "Add Injection" button prominent on invalid assumptions.
- Don't over-design the diagram progress indicators. A simple color change or small icon on the arrow badge is enough. The detail lives in the assumption panel, not on the diagram.
- Feasibility and sufficiency notes on injections are optional by design. A practitioner in early analysis may just capture the injection idea and evaluate feasibility later. Don't make empty optional fields feel like incomplete work.
