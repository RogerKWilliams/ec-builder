# CP3 Work Log — Assumption Challenge + Injection

## What was built

### Challenge controls on assumptions (`ArrowDetail.tsx`)
- Extended `AssumptionItem` with a three-state challenge toggle button:
  - Unchallenged (default): em-dash icon, neutral styling
  - Valid: checkmark icon, green left border
  - Invalid: cross icon, amber left border + amber background
- Clicking the toggle cycles: unchallenged → valid → invalid → unchallenged (resets challenge notes on return to unchallenged)
- Challenge notes textarea appears when status is valid or invalid, with context-appropriate placeholder ("Why is this assumption valid/invalid?")
- `onUpdate` signature changed from `(id, text)` to `(id, updates)` to support partial updates of `challenged`, `valid`, `challengeNotes`, and `text` fields

### Injection creation and management (`InjectionCard.tsx`, `ArrowDetail.tsx`)
- Invalid assumptions show a dedicated injection section with:
  - "Add Injection" input + button with placeholder "What would break this assumption?"
  - Enter key submits, button disables when empty
- `InjectionCard` component displays each injection with:
  - Header with "INJECTION" label + Edit/Delete buttons
  - Inline-editable injection text (same blur/Enter/Escape pattern as assumptions)
  - Feasibility notes textarea (optional): "Can we actually do this?"
  - Sufficiency notes textarea (optional): "Does this fully resolve the conflict?"
- Injections are visually nested under their parent assumption via a left border connector (`border-left: 2px solid amber`)
- Valid and unchallenged assumptions do not show the injection section

### Diagram progress indicators (`CloudDiagram.tsx`)
- Replaced simple count badges with progress-aware badges derived from assumption challenge state:
  - **Empty** (no assumptions): amber circle with "!" — unchanged from CP2
  - **Unchallenged** (has assumptions, none challenged): gray circle with count — unchanged from CP2
  - **Partial** (some challenged, some not): blue circle with count
  - **Complete** (all challenged, all valid): green circle with checkmark
  - **Breakthrough** (at least one invalid): amber/orange circle with star — signals breakthrough opportunity
- Progress state computed by `getArrowProgress()` which reads assumption `challenged` and `valid` flags
- `assumptionCounts` replaced with `assumptionsByArrow` (grouped arrays) to support both count and progress computation
- `AssumptionBadge` interface changed: `needsAttention: boolean` → `progress: ArrowProgress`

### Summary statistics (`ArrowDetail.tsx`)
- Compact stats row at the bottom of the assumption panel (only shown when assumptions exist):
  - Total assumptions · N challenged · N valid · N invalid · N injections
  - Valid count in green, invalid count in amber, injection count in bold amber
  - Dot separators between items
- Stats are per-arrow, computed from the filtered assumptions and their linked injections

### CSS additions (`app.css`)
- New CSS variables: `--valid-color`, `--valid-bg`, `--invalid-color`, `--invalid-bg`, `--injection-border`, `--injection-bg`, `--badge-complete-bg/text`, `--badge-breakthrough-bg/text`, `--badge-partial-bg/text`
- Challenge status button styles (`.assumption-status-btn-*`): pill-shaped with status-appropriate colors
- Assumption item border states (`.assumption-status-valid`, `.assumption-status-invalid`): colored left border
- Challenge notes textarea styling
- Injection section: left border connector, card with header/text/notes, add input/button
- Summary statistics row with colored spans
- Progress badge variants: `.ec-badge-complete`, `.ec-badge-breakthrough`, `.ec-badge-partial`

### Unit tests (`ArrowDetail.test.ts`)
- 5 new tests covering CP3 operations:
  1. Challenge status cycling (unchallenged → valid → invalid → unchallenged with reset)
  2. Challenge notes persistence on an assumption
  3. Adding an injection to an invalid assumption
  4. Updating injection feasibility and sufficiency notes
  5. Removing an injection without affecting the parent assumption

## Files modified/created

- `src/components/ArrowDetail.tsx` — extended `AssumptionItem` with challenge controls, injection section, summary stats; changed `onUpdate` signature
- `src/components/InjectionCard.tsx` — **new**: injection display with inline editing and notes fields
- `src/components/CloudDiagram.tsx` — progress-aware badges, `getArrowProgress()`, `assumptionsByArrow` grouping
- `src/styles/app.css` — new CSS variables + styles for challenge states, injections, progress badges, summary stats
- `src/components/ArrowDetail.test.ts` — 5 new CP3 tests

## Key design decisions

- **Single-button cycle over dropdown or radio**: Keeps the UI compact. The three states are a natural progression in TOC practice — you surface, then validate or invalidate. Cycling back to unchallenged clears notes, acting as a "reset" for rethinking.
- **Injections gated behind invalid status**: The spec emphasizes this is the tool's highest-value interaction. Showing injection UI only when an assumption is marked invalid guides the practitioner through the intended flow: "this doesn't hold — so what do we do?"
- **Progress derived from data, not stored**: `getArrowProgress()` reads existing `challenged`/`valid` fields rather than adding a separate progress field. This avoids state synchronization issues.
- **Badge breakthrough = has any invalid**: Even if some assumptions are still unchallenged, finding an invalid one is the key signal. The star badge draws attention to where breakthroughs live.

## State of the codebase
- TypeScript compiles clean (`tsc -b --noEmit` — zero errors)
- All 22 unit tests pass (17 from CP0–CP2 + 5 new CP3 tests)
- No regressions in existing functionality
