# Phase 1: Signal Language - Research

**Researched:** 2026-07-12
**Domain:** Internal React/Tailwind component integration — brownfield codebase archaeology. No external libraries, packages, or APIs are involved in this phase.
**Confidence:** HIGH — every claim below was verified directly against source files in this repository via Read/Grep. Nothing is sourced externally or assumed from training data.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**SignalBars icon**
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

**Color key**
- Sits above the cards on `/cot`
- 3 entries only: coral 1-bar = Bearish · gold 2-bar = Neutral/Mixed · teal 3-bar = Bullish (strong variants show as brighter color, not separate key entries)
- Plus one entry for USD-base inverted pairs using a swap-style icon (icon must exist in ICON_REGISTRY or be added to it)

**Cards**
- Signal on card = SignalBars icon ONLY — remove the text signal badge (`sig.label` pill)
- Keep this phase scoped to the signal badge swap; other card cleanup is Phase 2

**Merged pill row**
- Replaces BOTH `SummaryStrip` and the pair filter tab row in `CotReports.tsx`
- Each pill: pair name + SignalBars icon; tap = filter to that pair (keep an "All" affordance)
- Selected state must be visually obvious; wrap on small screens

### Claude's Discretion
- Exact SignalBars geometry (bar widths, gaps, radii, heights), sizes per context (card vs pill vs key)
- Whether the key is its own row or merges visually with the pill row area
- Accessibility labels (aria-label with full signal name since text label is gone)
- How the "All" filter state looks in the merged pill row
- Whether `cotIndex` number stays in the pills (currently shown in SummaryStrip pills)

### Deferred Ideas (OUT OF SCOPE)
- Card commentary removal, duplicate label fix, badge tooltips, 0% fix, shadows → Phase 2
- Detail-page consistency pass, education rework → Phase 3
- Extremes/flip analytics → v2 backlog
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SIG-01 | Each pair's COT signal shown as a custom 3-bar `SignalBars` SVG icon (standalone component, not icon-registry) | Confirmed placement precedent (`components/cot/`, not `components/ui/`), confirmed Icon/ICON_REGISTRY behavior it must NOT go through. See Existing Patterns §3, §7. |
| SIG-02 | 5 signal levels map via brightness variants, driven from `signalCfg.ts`, not forked | Found the mapping is a **single-field extension**: `strokeColor` already holds the exact right color per level for all 5 signals; only a new `barCount` (or equivalent) field is missing. See Integration Points §1. |
| SIG-03 | 3-entry color key + USD-base-inverted key entry | Found `swap_horiz` is **already registered** in `ICON_REGISTRY` and **already used** for this exact USD-base-inverted concept on the detail page. See Existing Patterns §3. |
| SIG-04 | Cards show icon only, no signal text label | Located exact removal site: `CotReports.tsx:213-216` (the `sig.label` badge span in `CotCard`). See Existing Patterns §2, row 1. |
| PAGE-01 | Summary pill strip + filter tabs → ONE pill row | Located both blocks to replace (`SummaryStrip` fn `CotReports.tsx:350-369`; filter tabs `CotReports.tsx:514-531`), confirmed reusable state (`selected`, `pairs`) and the "All" pill edge case, confirmed empty-data pairs always carry a valid `signal` (`neutral`) so SignalBars never receives an invalid key. See Integration Points §3. |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

Directives that bind this phase, extracted from the project's `CLAUDE.md`:

1. **Never hard-code hex colors.** Always reference the design-token table (`teal` `#08AEAA`, `teal-bright` `#30E8DF`, `coral` `#EA523D`, `coral-bright` `#FF5942`, `gold` `#F8B93D`) via the CSS variable / Tailwind utility, never a literal hex or a duplicated rgba string invented ad hoc.
2. **Icon registry constraint:** icons are a Heroicons-backed registry keyed by Material-style names (`src/components/ui/icons/registry.tsx`); "unregistered names crash pages twice" is called out explicitly as prior-incident history — SignalBars must NOT be routed through this registry (confirmed as a locked decision in CONTEXT.md too).
3. **Component convention:** small, modular, data-driven components; content/config lives in `data/`-style files, not hardcoded in JSX. `signalCfg.ts` is exactly this pattern already — extend it, don't hardcode a parallel bar-count map inside a component.
4. **Match existing file style**; don't reformat unrelated code (global user instruction, reinforced by project CLAUDE.md's "recreate designs using Next.js idioms, don't copy prototype code verbatim" framing).
5. **TypeScript strict, no `any`.**
6. **Motion convention:** if any transition is added (e.g., a bar-fill animation), the project's easing is `cubic-bezier(0.16,1,0.3,1)` (exposed as the `ease-app` Tailwind transition-timing utility, seen throughout — `duration-700 ease-app`, `duration-[900ms] ease-app`).
7. **Responsive convention:** below `md` (768px) the shell changes; multi-column grids below `lg` (1024px) generally collapse to 1 column. The pill row / color key must `flex-wrap` gracefully — this is already the existing pattern on the filter-tab row (`flex-wrap` present, `CotReports.tsx:516`).

