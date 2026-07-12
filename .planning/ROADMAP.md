# Roadmap: COT Tool Refinement

## Overview

Three sequential phases, each leaving `/cot` visibly better. First the new signal language lands (SignalBars icon system, color key, merged pill row) so the page speaks one visual dialect. Then the cards get de-noised and made mobile-clean, with the elevation pass. Finally the detail page is brought into line and the education layer is collapsed into one lean teach surface.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Signal Language** - SignalBars icon system, color key, and merged pill row on `/cot`
- [ ] **Phase 2: Card De-noise & Mobile** - Minified cards, fixed rounding, stacked mobile layout, elevation pass
- [ ] **Phase 3: Detail Page & Education** - `/cot/[pair]` consistency pass and unified teach-layer

## Phase Details

### Phase 1: Signal Language

**Goal**: The COT overview speaks one visual signal language — a custom 3-bar icon replaces text badges, a key explains it, and one pill row summarizes and filters
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: [SIG-01, SIG-02, SIG-03, SIG-04, PAGE-01]
**UI hint**: yes
**Success Criteria** (what must be TRUE):

  1. Each COT card shows an icon-only 3-bar signal colored by the brightness-variant mapping (strong_bear ▮▯▯ coral-bright → strong_bull ▮▮▮ teal-bright), driven from `signalCfg.ts`
  2. A 3-entry color key (Bearish / Neutral / Bullish) plus a USD-base-inverted entry renders above the cards
  3. One pill row shows each pair with its SignalBars icon and filters the cards on tap; the old summary strip and filter tabs are gone

**Plans**: 2 plans

Plans:
**Wave 1**

- [ ] 01-01-PLAN.md — SignalBars SVG component + signalCfg barCount mapping + icon-only card signal + color key

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 01-02-PLAN.md — Merge summary strip and filter tabs into one interactive pill row

### Phase 2: Card De-noise & Mobile

**Goal**: Cards read at a glance on any device — commentary gone, badges minified, rounding fixed, layout stacks on phones, elevation applied
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: [CARD-01, CARD-02, CARD-03, CARD-04, CARD-05, CARD-06, MOB-01, MOB-02, PAGE-02]
**UI hint**: yes
**Success Criteria** (what must be TRUE):

  1. Overview cards show no commentary panel; commentary still renders on the detail page
  2. The pair appears once per card; history and inverted badges are icon + short text with hover tooltips
  3. Net-%-of-OI never displays a false 0% (one decimal or `<1%`)
  4. At phone widths the card's dial / bars / sparkline stack vertically with no horizontal crush, and the pill row, key, and header wrap gracefully
  5. Cards have `shadow-md`, the topbar has `shadow-sm`, and the sidebar is unchanged

**Plans**: 2 plans

Plans:

- [ ] 02-01: Card de-noise — remove commentary, dedupe pair label, icon+tooltip badges, fix 0% rounding
- [ ] 02-02: Mobile stacking pass + shadow-md cards + shadow-sm topbar

### Phase 3: Detail Page & Education

**Goal**: The detail page matches the overview's conventions and the page teaches through one lean layer instead of two blocks
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: [DET-01, DET-02, EDU-01]
**UI hint**: yes
**Success Criteria** (what must be TRUE):

  1. `/cot/[pair]` uses SignalBars and the same badge/de-noise conventions as the overview
  2. `/cot/[pair]` reads cleanly at phone widths
  3. The overview has one education layer (collapsible/tooltip-driven); the gold strip and bottom SMC panel no longer exist as separate blocks

**Plans**: 2 plans

Plans:

- [ ] 03-01: Detail page consistency + mobile pass
- [ ] 03-02: Collapse education blocks into one teach-layer

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Signal Language | 0/2 | Not started | - |
| 2. Card De-noise & Mobile | 0/2 | Not started | - |
| 3. Detail Page & Education | 0/2 | Not started | - |
