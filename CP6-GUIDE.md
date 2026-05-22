# CP6 — Polish + Testing

**Goal:** Final integration testing, UX polish, and any fixes surfaced during end-to-end walkthrough.

**Target:** 0.5–1 hour

---

## Tasks

1. End-to-end walkthrough
   - Complete the full workflow with a realistic conflict:
     - Create cloud with title
     - Define all five entities and conflict statement
     - Surface 2–3 assumptions per arrow (at least some arrows)
     - Challenge assumptions — mark some valid, some invalid
     - Add injections for invalid assumptions
     - Open review panel — verify all content is present and accurate
     - Export JSON — re-import — verify round-trip fidelity
     - Export Markdown — verify readability and completeness
     - New Cloud — verify clean reset
   - Note any interaction friction, visual issues, or bugs

2. Fix issues from walkthrough
   - Prioritize: blocking bugs > confusing interactions > visual polish
   - Track what was fixed for the completion report

3. Keyboard navigation
   - Tab between entity boxes on the diagram (if feasible with SVG)
   - Escape to close any open panel (entity editor, assumption panel, review)
   - Ctrl+S to save (already in CP4 — verify it works)
   - Enter/Ctrl+Enter for form submissions (verify consistency)

4. Responsive check
   - Usable on a standard laptop screen (1366x768 minimum)
   - No horizontal scroll on the main layout
   - Assumption panel doesn't push diagram off screen
   - Review panel is scrollable if content overflows

5. Visual polish
   - Consistent spacing between components
   - Clear visual hierarchy: diagram is primary, panels are secondary
   - Typography: readable font sizes, adequate contrast
   - Hover states on interactive elements (entity boxes, arrows, buttons)
   - Loading/empty states don't look broken

6. Final checks
   - All unit tests pass: `npx vitest run`
   - TypeScript compiles clean: `npx tsc -b --noEmit`
   - No console errors in the browser during walkthrough
   - Dev server starts cleanly

7. Commit

---

## Acceptance Criteria

- [ ] Full workflow completable end-to-end without errors
- [ ] JSON export → import round-trip preserves all data
- [ ] Markdown export is readable and complete
- [ ] All existing unit tests pass
- [ ] TypeScript compiles clean
- [ ] No console errors during walkthrough
- [ ] Usable on a laptop screen without horizontal scroll

---

## Files Modified

- Any files where issues are found during walkthrough
- `src/styles/app.css` — polish adjustments

---

## Notes

- This checkpoint should be mostly verification, not new feature work. If the walkthrough surfaces a significant issue that would take more than 30 minutes to fix, note it as a known issue for Phase 2 rather than expanding this checkpoint's scope.
- Use a realistic example conflict for the walkthrough — something you can evaluate for domain correctness, not just technical correctness. A real TOC evaporating cloud will test whether the guided prompts and workflow feel natural.
- Write the completion report during or immediately after this checkpoint while the experience is fresh. Capture: bugs found and fixed, known issues deferred, total test count, any design decisions made during polish.