## Summary

This phase is a pure client-side, presentation-layer change to one file family already built around a single shared config object. `SIGNAL_CFG` (`src/components/cot/signalCfg.ts`) is genuinely the one source of truth its own comment claims it is — every consumer in the codebase (7 call sites across 5 files, not just the 3 files named in the task's file list) reads from it and only from it. No consumer reaches into `CotSignal` directly to build its own color/label logic. This means the phase's core technical risk — "don't fork it, don't break existing consumers" — is a config-extension problem, not an architecture problem: every field currently on `SignalCfg` (`label`, `shortLabel`, `textCls`, `bgCls`, `borderCls`, `icon`, `strokeColor`) is used by at least one existing call site, so nothing can be renamed or removed, but adding fields is purely additive and safe.

The single most valuable finding for the planner: the brightness-variant mapping the user locked in CONTEXT.md is **already 95% expressed** in the existing config. `strokeColor` already holds `var(--coral-bright)` for `strong_bear`, `var(--coral)` for `bear`, `var(--gold)` for `neutral`, `var(--teal)` for `bull`, and `var(--teal-bright)` for `strong_bull` — an exact match to the user's locked mapping. The only missing datum is bar count (1/2/3) per level. This turns "extend signalCfg.ts" into a one-field addition, not a new parallel structure.

Two other high-value discoveries change what the planner needs to build: (1) `swap_horiz` is **already registered** in `ICON_REGISTRY` (→ Heroicons' `ArrowsRightLeftIcon`) and is **already in use** on the COT detail page for the exact "USD-base inverted" concept the color key's 4th entry needs — no registry addition is required, just reuse of an existing key. (2) There is no dedicated `Tooltip` component anywhere in `components/ui/` — the codebase's tooltip convention, used in 29 files, is the native `title=` attribute on a `cursor-help`-styled span, exactly as seen at `CotReports.tsx:219-224`. Any hover-explain affordance this phase adds (e.g. on the color key or SignalBars) should follow that same convention rather than introducing a new primitive.

**Primary recommendation:** Add a `barCount: 1 | 2 | 3` field to the existing `SignalCfg` interface in `signalCfg.ts` (reusing `strokeColor` for the bar fill color), build `SignalBars` as a new file in `components/cot/` (not `components/ui/`) that takes `signal: CotSignal` as its only required prop and internally resolves `SIGNAL_CFG[signal]`, and reuse the existing `selected`/`pairs` state in `CotReports.tsx` when merging `SummaryStrip` + the filter-tab row into one component.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| SignalBars SVG rendering | Browser / Client | — | Pure presentational React component, client-rendered inside a `"use client"` page |
| Brightness-variant → bar-count/color mapping | Browser / Client (shared config module) | — | `signalCfg.ts` has no `"use client"` directive itself — it's plain data, imported by both client components AND one server module (`lib/cot/notify.ts`). It must stay a plain, serializable data module (see Risks/Gotchas). |
| Color key rendering | Browser / Client | — | Static JSX block, no data fetching |
| Merged pill row + filter interaction | Browser / Client | — | Reuses existing `useState` (`selected`) already in `CotReports.tsx`; no new state architecture needed |
| COT signal data (`entry.signal`, `cotIndex`, etc.) | API / Backend | Database | **Unchanged by this phase.** `/api/cot` already returns a valid `CotSignal` for every entry, including unloaded ones (`EMPTY_COT_STATS.signal = "neutral"`, `src/lib/cot/signal.ts:100`). No API or DB work is needed for Phase 1. |

This phase touches zero backend/API/DB code. Everything is `components/cot/*` and `app/(app)/cot/CotReports.tsx`.

## Existing Patterns

### 1. `SIGNAL_CFG` — the shared config (`src/components/cot/signalCfg.ts`)

The full current file (24 lines):

```typescript
export interface SignalCfg {
  label:       string;
  shortLabel:  string;
  textCls:     string;
  bgCls:       string;
  borderCls:   string;
  icon:        string;
  // Raw var(--x) string for SVG stroke props (Ring/Sparkline) — not a className.
  strokeColor: string;
}

export const SIGNAL_CFG: Record<CotSignal, SignalCfg> = {
  strong_bull: { label: "Strong Bullish Setup", shortLabel: "S.Bull",  textCls: "text-teal-bright",  bgCls: "bg-[rgba(48,232,223,0.10)]", borderCls: "border-[rgba(48,232,223,0.22)]", icon: "trending_up",    strokeColor: "var(--teal-bright)"  },
  bull:        { label: "Bullish Bias",          shortLabel: "Bull",    textCls: "text-teal",         bgCls: "bg-[rgba(8,174,170,0.08)]",  borderCls: "border-[rgba(8,174,170,0.20)]",  icon: "arrow_upward",   strokeColor: "var(--teal)"         },
  neutral:     { label: "Neutral / Mixed",       shortLabel: "Neutral", textCls: "text-gold",         bgCls: "bg-[rgba(248,185,61,0.08)]", borderCls: "border-[rgba(248,185,61,0.20)]", icon: "remove",         strokeColor: "var(--gold)"         },
  bear:        { label: "Bearish Bias",          shortLabel: "Bear",    textCls: "text-coral",        bgCls: "bg-[rgba(234,82,61,0.08)]",  borderCls: "border-[rgba(234,82,61,0.20)]",  icon: "arrow_downward", strokeColor: "var(--coral)"        },
  strong_bear: { label: "Strong Bearish Setup",  shortLabel: "S.Bear",  textCls: "text-coral-bright", bgCls: "bg-[rgba(255,89,66,0.10)]",  borderCls: "border-[rgba(255,89,66,0.22)]",  icon: "trending_down",  strokeColor: "var(--coral-bright)" },
};
```

Note `strokeColor` already equals the exact color the user locked per level. **Bar count is the only new datum.**

### 2. Complete `SIGNAL_CFG` consumer inventory (every usage site, file:line, exact fields read)

The task's file list named 3 consumers. Grepping the whole repo for `SIGNAL_CFG` found **7 call sites across 5 files** — 2 extra files not in the original list (`CotBiasPanel.tsx`, `lib/cot/notify.ts`) that must also not break.

| # | File:Line | Context | Fields read | Notes |
|---|-----------|---------|--------------|-------|
| 1 | `src/app/(app)/cot/CotReports.tsx:178` (`CotCard`) | Card signal badge, lines 213-216 | `bgCls`, `textCls`, `icon`, `label` | **This exact badge is the SIG-04 removal target** — `<span className={cn(..., sig.bgCls, sig.textCls)}><Icon name={sig.icon}/>{sig.label}</span>` |
| 2 | `src/app/(app)/cot/CotReports.tsx:354` (`SummaryStrip`) | Whole pill, lines 356-365 | `bgCls`, `textCls`, `borderCls`, `icon`, `shortLabel`, + `e.cotIndex` (not from SIGNAL_CFG) | **This entire function is the PAGE-01 removal target** — merges into the new pill row |
| 3 | `src/app/(app)/cot/[pair]/page.tsx:156` | Detail-page header badge, lines 211-215 | `bgCls`, `textCls`, `icon`, `label` | Out of scope for Phase 1 (Phase 3 = detail-page consistency) but must render unchanged |
| 4 | `src/app/(app)/pair/[pair]/page.tsx:247` (`cotSig`) | COT Snapshot panel, lines 508-517 | `bgCls`, `borderCls`, `icon`, `textCls`, `label` | Also line 522: `strokeColor` passed raw to `<Ring color={cotSig.strokeColor}>`; line 524 reuses `textCls` for ring-center digits |
| 5 | `src/app/(app)/pair/[pair]/page.tsx:579` (`dxySig`) | DXY Confirmation panel, lines 586-591 | `bgCls`, `borderCls`, `icon`, `textCls`, `label` | Second, independent `SIGNAL_CFG` lookup in the same file (for the DXY instrument, not the page's own pair) |
| 6 | `src/components/cot/CotBiasPanel.tsx:83` (`cfg`) | Dashboard widget row | `strokeColor` (marker dot, line 97), `textCls`, `bgCls`, `borderCls`, `shortLabel` (lines 104-109) | **Not in the original file list** — dashboard's compact COT row, must not break |
| 7 | `src/lib/cot/notify.ts:85,92` | Push-notification title/body text | `label` only (plain string interpolation, no CSS classes) | **Not in the original file list**, and NOT a UI component — server-side notification fan-out. Confirms `label` must stay a plain string. |

**Every field on `SignalCfg` is consumed somewhere.** None are dead. This is the hard constraint: any refactor must be additive (new fields only), never a rename/removal of `label`, `shortLabel`, `textCls`, `bgCls`, `borderCls`, `icon`, or `strokeColor`.

### 3. Icon system — `Icon.tsx` + `ICON_REGISTRY`

`src/components/ui/Icon.tsx` (full file, 31 lines) — the component itself:

```typescript
export function Icon({ name, size = 20, className = "", style }: IconProps) {
  const Component = ICON_REGISTRY[name];
  // An unregistered name must never crash the page (React #130). Render an
  // empty placeholder of the same footprint and complain in the console.
  if (!Component) {
    console.error(`[Icon] "${name}" is not in ICON_REGISTRY — rendering placeholder`);
    return <span aria-hidden="true" className={className} style={{ display: "inline-block", width: size, height: size, ...style }} />;
  }
  return (
    <Component className={className} style={{ width: size, height: size, ...style }} aria-hidden="true" />
  );
}
```

**Answers focus item #2 directly:** an unregistered name does **not** crash the page — it logs a `console.error` and renders an empty same-size `<span>` placeholder. (CONTEXT.md's claim that "unregistered names crash pages" refers to a *historical* incident before this guard was added — see `.planning/codebase/` project memory `project_material_symbols_subset.md`; the current code is defensive. Still, shipping a silently-blank icon is a real regression risk worth avoiding, so route SignalBars around the registry entirely as CONTEXT.md locks in, rather than relying on this fallback.)

`src/components/ui/icons/registry.tsx` — swap-style icons **already registered**, all mapped to the same underlying Heroicon:

```typescript
sync: ArrowPathIcon,
sync_alt: ArrowsRightLeftIcon,
swap_horiz: ArrowsRightLeftIcon,
autorenew: ArrowPathIcon,
refresh: ArrowPathIcon,
currency_exchange: ArrowsRightLeftIcon,
```

`swap_horiz`, `sync_alt`, and `currency_exchange` are visually **identical** (all render `ArrowsRightLeftIcon`) — they're just semantic aliases into one Heroicon. There is no `swap_vert`.

**Critically, `swap_horiz` is already in production use for this exact concept**, on the COT detail page's color key (`src/app/(app)/cot/[pair]/page.tsx:311-315`):

```tsx
{data?.usdBase && (
  <span className="flex items-center gap-1.5 opacity-80">
    <Icon name="swap_horiz" size={12} />
    Long/Short = foreign-currency contract · Net framed for {pair.toUpperCase()}
  </span>
)}
```

This means SIG-03's "USD-base inverted" key entry needs **zero registry changes** — just reuse `swap_horiz`, matching the existing detail-page convention instead of introducing a new icon name.

### 4. Tooltip convention — native `title=`, no dedicated component

`components/ui/` has no `Tooltip.tsx` (confirmed via directory listing — 19 files, none named Tooltip). A repo-wide grep for `title=` found **29 files** using the native HTML `title` attribute, confirming it as the established convention, not an exception.

The exact pattern already in `CotReports.tsx:218-225` (USD-base badge on the overview card):

```tsx
{entry.usdBase && (
  <span
    title="Positions shown for the foreign currency futures (JPY/CHF/CAD). Net positive = bullish on the USD pair."
    className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded cursor-help bg-panel-2 text-ink-dim border border-line"
  >
    USD-base · inverted
  </span>
)}
```

`cursor-help` + `title=` is the full idiom: no JS, no portal, no extra state. The one non-native tooltip in the codebase is a hover label inside `PositioningChart.tsx` (SVG chart hover, not a reusable primitive — chart-specific, out of scope).

### 5. Existing pill/tab/filter/nav-active patterns to reuse

**Pair filter tabs** (the exact selected-state convention), `CotReports.tsx:514-531`:

```tsx
<div className="flex items-center gap-1.5 mb-5 flex-wrap">
  {pairs.map((p) => (
    <button
      key={p}
      type="button"
      onClick={() => setSelected(p)}
      className={cn(
        "px-3 py-1.5 rounded-lg text-[12.5px] font-semibold transition-all active:scale-95",
        selected === p ? "bg-teal text-white" : "bg-panel-2 text-ink-dim border border-line"
      )}
    >
      {p}
    </button>
  ))}
</div>
```

Selected = `bg-teal text-white`. Unselected = `bg-panel-2 text-ink-dim border border-line`. `pairs` is `useMemo(() => ["All", ...entries.map(e => e.pair)], [entries])` (line 434) — "All" is already a synthetic first entry, not a real `CotEntry`.

**SummaryStrip pill** (being removed, but its layout is the template for the new merged pill), `CotReports.tsx:350-369`:

```tsx
function SummaryStrip({ entries }: { entries: CotEntry[] }) {
  return (
    <div className="flex flex-wrap gap-2 mb-5">
      {entries.map((e) => {
        const sig = SIGNAL_CFG[e.signal];
        return (
          <div key={e.pair} className={cn("flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[12px] font-semibold border", sig.bgCls, sig.textCls, sig.borderCls)}>
            <Icon name={sig.icon} size={13} />
            <span className="text-ink-strong">{e.pair}</span>
            <span>{sig.shortLabel}</span>
            <span className="tabular-nums text-[11px] opacity-75">{e.cotIndex}</span>
          </div>
        );
      })}
    </div>
  );
}
```

Note it currently shows `cotIndex` as the last element — directly relevant to the "Claude's Discretion" question of whether the index number stays in the merged pill.

**Other pill primitives already in `components/ui/`** — precedent for componentizing a pill:
- `DirPill.tsx` (9-25): `long`/`short` pill, `size: "sm"|"md"` prop, icon + text, rounded-full.
- `Chip.tsx` (1-31): generic `tone: "neutral"|"teal"|"coral"|"gold"` pill via a `TONES` lookup record — closest existing structural precedent for "N-color pill driven by a lookup table," though it's generic/tone-based rather than signal-based.

**Nav active-state pattern** (CLAUDE.md-documented, shared via a helper module — `src/lib/nav-active-style.ts`, full file):

```typescript
export function navActiveRowClass(active: boolean): string {
  return active
    ? "bg-[linear-gradient(135deg,rgba(8,174,170,0.22),rgba(8,174,170,0.08))] text-ink-strong shadow-[inset_0_0_0_1px_rgba(8,174,170,0.3)]"
    : "text-ink-mid";
}
export function navActiveIconClass(active: boolean): string {
  return active ? "text-teal" : "text-inherit";
}
```

Used by both `Sidebar.tsx` and `BottomTabBar.tsx` so the two never drift. This is a heavier "selected" treatment (gradient + inset ring) than the filter tab's flat `bg-teal text-white` — both are valid precedents; the flat version is what currently lives in the COT page itself and is the lower-risk match for "visually obvious" per CONTEXT.md, but the gradient+ring version is the platform-wide nav idiom if the planner wants a more distinctive selected state for the merged pill row.

### 6. Color tokens — verified exact Tailwind v4 utility names

No `tailwind.config.*` file exists — confirmed via glob (none found). This is a **Tailwind v4** project (`"tailwindcss": "^4"` in `package.json`, `@import "tailwindcss"` in `globals.css:1`), using CSS-native `@theme inline` registration instead of a JS config.

`src/app/globals.css:60-65` (raw brand values):
```css
:root {
  --teal:         #08AEAA;
  --teal-bright:  #30E8DF;
  --coral:        #EA523D;
  --coral-bright: #FF5942;
  --gold:         #F8B93D;
}
```

`src/app/globals.css:137-163` (`@theme inline` block — this is what makes them real Tailwind utilities, not just CSS vars):
```css
@theme inline {
  --color-teal:         var(--teal);
  --color-teal-bright:  var(--teal-bright);
  --color-coral:        var(--coral);
  --color-coral-bright: var(--coral-bright);
  --color-gold:         var(--gold);
  ...
  --color-ink-strong: var(--ink-strong);
  --color-line:      var(--line);
  --color-track:     var(--track);
}
```

**Confirmed valid first-class Tailwind utilities** (not arbitrary-value syntax) for every color this phase needs:

| Token | Text | Background | Border |
|-------|------|------------|--------|
| teal | `text-teal` | `bg-teal` | `border-teal` |
| teal-bright | `text-teal-bright` | `bg-teal-bright` | `border-teal-bright` |
| coral | `text-coral` | `bg-coral` | `border-coral` |
| coral-bright | `text-coral-bright` | `bg-coral-bright` | `border-coral-bright` |
| gold | `text-gold` | `bg-gold` | `border-gold` |
| (unfilled/dim bars) | `text-track` | `bg-track` | `border-track` |

**Existing mixed convention to follow:** solid text/border colors use the first-class utility (`text-teal-bright`, `border-coral`); translucent backgrounds use hand-written arbitrary rgba (`bg-[rgba(48,232,223,0.10)]`) rather than Tailwind's `/opacity` modifier on custom colors — this is the pattern in `signalCfg.ts` itself and should be matched, not "modernized," per the "match existing style" directive.

For raw SVG `stroke`/`fill` attributes (not `className`), the codebase's convention is a raw `var(--x)` string, not a Tailwind class — see `strokeColor` field itself, and `Ring.tsx`'s `color` prop (defaults to `"var(--teal)"`). SignalBars' SVG bars should follow this same raw-CSS-var-string convention for `fill`, since SVG presentation attributes don't resolve Tailwind's `@theme` custom properties the same way `className` does inside plain divs — the existing components already work around this by passing `var(--x)` strings straight into `stroke`/`fill`/`style.background`.

### 7. Component placement convention: `components/cot/` vs `components/ui/`

Current split, by actual content:

| Location | Contents | Pattern |
|----------|----------|---------|
| `components/ui/` | `Icon`, `Avatar`, `Button`, `Panel`, `DirPill`, `Chip`, `StatTile`, `Ring`, `Sparkline`, `Form`, `Modal`, `Drawer`, `EmptyState`, `Skeleton`, `Stars`, `ToastHost`, `CandleChart`, `SessionTimeline`, `ResponsiveRow` | **Domain-agnostic primitives.** Take generic props (`value`, `color`, `size`) — e.g. `Ring` takes a raw `color` string and a 0-100 `value`, with zero knowledge of what "COT" or `CotSignal` means. Reused across COT, journal, dashboard, etc. |
| `components/cot/` | `signalCfg.ts`, `CotLockScreen.tsx`, `PositioningChart.tsx`, `CotBiasPanel.tsx`, `CotIndexDisplay.tsx` | **Domain-coupled composites.** Directly reference `CotSignal`/`CotEntry`/`CotDetailRow` types, hardcode COT-specific labels ("COT Index", zone thresholds tuned to the 0-100 COT scale), import `SIGNAL_CFG` directly. |

`SignalBars` is explicitly typed against `CotSignal` (per CONTEXT.md: driven by `signalCfg.ts`'s brightness mapping, which is keyed by `CotSignal`). That makes it domain-coupled by definition, matching the `components/cot/` bucket — **not** `components/ui/`, even though structurally it's "just" a small parametric SVG (which is the closest analog to `Ring`/`Sparkline` in `components/ui/`). The precedent that settles this: `CotIndexDisplay.tsx` is *also* structurally "just" an SVG ring + bars, but lives in `components/cot/` because its color logic (`IDX_CLS`) and labels are COT-specific — same reasoning applies to `SignalBars`.

**Recommendation:** `src/components/cot/SignalBars.tsx`, sitting next to `signalCfg.ts` which it directly consumes.

## Integration Points

**1. Extending `signalCfg.ts` — minimal, additive, backward-compatible.**
Add one field to the `SignalCfg` interface:
```typescript
export interface SignalCfg {
  // ...existing 7 fields, unchanged...
  barCount: 1 | 2 | 3;  // NEW — bars filled for the SignalBars icon
}
```
Populate per the locked mapping — `strong_bear`/`bear` → `1`, `neutral` → `2`, `bull`/`strong_bull` → `3`. `strokeColor` already supplies the correct color for every level (see Existing Patterns §1), so **no new color field is needed**. This satisfies SIG-02's "driven from `signalCfg.ts`, not forked" requirement literally — one field, same object, all 7 existing consumers untouched since they never enumerate `Object.keys` (they always destructure known field names).

**2. `SignalBars` component contract.**
Recommended signature, matching how every consumer already holds a `CotSignal` value in scope (`entry.signal`, `data.signal`, `cotData.signal`, `dxyData.signal`, `e.signal`):
```typescript
interface SignalBarsProps {
  signal: CotSignal;
  size?: "sm" | "md" | "lg";  // or explicit px — card vs pill vs key contexts need different sizes per CONTEXT.md's discretion note
  className?: string;
}
export function SignalBars({ signal, size = "md", className }: SignalBarsProps) {
  const cfg = SIGNAL_CFG[signal];
  // render 3 bars; first `cfg.barCount` filled with cfg.strokeColor, rest dimmed (var(--track))
}
```
This lets every call site become a one-line drop-in: `<SignalBars signal={entry.signal} />`, with no per-call-site lookup duplication — matching the existing call sites' style of destructuring `SIGNAL_CFG[x]` once and reading fields off it.

**3. Merging `SummaryStrip` + filter tabs (PAGE-01).**
Both blocks already live in the same file, both already read from the same `entries`/`selected`/`pairs`/`setSelected` state (`CotReports.tsx:405-439`). No new state is needed — the merge is a rendering-only change:
- Iterate `pairs` (already `["All", ...entries.map(e => e.pair)]`, `CotReports.tsx:434`), not `entries`, so the "All" pill is naturally included as CONTEXT.md requires ("keep an All affordance").
- For `p === "All"`, render a text-only pill (no `SignalBars`, no entry to look up).
- For real pairs, look up the matching `CotEntry` from `entries` to get `.signal` (and optionally `.cotIndex`, per the "Claude's Discretion" note) and render `<SignalBars signal={entry.signal} />` + pair name.
- Reuse the exact selected-state classes already present (`selected === p ? "bg-teal text-white" : "bg-panel-2 text-ink-dim border border-line"`, `CotReports.tsx:524`) or upgrade to the nav gradient+ring idiom (`lib/nav-active-style.ts`) — both are established patterns in this codebase; the flat one is the lower-diff, already-COT-page-native choice.
- **Verified: every entry has a valid `signal`, even with zero history.** `/api/cot` (`src/app/api/cot/route.ts`) falls back to `EMPTY_COT_STATS` (`src/lib/cot/signal.ts:99-102`) for instruments with no DB rows yet, and `EMPTY_COT_STATS.signal = "neutral"`. So `SignalBars` will never be asked to render for an `undefined`/invalid signal key in the pill row, even before Friday's first CFTC sync of a new instrument.

**4. Color key placement (SIG-03).**
CONTEXT.md leaves "own row vs. merges with pill row" to discretion. There's a directly relevant existing precedent one file over: the COT **detail** page already has a static "Color key" row (`src/app/(app)/cot/[pair]/page.tsx:296-334`) with the exact phrasing `<span className="font-semibold text-ink-mid">Color key</span>` followed by swatch+label pairs and a `swap_horiz` entry — structurally almost identical to what SIG-03 asks for on the overview page. Recommend modeling the new overview-page key on that existing block's markup shape (flex row, small swatches, `flex-wrap`, muted label) for visual consistency between the two COT pages, rather than inventing a new key layout from scratch.

## Risks/Gotchas

1. **`signalCfg.ts` is imported by a server-side module, not just client components.** `src/lib/cot/notify.ts:11` imports `SIGNAL_CFG` and reads only `.label` (plain string interpolation into a push-notification body — see `notify.ts:85-93`). This is safe today because every field is plain serializable data (strings). If a future change to `signalCfg.ts` ever imported a React component or JSX value into the config object (e.g. embedding an `<Icon/>` element instead of an icon-name string), it would still *technically* import fine in `notify.ts` (the module wouldn't execute the JSX unless rendered), but it breaks the established "icon is a string key" pattern the whole registry system depends on. **Keep the new `barCount` field a plain number, matching the existing plain-data fields.**

2. **`cn()` is not `clsx`/`tailwind-merge` — it's a plain truthy-join** (`src/lib/cn.ts`, 3 lines: `classes.filter(Boolean).join(" ")`). It does not deduplicate or resolve conflicting utilities; last-class-wins is NOT guaranteed by merge logic, only by CSS cascade order. Not a blocker for this phase, but if the planner conditionally toggles two classes that touch the same property (e.g. two different `bg-*` utilities), both land in the string and cascade/specificity — not merge order — decides. Keep conditional class construction to ternaries picking ONE full class string per state (the existing codebase already does this everywhere, e.g. the filter tab's `selected === p ? "bg-teal text-white" : "..."`), not two independently-toggled classes.

3. **`SummaryStrip`'s existing `cotIndex` display** (`CotReports.tsx:363`) has no direct equivalent decision in CONTEXT.md — it's explicitly flagged "Claude's Discretion." Dropping it silently changes information density on the page; keeping it makes the merged pill wider (relevant to the "wrap on small screens" requirement, MOB-02, which is nominally Phase 2 scope but the pill row itself ships in Phase 1). Flag this as a planning decision, not an oversight, either way.

4. **Two other consumers outside the phase's named file list exist and must not break:** `src/components/cot/CotBiasPanel.tsx` (dashboard widget) and `src/lib/cot/notify.ts` (push notifications). Neither renders the removed text badge or the summary strip, so SIG-04/PAGE-01's removals don't touch them directly — but any `SignalCfg` interface change (adding `barCount`) must still type-check against their usage (`cfg.strokeColor`, `cfg.textCls`, `cfg.bgCls`, `cfg.borderCls`, `cfg.shortLabel`, `SIGNAL_CFG[...].label`). Since the change is additive-only, this is low-risk, but `npm run type-check` (per CLAUDE.md's required pre-completion check) will catch it if not.

5. **SVG `fill`/`stroke` vs Tailwind `className` color resolution.** Raw SVG presentation attributes (`fill="..."`, `stroke="..."`) need literal color values, not Tailwind class names. Every existing SVG-drawing component in this codebase (`Ring.tsx`, `Sparkline.tsx`, `signalCfg.ts`'s own `strokeColor` field) already solves this by passing `var(--token)` strings directly into the SVG attribute or into `style={{}}`, never a `className`. `SignalBars`'s bar-fill color must follow the same pattern — use `cfg.strokeColor` directly as an SVG `fill`, not `cfg.textCls` as a `className` on a `<rect>`/`<path>` (SVG shape elements don't inherit `text-*` Tailwind color utilities the way `currentColor`-based Heroicons do, unless explicitly wired through `fill="currentColor"` + a `text-*` className on the wrapping element — which is the Heroicons/`ICON_REGISTRY` pattern, not the `Ring`/`Sparkline` pattern used elsewhere for this SVG-drawing style. Pick one and stay consistent within the new component).

## Recommendations for Planner

1. **Split into exactly the 2 plans ROADMAP.md already specifies** — this research confirms that split is architecturally clean: Plan 01-01 (SignalBars component + `signalCfg.ts` extension + card icon swap + color key) touches `signalCfg.ts`, a new `SignalBars.tsx`, and `CotCard`'s badge only. Plan 01-02 (merged pill row) touches only the `SummaryStrip`/filter-tabs region of the same file. They don't share new code beyond `SignalBars` itself, which Plan 01-01 must finish first since 01-02 consumes it.

2. **Don't hand-roll a new color/label lookup for the merged pill row or the key.** Both should call `SIGNAL_CFG` (extended) and `SignalBars`, exactly like every other consumer — resist the temptation to inline a fresh `Record<CotSignal, ...>` anywhere else in `CotReports.tsx`; that would be the "fork" CONTEXT.md explicitly forbids.

3. **Reuse `swap_horiz`**, not a new icon name, for the USD-base-inverted key entry — it's already registered and already carries this exact meaning on the sibling detail page. Zero `ICON_REGISTRY` changes needed for this phase.

4. **Model the new overview-page color key on the existing detail-page color key's markup** (`cot/[pair]/page.tsx:296-334`) for cross-page visual consistency, since Phase 3's stated goal is exactly "detail page uses the same … conventions as the overview" — starting them aligned now avoids rework later.

5. **Use native `title=` for any hover-explain text** this phase introduces (e.g. on the color key's inverted-pair entry, or an aria-label-adjacent tooltip on SignalBars) — do not build a new Tooltip primitive; none exists and 29 files' worth of precedent says it isn't needed.

6. **Verification should include a `type-check` pass touching all 5 consumer files**, not just the 3 originally named — `CotBiasPanel.tsx` and `notify.ts` are real, silent-breakage risks if the `SignalCfg` interface is edited carelessly (e.g. making a field optional when a consumer assumes it's always present).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|--------------|-----|
| Signal → color/label lookup | A second `Record<CotSignal, ...>` inside `SignalBars.tsx` or the pill row | Extend `SIGNAL_CFG` in `signalCfg.ts` | CONTEXT.md explicitly locks "do not fork it"; 7 existing consumers already depend on it being the one source |
| Hover-explain tooltip | A new `Tooltip.tsx` primitive/portal | Native `title=` attribute + `cursor-help` className | Zero existing Tooltip component; 29 files already use `title=`; this is the established idiom, not a gap |
| USD-base-inverted icon | A new SVG or a new `ICON_REGISTRY` entry | `swap_horiz` (already registered → `ArrowsRightLeftIcon`) | Already used for this identical concept one page over |
| Selected pill visual state | A new selected-state color scheme | Either the flat `bg-teal text-white` (COT page's own existing filter-tab convention) or `lib/nav-active-style.ts`'s gradient+ring (platform-wide nav idiom) | Both are established; inventing a third pattern fragments the design system further |

**Key insight:** This phase has essentially zero net-new architecture. Every visual primitive it needs (color tokens, icon lookup, tooltip convention, pill styling, selected-state styling) already exists somewhere in the codebase with an established convention. The work is composition and one config extension, not invention.

## Security Domain

`security_enforcement` is `true` in `.planning/config.json` (ASVS level 1, block-on: high), so this section is included per protocol — but scoped honestly: this phase has no security-relevant surface.

| ASVS Category | Applies | Rationale |
|---------------|---------|-----------|
| V2 Authentication | No | No auth flow touched; existing page-level gating (`CotLockScreen`, plan-tier check) is unchanged and out of scope |
| V3 Session Management | No | No session code touched |
| V4 Access Control | No | No new routes, no new API endpoints, no new data access — pure client rendering of already-fetched, already-authorized data |
| V5 Input Validation | No | No new user input. The only "input" is `onClick` selecting a pair from a closed, already-fetched list (`entries`) — not free text, not a new form |
| V6 Cryptography | No | Not applicable |

No new threat patterns are introduced — this is a presentational refactor of already-rendered, already-authorized data with no new data flow, no new endpoint, and no new trust boundary.

## Sources

### Primary (HIGH confidence — direct repo inspection)
- `src/components/cot/signalCfg.ts` — full file read
- `src/app/(app)/cot/CotReports.tsx` — full file read (593 lines)
- `src/app/(app)/cot/[pair]/page.tsx` — full file read (627 lines)
- `src/app/(app)/pair/[pair]/page.tsx` — full file read (653 lines)
- `src/lib/cot/types.ts` — full file read
- `src/components/ui/Icon.tsx`, `src/components/ui/icons/registry.tsx`, `src/components/ui/icons/custom.tsx` — full files read
- `src/components/cot/CotBiasPanel.tsx`, `src/lib/cot/notify.ts` (relevant excerpt), `src/components/cot/CotIndexDisplay.tsx` — full/partial reads
- `src/components/ui/DirPill.tsx`, `src/components/ui/Chip.tsx`, `src/components/ui/Ring.tsx`, `src/components/ui/Sparkline.tsx` — full files read
- `src/lib/nav-active-style.ts`, `src/lib/cn.ts` — full files read
- `src/app/globals.css` (lines 1-163) — token + `@theme inline` registration read
- `src/lib/cot/signal.ts` (`EMPTY_COT_STATS`) — grep + excerpt read
- `src/app/api/cot/route.ts` — grep-confirmed signal source
- `.planning/phases/01-signal-language/01-CONTEXT.md`, `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/config.json`, `package.json` — full reads
- Repo-wide `Grep` sweeps: `SIGNAL_CFG` (14 hits), `title=` (29 files), `Tooltip` (1 file), color-token names (70 files, confirmed via `globals.css` + `@theme inline`)

### Secondary / Tertiary
None — this research required no external sources. Everything is verified against the actual repository state as of 2026-07-12.

## Metadata

**Confidence breakdown:**
- SIGNAL_CFG consumer inventory: HIGH — verified via repo-wide grep, not just the 3 named files; cross-checked every field against every call site
- Icon/ICON_REGISTRY behavior: HIGH — full source read of `Icon.tsx` and `registry.tsx`, confirmed `swap_horiz` both exists and is already in production use for this exact concept
- Tooltip convention: HIGH — confirmed absence of a Tooltip primitive via directory listing, confirmed `title=` convention via 29-file grep and a direct excerpt
- Color token mapping: HIGH — confirmed via `@theme inline` block in `globals.css`, cross-checked against `tailwind.config.*` absence (Tailwind v4 CSS-native config)
- Component placement convention: HIGH — derived from consistent, repeated pattern across 5 files in `components/cot/` vs 19 in `components/ui/`, not a single data point

**Research date:** 2026-07-12
**Valid until:** Stable — this is internal codebase structure, not a fast-moving external dependency. Re-verify only if `signalCfg.ts`, `CotReports.tsx`, or the icon registry change before Phase 1 planning is consumed.
