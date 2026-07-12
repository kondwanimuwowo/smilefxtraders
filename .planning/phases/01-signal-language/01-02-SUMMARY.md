---
phase: 01-signal-language
plan: 02
subsystem: ui
tags: [react, tailwind, cot]

requires:
  - phase: 01-signal-language
    provides: "SignalBars standalone SVG component"
provides:
  - "Single merged pill row (pair + SignalBars + cotIndex) replacing summary strip and filter tabs"
affects: [card-de-noise, mobile]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified:
    - src/app/(app)/cot/CotReports.tsx

key-decisions:
  - "cotIndex kept as a muted trailing value on each per-pair pill, preserving the information density the old summary strip provided"
  - "SIGNAL_CFG import removed from CotReports.tsx — no longer referenced after SummaryStrip deletion"

patterns-established: []

requirements-completed: [PAGE-01]

coverage:
  - id: D1
    description: "Summary pill strip and pair filter tabs replaced by one merged, tappable pill row (SignalBars icon + pair + cotIndex, All affordance)"
    requirement: "PAGE-01"
    verification:
      - kind: other
        ref: "npm run type-check && npm run lint && npm run build"
        status: pass
    human_judgment: true
    rationale: "Filter interaction and visual selected-state clarity require a human to click through /cot"

duration: ~15min
completed: 2026-07-12
status: complete
---

# Phase 1 Plan 02: Merged Pill Row Summary

**Summary strip and pair filter tabs collapsed into one tappable pill row reusing existing filter state**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-07-12
- **Tasks:** 2 completed (landed in one commit — coherent single edit)
- **Files modified:** 1

## Accomplishments
- `SummaryStrip` function and its render call deleted
- The separate pair-filter-tab block deleted
- One merged pill row renders `pairs` (`["All", ...entries]`); non-"All" pills show `SignalBars` + pair name + `cotIndex`; "All" is text-only
- Selected-state styling (`bg-teal text-white` selected / `bg-panel-2 text-ink-dim border border-line` unselected) preserved from the old filter tabs
- Reused existing `selected`/`setSelected`/`visible` state — no new state introduced
- Removed the now-unused `SIGNAL_CFG` import

## Task Commits

1. **Task 1 + Task 2 combined: merged pill row + SummaryStrip removal** - `e509feb` (feat)

## Files Created/Modified
- `src/app/(app)/cot/CotReports.tsx` - merged pill row replaces summary strip + filter tabs; dead `SummaryStrip` function removed; unused `SIGNAL_CFG` import removed

## Decisions Made
- Kept `cotIndex` in the per-pair pills (Claude's Discretion item in CONTEXT.md) rather than dropping it, to preserve information density
- Combined both plan tasks into a single commit since building the pill row and deleting its now-dead predecessor were one inseparable edit to the same block

## Deviations from Plan
None — plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
Phase 1 (Signal Language) is complete: all 5 requirements (SIG-01–04, PAGE-01) shipped. `/cot` now speaks one signal language — icon-only cards, a color key, and one merged pill row. Ready for Phase 2 (Card De-noise & Mobile).

---
*Phase: 01-signal-language*
*Completed: 2026-07-12*
