# Phase 1: Signal Language - Context

**Gathered:** 2026-07-12
**Status:** Ready for planning
**Source:** New-project deep questioning (decisions made interactively with Kondwani during `/gsd-new-project`)

<domain>
## Phase Boundary

The `/cot` overview page gets a unified visual signal language: a custom 3-bar SignalBars icon replaces text signal badges on cards, a color key above the cards explains the icon (plus USD-base inverted pairs), and ONE merged pill row (pair + signal icon, tappable filter) replaces both the summary pill strip and the pair filter tabs.

NOT in this phase: card de-noise (commentary removal, badge minification, 0% fix), mobile stacking, shadows (Phase 2); detail-page consistency and education rework (Phase 3).

</domain>

<decisions>
## Implementation Decisions

### SignalBars icon
- Custom standalone SVG React component — NOT an icon-registry entry (registry is Heroicons keyed by Material names; unregistered names crash pages)
- 3 vertical bars, N filled by signal level; unfilled bars render as outline/dim
- Brightness-variant mapping (LOCKED, user chose from previewed options):
  - `strong_bear` = 1 bar, coral-bright
  - `bear` = 1 bar, coral
  - `neutral` = 2 bars, gold
  - `bull` = 3 bars, teal
  - `strong_bull` = 3 bars, teal-bright
- Mapping data lives in/extends `src/components/cot/signalCfg.ts` — the ONE shared signal display config. Do not fork it.
- Colors via existing tokens/CSS variables only (`--teal`, `--teal-bright`, `--coral`, `--coral-bright`, `--gold`) — never hardcoded hex

### Color key
- Sits above the cards on `/cot`
- 3 entries only: coral 1-bar = Bearish · gold 2-bar = Neutral/Mixed · teal 3-bar = Bullish (strong variants show as brighter color, not separate key entries)
- Plus one entry for USD-base inverted pairs using a swap-style icon (icon must exist in ICON_REGISTRY or be added to it)

### Cards
- Signal on card = SignalBars icon ONLY — remove the text signal badge (`sig.label` pill)
- Keep this phase scoped to the signal badge swap; other card cleanup is Phase 2

### Merged pill row
- Replaces BOTH `SummaryStrip` and the pair filter tab row in `CotReports.tsx`
- Each pill: pair name + SignalBars icon; tap = filter to that pair (keep an "All" affordance)
- Selected state must be visually obvious; wrap on small screens

### Claude's Discretion
- Exact SignalBars geometry (bar widths, gaps, radii, heights), sizes per context (card vs pill vs key)
- Whether the key is its own row or merges visually with the pill row area
- Accessibility labels (aria-label with full signal name since text label is gone)
- How the "All" filter state looks in the merged pill row
- Whether `cotIndex` number stays in the pills (currently shown in SummaryStrip pills)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Signal system
- `src/components/cot/signalCfg.ts` — the shared 5-level signal display config (label, colors, icon); extend here
- `src/lib/cot/types.ts` — `CotSignal` union and `CotEntry` shape

### Page being modified
- `src/app/(app)/cot/CotReports.tsx` — overview page: `SummaryStrip`, pair filter tabs, `CotCard` signal badge all live here

### Other consumers of SIGNAL_CFG (must not break)
- `src/app/(app)/cot/[pair]/page.tsx` — COT detail page
- `src/app/(app)/pair/[pair]/page.tsx` — pair hub

### Conventions
- `.planning/codebase/CONVENTIONS.md` — code style, component patterns
- `CLAUDE.md` — design tokens table, icon registry constraint, shell layout

</canonical_refs>

<specifics>
## Specific Ideas

- User's exact key wording: "a coral icon with one bar filled and the other two bars, line, is Bearish Bias. An amber icon with 2 bars filled is Neutral/Mixed and a teal 3 bars full bars for strong Bullish Bias."
- "we are just going to use the icon in the card" — icon-only on cards
- The pills row exists because "the pills with Pairs and bias/signal above the page seem to be just a repetition of what the cards already say" — user approved merging summary + filter into one element

</specifics>

<deferred>
## Deferred Ideas

- Card commentary removal, duplicate label fix, badge tooltips, 0% fix, shadows → Phase 2
- Detail-page consistency pass, education rework → Phase 3
- Extremes/flip analytics → v2 backlog

</deferred>

---

*Phase: 01-signal-language*
*Context gathered: 2026-07-12 via new-project questioning*
