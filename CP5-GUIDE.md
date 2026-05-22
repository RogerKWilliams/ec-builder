# CP5 — Review + Validation

**Goal:** A review mode presenting the complete cloud analysis with advisory validation checks and completeness tracking.

**Target:** 0.75–1.5 hours

---

## Tasks

1. Review panel/mode
   - Triggered by a "Review" button in the main layout
   - Displays the complete cloud analysis in a readable, linear format:
     - Cloud title
     - All five entities in reading-direction sentences ("In order to [A], we must [B]...")
     - Conflict statement
     - Assumptions grouped by arrow, each showing:
       - Assumption text
       - Challenge status (unchallenged / valid / invalid)
       - Challenge notes (if any)
       - Linked injections (if any) with feasibility and sufficiency notes
     - Injections summary: all injections listed with their target assumption context
   - Scrollable if content is long
   - Closeable — returns to the diagram/editing view

2. Advisory validation checks
   - Implement validation logic in `src/utils/validation.ts`:
     - **Incomplete entities:** Any of the five entity fields still empty
     - **Missing conflict statement:** Conflict description is empty
     - **Arrows with no assumptions:** Any of the five connections has zero assumptions
     - **Unchallenged assumptions:** Assumptions still in unchallenged state
     - **Injections without feasibility notes:** Injection has empty feasibility field
     - **Injections without sufficiency notes:** Injection has empty sufficiency field
   - Each check produces a flag with: severity (warning/info), message, and reference to the affected element

3. Validation display in review panel
   - Grouped flags by category
   - Completeness percentage: weighted or simple (e.g., entities defined + assumptions surfaced + assumptions challenged, each contributing a portion)
   - Flag count summary at the top
   - Individual flags clickable/linkable if feasible (clicking a flag about arrow A←B could highlight that section in the review)

4. Completeness indicators on the diagram
   - Optional: show an overall completeness indicator near the diagram (e.g., "Analysis: 65% complete")
   - This complements the per-arrow indicators from CP3

5. Unit tests for validation logic
   - Empty cloud: all flags fire
   - Complete cloud: no flags
   - Partial states: correct subset of flags
   - Completeness percentage calculation
   - Target: 4–5 tests minimum

---

## Acceptance Criteria

- [ ] Review mode displays complete cloud analysis in readable format
- [ ] All six validation check types fire correctly
- [ ] Validation flags are grouped and clearly presented
- [ ] Completeness percentage is calculated and displayed
- [ ] Review mode is openable and closeable without losing state
- [ ] Unit tests pass for all validation logic

---

## Files Modified/Created

- `src/components/ReviewPanel.tsx` — new: complete analysis view
- `src/utils/validation.ts` — new: validation check logic
- `src/utils/validation.test.ts` — new: validation tests
- `src/components/CloudDiagram.tsx` — optional: overall completeness indicator
- `src/styles/app.css` — review panel and validation flag styles

---

## Notes

- The review panel is a reading view, not an editing view. The practitioner reads through their analysis, sees what's complete and what's missing, then returns to the diagram to address gaps. Don't add inline editing to the review panel — that blurs the purpose.
- Completeness percentage is a convenience, not a goal to optimize. An 80% complete cloud where the practitioner made a deliberate choice to skip certain assumptions is better than a 100% cloud where everything was filled in perfunctorily. Frame it as "analysis coverage" rather than "score."
- The validation flags mirror the CRT Builder's advisory philosophy: surface issues, don't enforce. "Arrows with no assumptions" is a nudge, not a blocker.
- Keep the review panel's visual design clean and document-like. It should feel like reading a report, not navigating a dashboard.
