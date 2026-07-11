# Smile FX Traders — COT Tool Refinement

## What This Is

Smile FX Traders is a community trading platform for forex traders using Smart Money Concepts, led by Kondwani and aimed at Zambia/Africa. This milestone perfects the COT (Commitments of Traders) tool: the `/cot` overview and `/cot/[pair]` detail pages work well on desktop but are noisy, repetitive, overcrowded on cards, and degrade badly on mobile.

## Core Value

A trader opens `/cot` on any device and reads each pair's institutional bias at a glance — no noise, no repetition, no crushed layouts.

## Requirements

### Validated

<!-- Existing COT capabilities, inferred from the codebase. -->

- ✓ CFTC Legacy Futures-Only sync pipeline (`/api/cot/sync`, `/api/cot/refresh`) with ~28yr history per instrument — existing
- ✓ `/cot` overview page: per-pair cards with COT index dial, position bars (large spec / commercials / small spec), 8-week sparkline, 4-week history table — existing
- ✓ `/cot/[pair]` detail page with full positioning chart and commentary — existing
- ✓ Shared commentary engine (`lib/cot/commentary.ts`) used by cards and detail page — existing
- ✓ 5-level signal engine (`strong_bull`/`bull`/`neutral`/`bear`/`strong_bear`) with shared display config (`signalCfg.ts`) — existing
- ✓ Plan gating (`CotLockScreen`), COT notifications, MacroEdge confluence — existing
- ✓ Pair-framed net storage with USD-base inversion at write (post-July-2026 sign audit) — existing

### Active

**/cot overview — de-noise & minify**
- [ ] Custom `SignalBars` SVG component (3 bars, N filled) — not from the icon registry
- [ ] Signal shown icon-only on cards using brightness-variant mapping: strong_bear = 1 bar coral-bright, bear = 1 bar coral, neutral = 2 bars gold, bull = 3 bars teal, strong_bull = 3 bars teal-bright
- [ ] 3-entry color key above the cards (coral 1-bar Bearish · gold 2-bar Neutral/Mixed · teal 3-bar Bullish), plus a key entry for USD-base inverted pairs
- [ ] Merge summary pill strip + pair filter tabs into ONE pill row: each pill shows pair + SignalBars icon and acts as the filter
- [ ] Remove commentary (DivergencePanel) from cards — commentary lives on the detail page only
- [ ] Remove duplicate pair label on cards (`entry.pair` + `entry.label` both render)
- [ ] History badge → icon + `28yr` with hover tooltip explaining it
- [ ] USD-base inverted badge → icon-only (swap-style icon) with tooltip
- [ ] Fix 0%-rounding in "net % of OI" (`Math.round` on small values) — one decimal or `<1%`

**Mobile**
- [ ] Card inner grid (`auto_1fr_auto`: dial | bars | sparkline) stacks below `md` — cards must read cleanly on phones
- [ ] Merged pill row, key, and header wrap gracefully on small screens

**Detail page consistency**
- [ ] `/cot/[pair]` gets the same de-noise + mobile pass so overview and detail stay consistent (SignalBars, badge treatment, spacing)

**Education rework**
- [ ] Collapse the overview's two education blocks (gold "how to read" strip + bottom "How to use COT in SMC trading" panel) into one leaner teach-layer (collapsible / tooltip-driven)

**Elevation**
- [ ] COT cards get `shadow-md` for lift-off
- [ ] Topbar gets `shadow-sm`

### Out of Scope

- Sidebar shadow — flat surface separated by a border; a shadow implies elevation it doesn't have and fights the border
- Shadow sizes beyond Tailwind `lg` — hard cap; prefer `md` for cards, `sm` for shell
- Data-pipeline changes (sync, sign conventions, signal thresholds) — data trust was addressed in the July 2026 audit; this milestone is presentation + education only
- New COT analytics (extremes alerts, flip detection, delta charts) — "Analysis depth" deliberately deferred to a future milestone
- Text labels next to the SignalBars icon on cards — icon-only per the minify goal; the key carries the meaning

## Context

- Brownfield: codebase map exists at `.planning/codebase/` (ARCHITECTURE, CONVENTIONS, etc.)
- COT surfaces: `src/app/(app)/cot/CotReports.tsx` (overview), `src/app/(app)/cot/[pair]/page.tsx` (detail), `src/components/cot/*`, `src/lib/cot/*`
- Known pain points found in code review during questioning:
  - Three education surfaces + summary strip + filter tabs + card commentary = the "noisy" feel
  - `Math.round((largeSpecNet / openInterest) * 100)` produces `0%` for small nets
  - Card header renders both `entry.pair` and `entry.label` ("EURUSD · Euro FX")
  - Card inner grid is fixed 3-column at all breakpoints
- Icon registry constraint: icons are a Heroicons registry keyed by Material-style names; unregistered names crash pages. The SignalBars icon is therefore a standalone SVG component, not a registry entry.
- Design tokens only — never hardcode hex; teal/coral/gold + bright variants via CSS variables.

## Constraints

- **Tech stack**: Next.js App Router + TypeScript + Tailwind CSS — match existing conventions in `.planning/codebase/CONVENTIONS.md`
- **Design system**: tokenized colors only (`--teal`, `--coral`, `--gold`, bright variants); Tailwind shadow scale capped at `md` for cards, `sm` for shell
- **Consistency**: `signalCfg.ts` is the ONE shared signal display config (overview, detail, pair hub) — bar-icon mapping extends it, doesn't fork it
- **Mobile-first**: platform direction per `MOBILE_FIRST_DESIGN_PLAN.md`; below `md` the shell is BottomTabBar + Topbar

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SignalBars brightness-variant mapping (5 levels → 3-bar icon, strong = bright token) | Keeps the key at 3 entries; strength reads as glow, direction as color | — Pending |
| Merge summary strip + filter tabs into one pill row | Both restated the cards; one element does summary + navigation | — Pending |
| Commentary on detail page only | Cards minify; the shared engine already renders identically on detail | — Pending |
| Custom SVG for SignalBars, not icon registry | Registry is Heroicons-keyed; partial-fill bars need a bespoke component; unregistered names crash | — Pending |
| No sidebar shadow | Flat bordered surface; shadow would fake elevation | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-11 after initialization*
