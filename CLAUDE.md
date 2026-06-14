# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Smile FX Traders** is a desktop-first community trading platform for forex traders using Smart Money Concepts (ICT) and Supply & Demand. Lead instructor: **Kondwani**. Primary market: Zambia and Africa. Currencies: USD + ZMW (Kwacha, "K"). Instruments: EURUSD, GBPUSD, NZDUSD, XAUUSD, NAS100.

The design reference lives in `design_handoff_smile_fx_traders/` — HTML/Babel JSX prototypes that show the intended UI. **Do not copy prototype code verbatim.** Recreate designs using Next.js App Router idioms.

---

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** (theme tokens map to design CSS variables 1:1)
- **Prisma** + **Supabase** (database + auth)
- **Resend** (transactional email)
- **Zustand** (client state — see State section)
- **next-themes** (light/dark, `data-theme="light"|"dark"` on `<html>`)
- **Anthropic SDK** (AI trade review via `app/api/review/route.ts`)

---

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npx prisma migrate dev       # run DB migrations
npx prisma generate          # regenerate Prisma client
npx prisma studio            # GUI for the database
```

> **Prisma 7 quirks:**
> - Connection URLs are NOT in `schema.prisma` — the datasource block only has `provider`. URLs go in `prisma.config.ts` under `datasource.url` (pointing at `DIRECT_URL` for migrations) and via `PrismaPg` adapter in `src/lib/prisma.ts` (using `DATABASE_URL`).
> - Prisma CLI does **not** auto-load `.env` when a `prisma.config.ts` is present — `prisma.config.ts` manually calls `dotenv.config()` to load both `.env` and `.env.local`.
> - Next.js 16 renames `middleware.ts` → `proxy.ts` with a `proxy` export (not `middleware`).
>
> **Auth proxy:** Route protection lives in `src/proxy.ts`. Redirects unauthenticated users to `/login` and authenticated users away from auth pages to `/dashboard`.

---

## Route Structure

Use Next.js App Router route groups:

```
app/
  (auth)/           # unauthenticated — login, signup, onboarding
    login/
    signup/
    onboarding/
  (app)/            # authenticated shell — sidebar + topbar wrapper
    dashboard/
    journal/
    validator/
    trend/
    calendar/
    cot/
    alerts/
    community/
    academy/
    profile/
    settings/
    pricing/
  api/
    review/route.ts   # AI trade review — calls Anthropic SDK
```

Middleware guards the `(app)` group. Unauthenticated requests redirect to `/login`. Auth is handled by **Supabase Auth**; session state fed into the app shell.

---

## State Architecture

All mutable client state lives in a **Zustand store** that mirrors the prototype's `store.jsx` action surface:

| Slice | Actions |
|---|---|
| `trades[]` | `addTrade`, `updateTrade` |
| `feed[]` | `addPost`, `toggleLike`, `addComment` |
| `journaledAlerts` (Set) | `copyAlertToJournal` |
| `priceAlerts[]` | `addPriceAlert`, `removePriceAlert` |
| `notifs[]` | `markNotifsRead` → derived `unreadCount` |
| `user` | `setUser` |
| `toast(msg, tone, icon)` | transient queue, auto-dismiss 3200ms |

Derived stats (`stats` memo) are computed from `trades`: `netR`, `winRate`, `discFollowed`, `equity[]` (cumulative R oldest→newest), `models[]` (win-rate per SMC model).

**Persistence:** trades/journal and instructor alerts must be persisted to Supabase via Prisma. Everything else (feed, notifs, price alerts) can start as API-fetched. The prototype used session-only state — production must persist.

---

## Design Tokens → Tailwind

Map all CSS variables to Tailwind theme tokens. **Never hard-code hex values** — always use the token. Theme is switched via `data-theme` on `<html>`.

**Brand palette:**
| Token | Hex | Semantic |
|---|---|---|
| `teal` | `#08AEAA` | bullish / long / primary actions |
| `teal-bright` | `#30E8DF` | bullish emphasis, up values |
| `coral` | `#EA523D` | bearish / short / alerts |
| `coral-bright` | `#FF5942` | bearish emphasis, down values |
| `gold` | `#F8B93D` | instructor brand, streaks, premium, "open" trades |
| `navy` | `#0B425D` | dark accent surfaces |
| `navy-deep` | `#082A3B` | deepest dark, text-on-gold |

Direction colors (long=teal / short=coral) are **tweakable** — keep them tokenized, never hardcoded. Reference via `--teal` / `--coral` CSS variables.

**Fonts** (Google Fonts):
- `Inter` → body/UI (`--font-sans`)
- `Space Grotesk` → display, headings, large numbers (`--font-display`)
- `IBM Plex Mono` → prices and tabular numbers (`--mono`); always use `font-feature-settings: "tnum"`

---

## Shell Layout

