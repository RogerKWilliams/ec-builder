# CP4 — Persistence (Save/Load/Export)

**Goal:** Full persistence and export matching CRT Builder patterns — auto-save, JSON import/export, Markdown export.

**Target:** 0.75–1.5 hours

---

## Tasks

1. localStorage auto-save
   - Debounced write (2-second delay) on any state change
   - Storage key: `ec-builder-cloud`
   - Restore on app load — if saved cloud exists, load it directly

2. JSON file export
   - Download full `ECCloud` object as `.json` file
   - Filename: `{cloud-title}-{date}.json` (slugified title) or `ec-cloud-{date}.json` if untitled

3. JSON file import with structural validation
   - File picker for `.json` files
   - Validate structure before loading:
     - Required top-level fields: id, objective, requirementB, requirementC, prerequisiteD, prerequisiteDPrime, conflict, assumptions, injections
     - Assumptions array: each item has id, arrowId (valid ArrowId), text
     - Injections array: each item has id, targetAssumptionId, text
   - Reject invalid files with clear error message
   - Valid files replace current state (with confirmation if current cloud has content)

4. Markdown export
   - Structured document with sections:
     ```
     # [Cloud Title]

     ## The Conflict

     **Objective (A):** [text]

     **Requirement B:** In order to [A], we must [B]
     **Prerequisite D:** In order to [B], we must [D]

     **Requirement C:** In order to [A], we must [C]
     **Prerequisite D':** In order to [C], we must [D']

     **Conflict:** [D] and [D'] cannot coexist because: [conflict description]

     ## Assumptions

     ### A ← B: Why [B] is necessary for [A]
     1. [assumption text] — **Valid** / **Invalid** / *Unchallenged*
        - Notes: [challenge notes]
        - 💡 Injection: [injection text]
          - Feasibility: [notes]
          - Sufficiency: [notes]

     [repeat for each arrow]

     ## Injections Summary
     [list all injections with their target assumptions]

     ## Analysis Status
     - Entities defined: X/5
     - Assumptions surfaced: N
     - Assumptions challenged: N/N
     - Invalid assumptions found: N
     - Injections proposed: N
     ```
   - Download as `.md` file

5. "New Cloud" action
   - Clears all state to empty cloud
   - Confirmation dialog if current cloud has any content (use `window.confirm()` for now)

6. File controls UI
   - Buttons: New, Save (manual trigger), Load, Export JSON, Export MD
   - Last-saved timestamp display
   - Accessible from the main layout (top bar or toolbar)
   - Ctrl+S keyboard shortcut for immediate save

7. Unit tests
   - Persistence validation: valid cloud accepted, missing fields rejected, bad assumptions rejected, bad injections rejected, null/string input rejected
   - Markdown export: title + entities, assumptions with status, injections under assumptions, empty sections handled
   - Target: 8–10 tests

---

## Acceptance Criteria

- [ ] Auto-save fires on state changes; reload restores full cloud state
- [ ] JSON export produces a downloadable file with complete cloud data
- [ ] JSON import validates structure and rejects malformed files
- [ ] Markdown export is readable and includes all cloud content with analysis status
- [ ] "New Cloud" clears state with confirmation
- [ ] File controls are accessible from the main layout
- [ ] Ctrl+S triggers immediate save
- [ ] Last-saved timestamp is displayed and updates
- [ ] All unit tests pass (8+)

---

## Files Modified/Created

- `src/utils/persistence.ts` — new: localStorage read/write, debounce, validation
- `src/utils/persistence.test.ts` — new: validation tests
- `src/utils/exportJson.ts` — new: JSON download
- `src/utils/importJson.ts` — new: JSON import + validation
- `src/utils/exportMarkdown.ts` — new: cloud → Markdown
- `src/utils/exportMarkdown.test.ts` — new: markdown tests
- `src/components/FileControls.tsx` — new: file action buttons + timestamp
- `src/components/App.tsx` or `src/components/Layout.tsx` — wire file controls

---

## Patterns to Reference

- CRT Builder's `persistence.ts` — same debounce and validation approach
- CRT Builder's `exportJson.ts`, `importJson.ts` — same file download/upload pattern
- CRT Builder's `exportMarkdown.ts` — similar structure, different content

---

## Notes

- The Markdown export is the most important export format for the EC. A well-structured Markdown document of a completed cloud analysis is immediately useful — it can be shared, pasted into a report, or used as input for a follow-up discussion. Invest care in making the reading-direction sentences natural.
- Validation should be strict enough to catch corrupted files but not so strict it rejects clouds from older versions if the format evolves. Validate required fields exist and have correct types; don't validate content (empty strings are fine).
- The CRT Builder uses the same JSON format for save and export. Follow this pattern — no separate serialization.
