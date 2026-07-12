---
phase: 01-signal-language
plan: 01
subsystem: ui
tags: [react, tailwind, svg, cot]

requires: []
provides:
  - "SignalBars standalone SVG component (src/components/cot/SignalBars.tsx)"
  - "SignalCfg.barCount field on signalCfg.ts"
  - "Icon-only signal on COT overview cards"
  - "4-entry color key above COT overview cards"
affects: [signal-language, card-de-noise, detail-page]

tech-stack:
  added: []
  patterns:
    - "Standalone domain SVG components live in components/cot/, not the ICON_REGISTRY"
    - "SVG fill uses raw var(--x) strings from SIGNAL_CFG.strokeColor, not Tailwind text classNames"

key-files:
  created:
    - src/components/cot/SignalBars.tsx
  modified:
    - src/components/cot/signalCfg.ts
    - src/app/(app)/cot/CotReports.tsx

key-decisions:
  - "barCount added as a strictly additive field to the existing SignalCfg interface — 7 consumers across 5 files unaffected"
  - "Color key strong variants shown only as brighter color on the 3 base swatches, not as separate key rows, per locked CONTEXT.md decision"

patterns-established:
  - "SignalBars: 3-bar SVG icon resolving barCount + strokeColor from SIGNAL_CFG — reusable wherever a compact signal indicator is needed"

requirements-completed: [SIG-01, SIG-02, SIG-03, SIG-04]

coverage:
  - id: D1
    description: "COT overview cards show an icon-only 3-bar SignalBars icon instead of the text signal badge"
    requirement: "SIG-01"
    verification:
      - kind: other
        ref: "npm run type-check && npm run lint"
        status: pass
    human_judgment: true
    rationale: "Visual correctness (bar count/color per signal level) requires a human to view /cot"
  - id: D2
    description: "4-entry color key (Bearish/Neutral/Bullish + USD-base-inverted) renders above the cards"
    requirement: "SIG-03"
    verification:
      - kind: other
        ref: "npm run type-check && npm run lint"
        status: pass
    human_judgment: true
    rationale: "Visual placement and wrapping behavior require a human to view /cot"

duration: ~25min
completed: 2026-07-12
status: complete
---

# Phase 1 Plan 01: SignalBars Icon + Color Key Summary

**Standalone SignalBars SVG component driven by signalCfg.ts, swapped into COT cards, plus a 4-entry color key above the cards**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-07-12
- **Tasks:** 2 completed
- **Files modified:** 3 (1 new)

## Accomplishments
- `SignalCfg` interface extended with `barCount: 1 | 2 | 3`, populated per the locked brightness-variant mapping (strong_bull/bull=3, neutral=2, bear/strong_bear=1) — purely additive, no existing field touched
- New `SignalBars.tsx` standalone SVG component (not an ICON_REGISTRY entry) resolves bar count and color directly from `SIGNAL_CFG`
- COT overview cards render `SignalBars` in place of the old text signal badge — icon-only, no text label
- 4-entry color key (Bearish / Neutral·Mixed / Bullish SignalBars swatches + `swap_horiz` USD-base-inverted explainer) renders above the cards, reusing the existing `swap_horiz` icon already used on the detail page

## Task Commits

1. **Task 1: barCount + SignalBars + card swap** - `ebf8cd5` (feat)
2. **Task 2: color key** - `f7bca13` (feat)

## Files Created/Modified
- `src/components/cot/SignalBars.tsx` - new standalone 3-bar SVG signal icon
- `src/components/cot/signalCfg.ts` - added `barCount` field to `SignalCfg` and all 5 entries
- `src/app/(app)/cot/CotReports.tsx` - card signal badge swapped for SignalBars; color key added above cards

## Decisions Made
None beyond what CONTEXT.md already locked — followed the plan as specified.

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
An earlier executor run stalled mid-task waiting on a background `npm run lint` call and returned without a completion marker. Work already on disk (Task 1 commit `ebf8cd5`, Task 2 uncommitted) was verified inline (`npm run type-check`, `npm run lint`, both clean) and Task 2 was committed under a corrected message (`f7bca13`, originally misworded during recovery then amended). No code was redone; only the recovery/commit bookkeeping was handled manually.

## Next Phase Readiness
Plan 01-02 (merged pill row) can proceed — it depends on `SignalBars`, which is now exported and stable.

---
*Phase: 01-signal-language*
*Completed: 2026-07-12*