Authenticated app: fixed two-column shell.
- **Sidebar** — 248px, `--sidebar` bg, right border `--line`. Logo top, scrollable nav (Dashboard / Tools / Community / Account groups), instructor card (Kondwani) bottom.
- **Topbar** — 60px, `backdrop-filter: blur(8px)`, `--topbar-bg`. Left: scrolling price ticker (mask-faded). Right: ⌘K search, theme toggle, notifications bell (red ping on unread), user chip.
- **Main** — scrollable; inner `.view` wrapper: `padding: 26px 30px 60px; max-width: 1320px; margin: 0 auto`.

Responsive breakpoints: below 1180px multi-column grids → 1 column; below 760px sidebar hides. Platform is desktop-first.

---

## Key UI Behaviours

- **Toasts** — bottom-center, slide-up 240ms, auto-dismiss 3200ms, tones: teal/gold/coral.
- **Modals** — 180ms `pop` entrance, Esc/overlay-click to dismiss. Modal shadow: `0 24px 70px rgba(0,0,0,0.4)`.
- **Drawers** — right slide-over 260ms, shadow: `-16px 0 50px rgba(0,0,0,0.3)`.
- **Motion** — `cubic-bezier(0.16,1,0.3,1)`; bars/rings transition 800–900ms; buttons `:active { scale(0.98) }`.
- **Nav active state** — teal gradient bg + `inset 0 0 0 1px rgba(8,174,170,0.3)`, icon switches to FILL variant.

---

## AI Trade Review

Route: `app/api/review/route.ts` — calls the Anthropic SDK.

The AI persona is **Gavo** — the platform's AI trading coach — reviewing against the SMC rulebook. Prompt structure: persona + rulebook text + trade fields (pair, dir, model, session, R:R, risk, result, tags, note). Response is strict minified JSON:

```json
{ "grade": "A+|A|B|C|D", "verdict": "...", "good": ["..."], "improve": ["..."], "tip": "..." }
```

Grade → UI tone: A+/A = teal, B/C = gold, D = coral. The review is re-runnable; shows skeleton loading state during fetch.

---

## SMC Domain Vocabulary

Glossary for consistent naming across the codebase:

| Term | Meaning |
|---|---|
| FVG | Fair Value Gap — 3-candle imbalance |
| OB | Order Block — last opposing candle before a BOS |
| BOS | Break of Structure |
| CHoCH | Change of Character (lower BOS, structure reversal) |
| MSS | Market Structure Shift |
| POI | Point of Interest (FVG or OB) |
| HTF | Higher Timeframe |
| EQH / EQL | Equal Highs / Equal Lows (liquidity pools) |
| PDH / PDL | Previous Day High / Low |
| SMT | Smart Money Technique (divergence between correlated pairs) |
| R / pnlR | Risk-Reward units; win = +rr, loss = −1, open = 0 |
| Killzone | High-probability session window (London / NY open) |

SMC models used in the journal and validator: `Liquidity Sweep → FVG`, `OB + BOS`, `Liquidity → CHoCH`, `SMT + OB`, `OB + FVG`, `Turtle Soup`, `BOS + retrace`.

---

## Charts

Charts are SVG candlestick charts with SMC annotation layers (FVG zones, OB zones, liquidity lines, BOS/CHoCH marks). For production, consider **lightweight-charts** or **TradingView widget** with a custom annotation overlay — or keep the SVG approach for full control.

Candle color scheme is **tweakable** — store the active scheme in the Zustand store and reference via CSS variables, not hardcoded colors.

---

## Pricing Plans

Three tiers stored in the DB, seeded from:
- **Starter** — free; limited journal (20 trades), read-only community, Foundations course only.
- **Pro Trader** — $29/mo (K750); full toolkit, live alerts, full Academy, AI review, leaderboard.
- **Funded Track** — $79/mo (K2000); everything in Pro + 1-on-1 mentorship with Kondwani.

Annual billing applies a 20% discount. Gate features by `user.plan` checked server-side.

---

## Design Reference Files

| Prototype file | Next.js equivalent |
|---|---|
| `app/data.jsx` | Prisma seed + API routes |
| `app/ui.jsx` | `components/ui/` primitives |
| `app/store.jsx` | `lib/store.ts` (Zustand) |
| `app/ai.jsx` | `app/api/review/route.ts` + `components/AIReview.tsx` |
| `app/views-core.jsx` | `app/(app)/dashboard/`, `/journal/` |
| `app/views-tools.jsx` | `app/(app)/validator/`, `/trend/`, `/calendar/`, `/cot/` |
| `app/views-community.jsx` | `app/(app)/alerts/`, `/community/`, `/academy/` |
| `app/views-account.jsx` | `app/(app)/profile/`, `/settings/`, `/pricing/` |
| `app/auth.jsx` | `app/(auth)/` + middleware |
| `app/app.jsx` | `app/(app)/layout.tsx` (shell) |
| `app/tweaks-panel.jsx` | **Not needed in production** |
