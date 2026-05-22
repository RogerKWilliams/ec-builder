# CP2 — Assumption Surfacing (The "Surface" Phase)

**Goal:** For each of the five arrows (including the conflict line), the practitioner can list underlying assumptions.

**Target:** 1–1.5 hours

---

## Tasks

1. Make arrows/connections selectable
   - Click an arrow or the conflict line to select it
   - Selected connection opens an assumption panel (side panel or expandable section below diagram)
   - Panel header shows which connection is selected (e.g., "Assumptions: Why [B] is necessary for [A]")
   - Only one connection's panel is open at a time

2. Assumption entry
   - Textarea for adding a new assumption
   - Submit on Ctrl+Enter or button click
   - Clear input after successful add
   - New assumptions default to: `challenged: false`, `valid: null`, `challengeNotes: ""`

3. Assumption list per arrow
   - Display all assumptions for the selected connection
   - Each assumption shows its text, editable inline or via expand
   - Edit and delete actions per assumption
   - Assumptions ordered by creation time

4. Assumption count badges on diagram
   - Each arrow shows a small count badge (e.g., "3" in a circle)
   - Conflict line also shows its count
   - Badge styling: visible but not dominant

5. "Needs attention" indicators for arrows with zero assumptions
   - Arrows with no assumptions get a visual flag (e.g., dashed line, warning color, or small icon)
   - This is the core nudge — every arrow should have at least one assumption surfaced
   - Once at least one assumption exists, the flag clears

6. Contextual prompts per arrow type
   - A←B: "Why do we believe [B] is necessary for [A]?"
   - A←C: "Why do we believe [C] is necessary for [A]?"
   - B←D: "Why do we believe [D] is the way to achieve [B]?"
   - C←D': "Why do we believe [D'] is the way to achieve [C]?"
   - D↔D': "Why do we believe [D] and [D'] cannot coexist?"
   - Prompts use actual entity text when filled, role labels when empty

7. Unit tests for assumption operations
   - Add assumption to a specific arrow
   - Update assumption text
   - Remove assumption (verify it's gone, others unaffected)
   - Target: 3–4 tests minimum

---

## Acceptance Criteria

- [ ] Every arrow and the conflict line are selectable
- [ ] Clicking a connection opens its assumption panel with contextual prompt
- [ ] Assumptions can be added, edited, and deleted per connection
- [ ] Diagram shows assumption count badges on each arrow
- [ ] Arrows with zero assumptions have a "needs attention" visual indicator
- [ ] Indicator clears once at least one assumption is added
- [ ] Unit tests pass for assumption CRUD

---

## Files Modified/Created

- `src/components/CloudDiagram.tsx` — arrow click handlers, count badges, needs-attention styling
- `src/components/ArrowDetail.tsx` — new: assumption panel for a selected connection
- `src/components/AssumptionCard.tsx` — new: single assumption display with edit/delete
- `src/styles/app.css` — badge, panel, indicator styles

---

## Notes

- The assumption panel is where practitioners will spend most of their analytical time. It needs to feel spacious and focused, not cramped.
- Resist the temptation to add challenge/validity controls here — that's CP3. This checkpoint is purely about surfacing assumptions. Keep the assumption card simple: text + edit + delete.
- The "needs attention" indicator is advisory, not blocking. A practitioner might intentionally leave an arrow without assumptions if the connection is self-evident. The tool surfaces the gap; the practitioner decides.
- Consider whether the diagram should dim/fade non-selected arrows when one is active, to focus attention on the selected connection.
