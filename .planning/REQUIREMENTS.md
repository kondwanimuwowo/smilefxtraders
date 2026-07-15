# Requirements: COT Tool Refinement

**Defined:** 2026-07-11
**Core Value:** A trader opens `/cot` on any device and reads each pair's institutional bias at a glance — no noise, no repetition, no crushed layouts.

## v1 Requirements

### Signal Language

- [x] **SIG-01**: User sees each pair's COT signal as a custom 3-bar `SignalBars` SVG icon (standalone component, not an icon-registry entry)
- [x] **SIG-02**: The 5 signal levels map via brightness variants: strong_bear = 1 bar coral-bright, bear = 1 bar coral, neutral = 2 bars gold, bull = 3 bars teal, strong_bull = 3 bars teal-bright — driven from `signalCfg.ts`, not forked
- [x] **SIG-03**: User sees a 3-entry color key above the cards (coral 1-bar = Bearish, gold 2-bar = Neutral/Mixed, teal 3-bar = Bullish) plus a key entry explaining USD-base inverted pairs
- [x] **SIG-04**: Cards show the signal icon only — no signal text label on the card

### Card De-noise

- [x] **CARD-01**: Commentary (DivergencePanel) is removed from overview cards and remains on the detail page only
- [x] **CARD-02**: Card header shows the pair once (duplicate `entry.label` text removed or moved to tooltip)
- [x] **CARD-03**: History badge renders as icon + `28yr` with a hover tooltip explaining what it means
- [x] **CARD-04**: USD-base inverted badge renders as an icon-only swap-style marker with tooltip
- [x] **CARD-05**: "Net % of OI" never shows a false `0%` — small values show one decimal or `<1%`
- [x] **CARD-06**: Cards have `shadow-md` elevation

### Page Structure

- [x] **PAGE-01**: Summary pill strip and pair filter tabs are replaced by ONE pill row — each pill shows pair + SignalBars icon and acts as the filter
- [x] **PAGE-02**: Topbar has `shadow-sm`; sidebar remains shadow-free

### Mobile

- [x] **MOB-01**: Card inner grid (COT dial | position bars | sparkline) stacks below `md` so cards read cleanly on phones
- [x] **MOB-02**: The merged pill row, color key, and page header wrap gracefully on small screens

### Detail Page

- [x] **DET-01**: `/cot/[pair]` uses the same SignalBars icon, badge treatment, and de-noise conventions as the overview
- [x] **DET-02**: `/cot/[pair]` reads cleanly on mobile (same stacking pass as overview cards)

### Education

- [x] **EDU-01**: The overview's two education blocks (gold "how to read" strip + bottom SMC panel) are collapsed into one leaner teach-layer (collapsible / tooltip-driven)

## v2 Requirements

### Analysis Depth

- **ANLY-01**: Extremes/flip detection surfaced on cards (COT index extreme alerts, net-position flips)
- **ANLY-02**: Week-over-week delta visualization beyond the current sparkline

### AI Commentary — Gavo COT Read

Shipped 2026-07-12: Gavo, the platform's AI trading coach, integrated into `/cot/[pair]`. Modeled directly on the existing MacroEdge pattern (`GavoExplanation.tsx` + `/api/macro/explain` + `GavoMacroExplanation`), which is plan-gated, cached, and cheap (Sonnet, ~400 tokens).

- [x] **GAVO-01**: User can request an AI-generated "Gavo COT Read" narration for the current pair, rendered above the heat-map table on `/cot/[pair]`
- [x] **GAVO-02**: Narration is a pure COT read — current large-spec/commercial positioning, WoW change, divergence, and where `cotIndex` sits in its own range (mirrors the content the removed card-level DivergencePanel used to show, now AI-narrated instead of templated)
- [x] **GAVO-03**: Feature is gated to Edge & Pro plans — Free plan gets a 403 + upgrade CTA, matching `/api/macro/explain`'s existing convention
- [x] **GAVO-04**: Narration is cached per pair, keyed off an input hash of the current COT reading; regenerated only when the underlying data changes (mirrors `GavoMacroExplanation`'s cache pattern — avoids re-billing the same reading)
- [x] **GAVO-05**: UI reuses the idle/loading/done/error/locked state machine and visual treatment established by `GavoExplanation.tsx` (same card style, title, Explain/Retry/Regenerate/Upgrade affordances) for consistency with the MacroEdge feature

**What shipped:**
- New Prisma model `GavoCotExplanation` (pair-keyed, its own table — `GavoMacroExplanation`'s `SubjectType.PAIR` is already used for macro bias explanations on the same pair keys, so sharing it would collide on the unique constraint)
- `src/lib/cot/gavoPrompt.ts` — COT-specific system prompt + message builder
- `src/app/api/cot/[pair]/explain/route.ts` (POST), plan-gated via `requirePaidPlan`, cache-hashed on report date + net figures
- `src/components/cot/GavoCotRead.tsx`, modeled directly on `GavoExplanation.tsx`, mounted above the heat-map table in `cot/[pair]/page.tsx`

Migration `20260712120000_add_gavo_cot_explanation` applied 2026-07-12 (`prisma migrate deploy`) — `gavo_cot_explanations` table exists in the database. Feature is fully live.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Sidebar shadow | Flat bordered surface; shadow fakes elevation and fights the border |
| Shadows beyond Tailwind `lg` | Hard cap per design direction; `md` cards, `sm` shell |
| Data-pipeline changes (sync, signs, thresholds) | Data trust addressed in July 2026 audit; this milestone is presentation + education |
| Signal text labels on cards | Icon-only per minify goal; the key carries meaning |
| New COT analytics | "Analysis depth" deferred to a future milestone (tracked as v2) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SIG-01 | Phase 1 | Complete |
| SIG-02 | Phase 1 | Complete |
| SIG-03 | Phase 1 | Complete |
| SIG-04 | Phase 1 | Complete |
| PAGE-01 | Phase 1 | Complete |
| CARD-01 | Phase 2 | Complete |
| CARD-02 | Phase 2 | Complete |
| CARD-03 | Phase 2 | Complete |
| CARD-04 | Phase 2 | Complete |
| CARD-05 | Phase 2 | Complete |
| CARD-06 | Phase 2 | Complete |
| MOB-01 | Phase 2 | Complete |
| MOB-02 | Phase 2 | Complete |
| PAGE-02 | Phase 2 | Complete |
| DET-01 | Phase 3 | Complete |
| DET-02 | Phase 3 | Complete |
| EDU-01 | Phase 3 | Complete |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-11*
*Last updated: 2026-07-12 after Phase 3 (all 17 v1 requirements complete)*
