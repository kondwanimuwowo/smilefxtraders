# Smile FX Traders — Platform Features

A living document of every feature available on the platform, written for training sessions with traders. Updated as new modules are built.

---

## Trade Journal

The journal is your performance ledger. Every trade you take should be logged here — it's how you find your edge over time.

### Core features

- **Log any trade** — pair, direction, framework, model, session, opened at, entry price, stop loss, take profit, planned R:R, risk %, outcome, close price, closed at, discipline, execution rating, Fibonacci confluence tags, rule-break description, notes, and chart screenshot — all in one modal. Close price and closed-at fields only appear when the outcome is Win or Loss.
- **Multi-framework journalling** — every trade is tagged as either **SMC** or **Supply & Demand**. The framework toggle at the top of the log modal defaults to your account preference. When editing an existing trade, the framework is locked — you cannot re-categorise a logged trade.
- **Edit or delete** any trade at any time.
- **Outcome tabs** — filter your journal by All, Wins, Losses, or Open trades with a single click.
- **Pair quick-filter** — click EURUSD, XAUUSD, or any pair chip to instantly isolate that instrument's history.
- **Search** — search across pair name, model name, and your trade notes simultaneously.
- **Pagination** — 15 trades per page, cleanly navigable.

### Stats bar

Four live stat tiles at the top of the journal, updated every time you log a trade:

| Tile | What it tells you |
|---|---|
| **Net R** | Your cumulative profit and loss in R-multiples across all closed trades |
| **Win Rate** | Percentage of closed trades that hit target, plus raw W/L count |
| **Expectancy** | Expected R earned per trade: `(winRate × avgWin) + (lossRate × avgLoss)`. Positive = your edge is real. Negative = you're losing money in expectation even if your win rate looks fine. |
| **Discipline** | Percentage of all trades where you followed your rules — the most important number |
| **Open** | Count of currently active positions you have logged |

### Trade detail page

Click any row to open a full routable page for that trade at `/journal/[id]`. Every detail is on one scrollable page — no drawer, no truncation:

- **Generated chart** — a seeded candlestick chart annotated with the setup's FVG zone, entry price line, and BOS/CHoCH mark. Uses your trade's pair and direction to generate a representative chart. If you uploaded a screenshot, your screenshot shows instead.
- **Price levels** — entry price, stop loss, take profit, and closing price displayed in a grid. Close price is colour-coded teal (win) or coral (loss). Visible only for fields you filled in.
- **Price move** — for closed trades with both entry and close price logged, the page shows the actual pip (or point) move in your direction — e.g. "+23.4 pips" for forex or "+180.5 pts" for NAS100/XAUUSD.
- **Timing** — opened at datetime, closed at datetime, and trade duration (computed automatically from the two timestamps — e.g. "4h 35m" or "2d 3h"). Visible only if timestamps were logged.
- **Duration badge** — the subtitle row in the hero header also shows the trade duration inline next to the session, for a quick read.
- **Model brief** — a one-sentence explanation of the setup model you used (SMC or S&D), so you can recall the concept when reviewing old trades.
- **Metadata boxes** — planned R:R, risk %, and session side by side.
- **Execution quality** — your star rating at a glance.
- **Rules indicator** — green "Clean" or red "Broken" so you can see at a glance whether this trade was disciplined.
- **Rule broken** — if you marked the trade as a rule break and described what you did wrong, that text is surfaced in a coral card.
- **Tags** — auto-tagged based on the model you selected.
- **Notes** — your full written notes for that trade.
- **Discipline breach warning** — if you marked the trade as a rule break, a coral warning banner reminds you to review your mistake log.
- **Gavo AI Review** — Gavo's review is persisted to the database the first time you run it, so it loads instantly on every subsequent visit without you having to click Review again. A refresh icon lets you re-run the review at any time (e.g. after you edit the trade). The review is graded A+→D with a verdict, what you did well, areas to improve, and a framework-specific tip. The system prompt is prompt-cached so re-runs within 5 minutes cost 10% of normal Anthropic input-token price.

### Analytics sidebar

Sits to the right of the trade table and updates live as you log:

- **Model win rate** — horizontal bars showing your win percentage per SMC model. Green = 60%+, gold = 40–60%, coral = below 40%. Shows trade count so you know which results are statistically meaningful.
- **Session breakdown** — how many trades you take per session (London / New York / Asia), colour-coded by session. Reveals whether you're trading your best session or overtrading outside your edge.
- **Recurring leaks** — groups all your rule-break trades by model and shows a count. If you keep breaking rules on "OB + BOS" setups, this surfaces it clearly. Review your checklist before entering those setups.
- **Avg win vs avg loss** — your average winning trade in R versus your average losing trade. If these are close, your R:R is not protecting you.

### Persistence

Trades are saved to Supabase PostgreSQL via Prisma on every write. When you log in, your full trade history is loaded server-side in the app layout and hydrated into the client store — so your journal is always up to date across devices and after page refresh. Writes are optimistic (the trade appears immediately) and synced to the database in the background via `/api/trades`.

### Smart details

- **Streak counter** — once you have 3 or more consecutive wins or losses, the journal header shows your current streak (e.g., "5W streak" or "3L streak"). Useful for recognising when you're on tilt.
- **From-alert indicator** — trades copied directly from Kondwani's instructor alerts show a small gold bell icon in the table row, so you can track how your instructor-sourced setups are performing separately from your own research.
- **Auto-tagging** — tags are automatically assigned when you select a model. SMC models map to tags like FVG, OB, Sweep, CHoCH. S&D models map to tags like Demand, Supply, Fresh, DBR, RBD, Reversal, Continuation — so your tag cloud builds without extra effort across both frameworks.
- **Fibonacci tags** — if you select Fibonacci confluence levels (OTE, Fib 61.8, Fib 78.6, Fib 50) in the log modal, those are added to the trade's tag list and displayed in gold on the trade detail page — separate from the model's auto-tags so you can immediately see which entries used Fib as confluence.

---

## Dashboard

Your command centre. Shows a snapshot of your account the moment you log in.

- **Performance stats** — five stat tiles: Net R, Win Rate, Expectancy (expected R per trade), Discipline score, and Journal streak.
- **Equity curve** — sparkline chart of your cumulative R growth oldest to newest. Responsive width — it fills whatever space it has.
- **Featured alert** — Kondwani's latest live setup call with pair, direction, model, session, entry, SL, TP1, and planned R:R. One button copies it directly into your journal as an open trade.
- **SMC candlestick chart** — annotated with FVG zones, the Asia Low reference line, and a CHoCH mark showing structure context.
- **Discipline score ring** — circular gauge showing your rules-followed percentage with a motivational label.
- **Discipline log** — a compact table of your recent trades with inline win/loss indicators and rule-followed checkmarks.
- **Economic events** — upcoming high-impact calendar events with time, impact level, and forecast vs. previous.
- **Trend matrix** — a 5×5 grid of pairs (EURUSD, GBPUSD, NZDUSD, XAUUSD, NAS100) across timeframes (MN, W, D, H4, H1), showing bullish/bearish/ranging bias at a glance.
- **Greeting + session label** — the header greets you by name and tells you which trading session is currently active (London Open, New York Open, etc.), based on your UTC clock.
- **Day/date context** — shows the current day label (Today / Monday / etc.) so you know where you are in the trading week.

---

## Shell & Navigation

The outer wrapper every screen lives inside.

- **Sidebar** — 220px fixed sidebar with grouped navigation: Dashboard, Tools, Community, Account. Active page is highlighted with a teal gradient background and filled icon variant.
- **Topbar** — 48px bar with a live price ticker (EURUSD, GBPUSD, NZDUSD, XAUUSD, NAS100) scrolling across the left side, and search, theme toggle, notifications bell, and user chip on the right.
- **Price ticker** — prices auto-scroll with a fade mask on both ends. Uses tabular numbers so prices don't jump as digits change.
- **Theme toggle** — switches between light and dark mode. Remembers your preference across sessions.
- **Notifications bell** — shows a red ping dot when you have unread notifications.
- **Toasts** — action confirmations appear at the bottom-centre of the screen (e.g., "XAUUSD long logged"), slide up, and auto-dismiss after 3.2 seconds. Colour-coded: teal for success, gold for info, coral for errors or deletions.
- **Instructor card** — Kondwani's card appears at the bottom of the sidebar on every screen as a constant reminder of who your instructor is.
- **Real logo** — the Smile FX Traders logo appears in the sidebar and on the auth screens, rendered as a white cutout on the teal gradient background.

---

## Auth

The entry flow before traders reach the platform.

- **Login** — email and password sign-in. "Continue as demo trader" option for quick access.
- **Signup** — full name, username, email, and password. Immediately creates your account in the database.
- **Onboarding** — 4-step setup flow after signup:
  1. **Framework** — choose your trading system: Smart Money Concepts (ICT) or Supply & Demand. Sets the default in your journal and validator.
  2. **Instruments** — pick which pairs you trade. Tailors your watchlist and calendar.
  3. **Risk %** — set your per-trade risk with a slider (0.25% to 3%). Discipline starts here.
  4. **Experience** — Beginner, Intermediate, or Advanced. Points you to the right place in the Academy.
- **Route protection** — unauthenticated users cannot access any app screen. They are redirected to login automatically.

---

## Design & Accessibility

- **Colour tokens** — every colour on the platform is a named design token. Long = teal, Short = coral, Premium/Open = gold. Direction colours are never hardcoded.
- **Font system** — Inter for body and UI text, Plus Jakarta Sans for headings and large numbers, with tabular-nums for prices so they align in columns.
- **Light and dark mode** — both modes are fully supported across every screen with no hardcoded hex colours.
- **Custom dropdown (Select component)** — all dropdowns use a fully custom portal-rendered component (not the native browser `<select>`). The dropdown list renders into `document.body` so it is never clipped by an overflow container or modal boundary. Features: chevron rotates 180° on open, teal border + ring glow when active, check circle on the selected option, hover highlight on inactive options, closes on outside click or Escape, disabled state greys out with a `not-allowed` cursor. API matches the SegRow component: `onChange(v: string)`.
- **Cursor: pointer on all interactive elements** — buttons, links, labels, checkboxes, radio inputs, and select elements all show a pointer cursor globally. Disabled buttons show `not-allowed`.
- **Desktop-first, mobile-ready** — every page grid collapses to a single column on phones and tablets. The sidebar becomes a full-width hamburger drawer on mobile with a blur backdrop. The topbar shows a hamburger button on small screens. All stat grids go 2-column on mobile and 4-column on sm+. Tables that can't collapse get horizontal scroll with a scroll-hint label on mobile.
- **Alive empty states** — empty pages show a floating animated icon (gentle bob loop) on a teal radial halo background, with a relevant call-to-action button. Never a blank white box.

---

## Rules Validator

Your pre-trade discipline gate. Fill in the setup details and the validator checks every condition in real time — before you touch the button. Supports both SMC and Supply & Demand frameworks.

### How it works

Configure your setup on the left panel, and the right panel updates live with pass/fail/warn results for every rule. No "validate" button to click — it reacts immediately. Switch frameworks with the toggle at the top; the model list, checkboxes, and rule engine all update instantly.

### Framework: Smart Money Concepts (SMC)

**Setup inputs**

- **Instrument & direction** — which pair and which way you're trading.
- **SMC Model** — the specific setup type you've identified (7 models available).
- **Model info card** — as soon as you select a model, a teal card appears below explaining exactly what conditions that model require and a one-sentence description of the pattern. A teaching tool built into the workflow.
- **Session** — London, New York, or Asia.
- **HTF Bias** — Bullish, Bearish, or Ranging as seen on the higher timeframe.
- **Entry TF & POI type** — the timeframe you're entering on and whether the POI is a FVG, OB, or both overlapping.
- **Planned R:R** — your target risk-to-reward ratio.
- **Setup conditions** — toggle checkboxes for: Liquidity swept, BOS confirmed, CHoCH confirmed, Inside killzone. The SMT divergence checkbox only appears when the "SMT + OB" model is selected.

**SMC models (7):** Liquidity Sweep → FVG, OB + BOS, Liquidity → CHoCH, SMT + OB, OB + FVG, Turtle Soup, BOS + retrace

**Rules checked (8):**

| Rule | Behaviour |
|---|---|
| **HTF bias aligns** | Fail if bias opposes direction; warn if HTF is ranging |
| **Structure confirmed** | Fail if neither BOS nor CHoCH; warn if CHoCH only (no prior BOS) |
| **Liquidity swept** | Fail for sweep-dependent models (Liquidity Sweep → FVG, Turtle Soup, etc.); warn for others |
| **POI matches model** | Fail if selected POI doesn't match what the model requires |
| **SMT divergence** | Only checked for "SMT + OB" — fail if not confirmed |
| **Minimum R:R ≥ 2:1** | Fail below 2:1; warn between 2:1 and 2.9:1; pass at 3:1+ |
| **Inside killzone** | Warn (not fail) if outside the session's high-probability window |
| **Model-session fit** | Warn when a model is known to underperform in a specific session (e.g. Turtle Soup in Asia) |

---

### Framework: Supply & Demand (S&D)

**Setup inputs**

- **Instrument & direction** — which pair and which way you're trading.
- **S&D Setup** — the specific zone pattern you've identified (6 setups available).
- **Model info card** — same teaching card as SMC, with S&D-specific conditions and a one-sentence description.
- **Session** — London, New York, or Asia.
- **HTF Bias** — Bullish, Bearish, or Ranging as seen on the higher timeframe.
- **Entry TF** — the timeframe you're entering on.
- **Planned R:R** — your target risk-to-reward ratio.
- **Zone conditions** — toggle checkboxes for: Zone is fresh/untested, Strong impulsive origin, Correct side approach, Inside premium/discount, Inside killzone.

**S&D setups (6):** Fresh Demand Zone, Fresh Supply Zone, Drop-Base-Rally (DBR), Rally-Base-Drop (RBD), Drop-Base-Drop (DBD), Rally-Base-Rally (RBR)

**Rules checked (8):**

| Rule | Severity | Behaviour |
|---|---|---|
| **HTF bias aligns** | Fail | Fail if bias opposes direction; warn if ranging |
| **Zone is fresh** | **Hard fail** | A tested or stale zone invalidates the setup immediately |
| **Strong impulsive origin** | **Hard fail** | A slow, choppy, overlapping origin produces a weak zone |
| **Correct side approach** | **Hard fail** | Demand zones must be approached from above; supply from below. Wrong side approach = critical error |
| **Premium / discount** | Warn | Long in premium or short in discount is a warning, not a fail |
| **Minimum R:R ≥ 2:1** | Fail | Same as SMC — fail below 2:1, warn between 2:1 and 2.9:1 |
| **Inside killzone** | Warn | S&D zones react most cleanly in London and New York sessions |
| **Session-setup fit** | Warn | DBR/RBD setups warn in Asia session where institutional participation is lower |

---

### Fibonacci confluence (both frameworks)

Fibonacci retracements are supported in both the validator and the trade log as an optional confluence layer — not a required rule. Fibonacci can be used regardless of which framework or model you are trading.

**In the validator:** A "Fibonacci level at POI" toggle appears at the bottom of the setup inputs panel. Toggle it on if your POI lands at a Fibonacci level. A level selector then appears with four options:

| Level | When to use |
|---|---|
| **OTE (62–79%)** | The Optimal Trade Entry zone — the highest-probability Fibonacci window combining the 62%, 70.5%, and 79% retracement levels |
| **61.8%** | The "golden ratio" — price frequently respects this level as support/resistance |
| **78.6%** | Deep retracement — used for setups that tap into discount more aggressively |
| **50%** | Mid-point — the equilibrium retracement, commonly watched by retail and institutional traders |

If your setup is already at grade A (all main rules pass, at most one warning), adding Fibonacci confluence **boosts the grade to A+**. The verdict card shows a gold "Fibonacci X confluence active" badge when the boost is applied. Fibonacci **does not fix a failing rule** — it only upgrades a clean setup.

**In the trade log:** Fibonacci tag chips (OTE, Fib 61.8, Fib 78.6, Fib 50) appear in the modal under "Fibonacci confluence (optional)". Select one or more if your entry was at a Fibonacci level — this adds the tag to the trade's tag list. On the trade detail page, Fibonacci tags are highlighted in gold with a ruler icon, separate from the model's auto-tags, so you can see at a glance whether the entry used Fib confluence.

---

### Verdict & grading (both frameworks)

- **A+** — All rules pass. Execute with full conviction. (Also awarded when an A-grade setup has Fibonacci confluence confirmed.)
- **A** — One warning, no fails. Execute at standard size.
- **B** — One fail or two warnings. Consider halving your risk.
- **C** — Two fails. Resolve them before entering.
- **D** — Three or more fails. Do not enter.

A score bar (0–100%) and a pass count (e.g. "7/8 rules passed") sit alongside the grade.

### Killzone auto-detection

The "Entry inside session killzone" checkbox updates automatically. Every 60 seconds, the validator checks the current UTC time against the selected session window:

| Session | Killzone window (UTC) |
|---|---|
| London | 08:00 – 10:00 |
| New York | 13:00 – 15:00 |
| Asia | 00:00 – 02:00 |

If the current time falls inside the window, the checkbox ticks itself and a **"Active now"** label with a pulsing teal dot appears below it. If outside, it shows **"Opens in Xh Xm"** — counting down to when the next killzone opens. You can still override the checkbox manually at any time (e.g. if you're reviewing a historical trade outside market hours).

---

### Position size calculator

A collapsible section at the bottom of the setup inputs panel. Expand it to calculate your exact lot size before placing the trade.

**Inputs:**

| Field | Notes |
|---|---|
| Account balance | Persisted to `localStorage` — pre-filled on every visit |
| Risk % | How much of your account you're risking (default 1%) |
| Entry price | Your planned entry — separate from the setup panel fields |
| Stop loss | Your planned SL — separate from the setup panel fields |

The planned R:R from the setup panel is re-used here automatically.

**Outputs (live, update as you type):**

| Output | Notes |
|---|---|
| Pips / $ dist / Points | Pip distance for forex pairs; dollar distance for XAUUSD; points for NAS100 |
| Dollar risk | `balance × risk%` — the raw dollar amount you're putting on the line |
| **Lot size** | Primary output. Displayed large in gold. Shown to 2 decimals normally; 4 decimals for micro lots (< 0.01) |
| TP level | Derived from entry, SL distance, and your planned R:R. Colour-coded teal for longs, coral for shorts |

**Pip value used per standard lot:**

| Instrument | Pip value |
|---|---|
| EURUSD / GBPUSD / NZDUSD | $10 per pip |
| XAUUSD | $100 per $1 move (100oz contract) |
| NAS100 | $1 per point |

**Formula:** `Lot size = Dollar risk ÷ (Pip distance × Pip value)`

---

### Actions

- **Log this trade** — only appears when grade is A, A+, or B (zero fails). Opens the journal modal pre-filled with the pair, direction, framework, model, session, and R:R from the validator. One click from "valid setup" to "trade logged."
- **Save to history** — adds the current result to the session history panel without opening the journal.
- **Reset** — clears all inputs back to defaults.

### Validation history

The last 5 validations appear in a timeline below the checklist, showing pair, direction, model, framework chip, grade badge, and time. Lets you compare how the same setup performed under different conditions. Clears on page refresh (session-only — no persistence needed).

---

## SMC & S&D Models Explained

A reference guide for every setup model available in the journal and validator. Use this during your review sessions — when you see a model name on an old trade, look it up here to recall exactly what you were looking for.

---

### Smart Money Concepts (SMC) Models

SMC is based on ICT methodology. Every model requires a higher-timeframe bias, a structural shift (BOS or CHoCH), and an entry at a clean Point of Interest (POI) — typically a Fair Value Gap (FVG) or Order Block (OB) — inside a session killzone.

---

#### Liquidity Sweep → FVG

Price raids a pool of resting liquidity (equal highs, equal lows, previous day high/low, or session high/low), then sharply reverses and leaves a Fair Value Gap in its wake. The entry is inside the FVG after the sweep is confirmed. This is the most common ICT entry model — the sweep is the fuel, the FVG is the landing zone.

**Entry checklist:** Liquidity level identified on HTF → price wicks through it (the sweep) → momentum candle in the opposite direction → FVG printed on entry TF → enter on return to FVG inside killzone.

---

#### OB + BOS

A Break of Structure (BOS) confirms the new directional move. The entry is on the pullback to the last Order Block (the final opposing candle before the BOS candle) on the entry timeframe. The OB is where institutional orders were placed before the structure broke — price returns to it to fill those orders.

**Entry checklist:** Clear BOS on entry TF → identify the OB (last down-close candle before a bullish BOS, or last up-close candle before a bearish BOS) → wait for price to return to the OB zone → entry inside the OB, ideally with a wick showing a rejection.

---

#### Liquidity → CHoCH

A Change of Character (CHoCH) is a lower-degree BOS — it signals a potential reversal in trend, not just a continuation pullback. This model requires a liquidity sweep first, followed by a CHoCH, indicating that the sweep was the final manipulation before the reversal. Higher conviction than a CHoCH alone because the liquidity grab confirms institutional involvement.

**Entry checklist:** HTF liquidity pool swept → minor structure breaks in the opposite direction (CHoCH) → FVG or OB printed on the CHoCH leg → entry at the POI. Treat this as an early-trend model — use tighter confirmation before sizing up.

---

#### SMT + OB

Smart Money Technique (SMT) divergence: two positively correlated pairs (e.g. EURUSD and GBPUSD, or XAUUSD and DXY inverse) form different highs or lows at the same time. One pair sweeps its level; the other does not — this divergence signals that the sweep is a manipulation, not a genuine breakout. The entry is at the Order Block on the pair that swept.

**Entry checklist:** Identify a correlated pair. Both approach the same liquidity level → one sweeps it, the other does not → the sweeping pair has a clean OB in the sweep zone → enter at the OB on the sweeping pair. The non-sweep on the correlated pair is your confirmation.

---

#### OB + FVG

A dual-confluence entry where an Order Block and a Fair Value Gap overlap at the same price zone. The OB defines the institutional supply/demand origin and the FVG shows the imbalance left behind — when they sit at the same level, the zone is a stronger POI than either alone. Price is expected to fill the FVG and respect the OB simultaneously.

**Entry checklist:** BOS or CHoCH confirms direction → identify an OB on the entry TF → confirm that a FVG overlaps or is nested within the OB zone → wait for price to return to the overlapping area → enter. The tighter the overlap, the stronger the zone.

---

#### Turtle Soup

A counter-trend reversal model targeting stop-hunt setups. Price breaks a significant high or low (Previous Week High, Monthly High, or a clear equal-highs level) by just a few pips — triggering retail stop losses and breakout buyers — then immediately reverses. The entry is the snap-back after the false break, ideally with a FVG or OB printed on the reversal candle.

**Entry checklist:** Clear, obvious high or low that retail traders are watching → price breaks it by a small margin (not a big impulsive move) → immediate reversal candle with a FVG or OB → enter on return to the FVG/OB. Works best when the break happens into a HTF supply or demand area.

---

#### BOS + Retrace

The simplest continuation model. After a clean Break of Structure, wait for price to retrace to the nearest FVG or OB left by the BOS candle, then enter in the direction of the break. No liquidity sweep is required — the BOS itself is the signal. Best used in a trending market where structure is stacking in one direction.

**Entry checklist:** Clear BOS (not a CHoCH) on entry TF → identify the FVG or OB printed by the BOS leg → wait for price to pull back into it → entry inside the zone with HTF bias aligned. Avoid this model when HTF is ranging — the BOS is more likely to be noise.

---

### Supply & Demand (S&D) Models

S&D methodology focuses on the origin of a move. Every S&D setup is a zone — a price area where an institution placed a large order. The key questions are: is the zone fresh (untested), was the origin move impulsive (proving institutional intent), and is price approaching from the correct side?

---

#### Fresh Demand Zone

A demand zone is an area where price was previously accepted before a strong bullish impulse moved away. "Fresh" means price has not returned to test it yet. Institutions often leave unfilled orders in these zones, and price returns to collect them before resuming up.

**Entry checklist:** Identify the base (the consolidation or single-candle origin) before a strong bullish impulse → mark the zone from the top of the base to the bottom of the base → wait for price to return to the zone for the first time → enter on the first touch inside the zone, stop below the zone's low. Never trade a tested zone — once it has been visited, it is no longer fresh.

---

#### Fresh Supply Zone

The mirror of the Fresh Demand Zone. A supply zone is a price area where a strong bearish impulse originated. Institutions sell into strength — the supply zone is where they distributed their positions. Price returns to the zone to offer liquidity for their remaining orders.

**Entry checklist:** Identify the base before a strong bearish impulse → mark the zone from the bottom of the base to the top → wait for the first return to the zone → enter short on first touch, stop above the zone's high. Same freshness rule applies — a tested supply zone is a weaker zone.

---

#### Drop-Base-Rally (DBR)

A demand zone formation pattern. Price drops (bearish move), consolidates into a tight base, then rallies strongly (bullish impulse). The base between the drop and the rally is the demand zone. DBR is the most reliable demand zone pattern because the base shows clear institutional accumulation before the rally.

**Entry checklist:** Identify the down-move → find the tight consolidating base at the bottom → confirm the rally is impulsive (large range candles, little overlap) → mark the zone at the base → trade the return to the base from above. The drop confirms supply was present above; the rally confirms demand absorbed it.

---

#### Rally-Base-Drop (RBD)

The mirror of DBR — a supply zone formation. Price rallies, consolidates into a base, then drops sharply. The base is the supply zone where institutions distributed into retail buying. RBD is the textbook supply zone — the base shows distribution, the drop shows the result.

**Entry checklist:** Identify the up-move → find the consolidating base at the top → confirm the drop is impulsive → mark the supply zone at the base → trade the return to the base from below. The rally before the base confirms demand was present below; the drop confirms supply absorbed it.

---

#### Drop-Base-Drop (DBD)

A continuation supply zone. Price drops, consolidates briefly, then continues dropping. The base inside a downtrend is a supply zone — institutions paused to add more short positions before continuing the move down. Less powerful than RBD (no prior rally to confirm accumulation), but valid in a clear downtrend.

**Entry checklist:** Clear bearish HTF trend → price drops → consolidates briefly → continues lower → mark the base as a supply zone → trade the return to the base from below. Only use in confirmed downtrends — a DBD in a ranging market is not a valid setup. The prior drop is your trend confirmation.

---

#### Rally-Base-Rally (RBR)

A continuation demand zone. Price rallies, consolidates briefly, then continues higher. The base inside an uptrend is a demand zone — institutions added to their long positions during the pause. Mirror of DBD.

**Entry checklist:** Clear bullish HTF trend → price rallies → consolidates briefly → continues higher → mark the base as a demand zone → trade the return to the base from above. Only use in confirmed uptrends. The prior rally is your trend confirmation, not just a random candle.

---

### Quick comparison

| Model | Framework | Setup type | Best session | Key requirement |
|---|---|---|---|---|
| Liquidity Sweep → FVG | SMC | Reversal / entry | London, NY | Liquidity pool swept before entry |
| OB + BOS | SMC | Continuation | London, NY | Confirmed BOS before pullback |
| Liquidity → CHoCH | SMC | Early reversal | London, NY | Sweep + CHoCH — no prior BOS needed |
| SMT + OB | SMC | Reversal | London, NY | Correlated pair divergence confirmed |
| OB + FVG | SMC | Continuation / reversal | London, NY | OB and FVG overlap at same zone |
| Turtle Soup | SMC | Counter-trend reversal | London, NY | Small false break of obvious level — avoid Asia |
| BOS + Retrace | SMC | Continuation | Any | Clean trending structure, not ranging |
| Fresh Demand Zone | S&D | Reversal / continuation | London, NY | Zone untested — first return only |
| Fresh Supply Zone | S&D | Reversal / continuation | London, NY | Zone untested — first return only |
| Drop-Base-Rally (DBR) | S&D | Demand reversal | London, NY | Impulsive origin rally required |
| Rally-Base-Drop (RBD) | S&D | Supply reversal | London, NY | Impulsive origin drop required |
| Drop-Base-Drop (DBD) | S&D | Supply continuation | London, NY | Only valid in confirmed downtrend |
| Rally-Base-Rally (RBR) | S&D | Demand continuation | London, NY | Only valid in confirmed uptrend |

---

## Trend Matrix

Your weekly bias board. Set your directional view on each pair across all timeframes once a week, and the matrix keeps that context live while you trade.

### How it works

The matrix is a 5×5 grid — 5 pairs (EURUSD, GBPUSD, NZDUSD, XAUUSD, NAS100) across 5 timeframes (Monthly, Weekly, Daily, H4, H1). Each cell shows your current bias for that pair on that timeframe: bullish (teal ▲), bearish (coral ▼), or ranging (gold –).

**Click any cell** to cycle its bias. There is no save button — changes persist automatically to your browser's local storage across sessions.

### Confluence column

The rightmost column calculates alignment across all 5 timeframes for each pair:
- **4/5 or 5/5 aligned** — shows a filled progress bar in the dominant bias colour with a label like "4/5 Bullish"
- **3/5 or less** — shows "Mixed — no clear bias"

Pairs with 4+ TFs aligned appear as coloured chips in the "Clear bias" summary bar above the matrix — a quick at-a-glance signal of which pairs are tradeable that week.

### TF consensus row

The bottom row shows the dominant bias for each timeframe column across all 5 pairs — e.g., if 4 of 5 pairs are bearish on H4, the H4 consensus shows bearish. Useful for spotting macro sessions where everything is aligned.

### Analysis notes

Each pair row has a hidden note field. Click "Add analysis note" to type your weekly context (e.g., "DXY rejecting 104 supply — long EURUSD bias"). The note sits below the pair name in the row and is editable inline. Saves to localStorage alongside your bias.

### Weekly workflow

The platform shows a tip at the bottom: update the matrix Sunday night after your weekly review, then only trade models where your HTF bias agrees with the direction. If a pair is "Mixed," skip it and look for a pair with a clear bias.

---

## Economic Calendar

Stay ahead of volatility. The calendar shows real-time macroeconomic events powered by the **Tradays / MQL5 economic calendar widget** — the same data source used by most professional retail trading platforms.

### Widget

The calendar is an embedded iframe from Tradays. It shows events filtered for USD, EUR, GBP, NZD, and other major currencies with:
- Time (UTC), currency, event name, and impact level
- Forecast vs previous vs actual columns, updating in real time once figures are released
- Impact colour coding (low / medium / high)
- Configurable filters inside the widget itself

### Theme awareness

The widget automatically uses your platform theme. Switch between light and dark mode in the topbar — the calendar reloads with the matching theme instantly. No stale colours or mismatched backgrounds.

### No API key required

Tradays is free to embed. There are no paid tiers, no API keys, and no rate limits for this widget. The calendar shows live data immediately with zero backend configuration.

---

## Setup Alerts

Kondwani's live trade calls, delivered directly to the platform. Every alert is a fully specified setup reviewed against the SMC rulebook before posting.

### Alert cards

Each alert shows:
- **Pair, direction, and status badge** — Active (live), TP1 Hit, TP2 Hit, Stop Loss, or Cancelled
- **Planned R:R** — displayed prominently in gold
- **Price levels** — Entry, Stop Loss, TP1, and TP2 in a grid with colour-coded values
- **Mini chart** — a generated candlestick chart annotated with the setup's FVG zone, entry line, and BOS mark. Click the chart to expand it to full height.
- **Tags** — the SMC concepts in play (e.g., Sweep, FVG, OB, CHoCH)
- **Instructor note** — Kondwani's written analysis explaining the trade idea: what he saw, why the zone is valid, and what he's targeting

### Copy to journal

The "Copy to journal" button on each active alert copies the full setup — pair, direction, model, session, R:R, entry, SL, TP1, and the instructor note — into your journal as an open trade. The button changes to "In your journal" once copied and cannot be pressed again. Trades copied from alerts show a gold bell icon in the journal table row so you can track instructor-sourced performance separately.

### Status tracking

Alerts change status as the market moves: Active → TP1 Hit → TP2 Hit (or) → Stop Loss. Closed alerts are shown at reduced opacity and the copy button is replaced with the final outcome label.

### Filters

- **Status filter** — All / Active / Closed
- **Pair filter** — chips for each instrument

### Membership note

Pro and Funded Track traders receive alerts in real time. Free plan members see alerts with a 4-hour delay. This is enforced server-side when the API is wired.

### Smart details

- **Live indicator** — a pulsing teal dot in the header shows how many alerts are currently active
- **Time ago** — each card shows how long ago the alert was posted ("25m ago", "3h ago")
- The alert feed is designed so that in production it will be populated by Kondwani posting from an instructor dashboard (not yet built)

---

## COT Reports

The CFTC Commitments of Traders report — the most powerful free institutional data available to retail traders. Covers **10 instruments** with up to **37 years of history** seeded into Supabase. Released every Tuesday by the US government. No API key required. Data is stored in your own database and synced weekly — never depends on the CFTC API being reachable at page-load time.

---

### What is COT data?

The CFTC (Commodity Futures Trading Commission) requires large futures traders to report their positions every week. The platform uses the **Legacy Futures-Only** report — the same one used on tradingster.com and referenced by ICT. It breaks the market into three groups:

| Group | Who they are | How to read them |
|---|---|---|
| **Large Speculators** (Non-Commercial) | Institutional hedge funds, CTAs, prop desks — the "smart money" | Follow their direction. When they are net long a pair, they expect it to go up. When they add to a long position, conviction is growing. |
| **Commercials** | Corporations, banks, and multinationals hedging real-world currency exposure | Read them as a contrarian context. Commercials go short EUR futures when they expect EUR to rise (they're hedging receivables). So commercial net short = bullish confirmation for EUR. |
| **Small Speculators** (Non-Reportable) | Retail traders — positions too small to report individually | Often wrong at extremes. When retail is extremely net long, that can signal a reversal zone. Most useful as a sentiment gauge, not a signal. |

COT is **not** an entry signal. It is a **weekly HTF directional bias filter**. Use it to confirm or invalidate the direction you have set in your Trend Matrix. Never enter a trade against COT bias without a strong structural reason.

---

### Instruments covered (10)

| Pair | CFTC Contract | Notes |
|---|---|---|
| EURUSD | Euro FX | Direct — net long large specs = bullish EUR |
| GBPUSD | British Pound | Direct |
| AUDUSD | Australian Dollar | Direct |
| NZDUSD | NZ Dollar | Direct |
| USDJPY | Japanese Yen | **Inverted** — net shown is for USD pairs: positive = bullish USDJPY |
| USDCHF | Swiss Franc | **Inverted** — same as above |
| USDCAD | Canadian Dollar | **Inverted** — same as above |
| XAUUSD | Gold | Direct — large specs net long = bullish Gold |
| NAS100 | NASDAQ E-mini | Direct |
| DXY | USD Index | Direct — the master bias card. DXY net short = tailwind for all USD pairs simultaneously |

**USD-base pairs (USDJPY, USDCHF, USDCAD):** The CFTC reports positions for the foreign currency (Yen, Franc, CAD futures). On these cards, the platform inverts the net so that "positive = bullish on the USD pair" is consistent with how the other 7 cards work. Cards carry a grey "USD-base · inverted" badge as a reminder.

---

### The signal: how it is calculated

The COT signal on each card is determined by two things:

**1. Net position direction (the primary signal)**
- Large Spec net > 0 = they hold more longs than shorts = **bullish bias**
- Large Spec net < 0 = they hold more shorts than longs = **bearish bias**

This is the same number you see on tradingster.com under "Non-Commercial Net." It is calculated directly from CFTC data: `Long contracts − Short contracts`.

**2. Week-over-week momentum (adds conviction)**
- Net long AND adding longs this week → **Bullish Bias** or **Strong Bullish Setup**
- Net long but trimming longs → **Bullish Bias** (still positive, monitoring)
- Net long, reducing heavily from COT Index > 70 → **Neutral** (distribution zone)
- Net short AND adding shorts → **Bearish Bias** or **Strong Bearish Setup**
- Net short but covering → **Bearish Bias** (still negative)
- Net short, covering from COT Index < 30 → **Neutral** (potential accumulation)

**Signal badges on the card:**

| Badge | Meaning |
|---|---|
| 🟢 **Strong Bullish Setup** | Net long + adding longs + COT Index above 65 (historically elevated — trend well underway) |
| 🟢 **Bullish Bias** | Net long + adding longs at any Index level, OR net long and trimming |
| ⚪ **Neutral / Mixed** | Distribution at extreme high, or accumulation at extreme low, or insufficient weekly movement |
| 🔴 **Bearish Bias** | Net short + adding shorts, OR net short and covering |
| 🔴 **Strong Bearish Setup** | Net short + adding shorts + COT Index below 35 |

---

### COT Index (0–100) — the cycle gauge

The COT Index tells you **where in the past 52 weeks** current positioning sits. It is a **cycle position gauge**, not a direction indicator. Direction comes from the net sign.

```
COT Index = (Current Net − 52w Low) / (52w High − 52w Low) × 100
```

| Range | Label | What it means |
|---|---|---|
| 80–100 | Near Cycle High | Specs are near their most bullish of the past year. Watch for exhaustion if the move has already run far. |
| 65–79 | Elevated | Clear bullish bias within the annual cycle — trend likely has room. |
| 45–64 | Above Midpoint | Moderate bullish bias — steady positioning. |
| 35–44 | Below Midpoint | Moderate bearish bias within the cycle. |
| 20–34 | Near Cycle Low | Specs are near their most bearish of the past year. Potential reversal zone if weekly momentum turns. |
| 0–19 | At Cycle Extreme | Historically maximum short positioning — high-probability mean-reversion zone. |

**Key principle:** A COT Index of 30 does NOT mean "go short." It means specs are near the bottom of their annual range. If their absolute net is still positive (net long), they are still bullish — just less bullish than they were. The cycle gauge tells you where we are in the positioning cycle, not the direction.

The ring gauge on the card fills from 0–100. The ring colour matches the signal badge colour (teal for bullish, coral for bearish, gold for neutral).

---

### WoW Change

The number displayed top-right on each card. This is the change in Large Speculator net position from last week to this week:

```
WoW Change = Current Large Spec Net − Previous Week Large Spec Net
```

A large positive WoW change (e.g. +50K) means institutions aggressively added longs this week — high-conviction entry or continuation signal. A small WoW change near zero means positioning is flat — the market is waiting.

This maps directly to the "Changes" row on tradingster.com: `NC Long Change − NC Short Change`.

---

### Position breakdown (3 groups)

Below the COT Index ring, each group shows:
- **Net position** (large number) — positive = net long, negative = net short
- **WoW change** (smaller, colour-coded) — teal if adding in bullish direction, coral if reducing
- **Position bar** — extends right from centre for net long, left for net short, sized relative to the largest group on that card

---

### 8-week sparkline

The mini chart on the right side of each card shows Large Spec net positioning for the past 8 weeks, plotted chronologically (oldest left, newest right). **Teal line = net long pair. Coral line = net short pair.**

This chart answers: is smart money building a position (rising line) or unwinding (falling line)? A rising line that's still below zero means they're covering shorts — bearish bias is weakening. A rising line that's positive means bulls are loading — trend has momentum.

---

### Divergence analysis panel

The analysis bar below the position bars reads the relationship between Large Speculators and Commercials for that week. There are **four possible states:**

**1. Groups Aligned — High Conviction** (teal/coral panel)

Both large specs and commercials are moving in the same direction this week. This is the strongest COT signal.

*Bullish alignment:* Large specs added net longs AND commercials went more net short (they're hedging against upside = they expect the pair to rise). Both groups are confirming the bull.

*Bearish alignment:* Large specs reduced net longs (went more short) AND commercials reduced their short hedge (they no longer need to protect against upside = they expect the pair to fall).

**When you see this:** In sustained trending markets. It means the two most informed groups in the futures market agree on direction. Trade with it.

---

**2. Weekly Flow vs Structure — Watch Carefully** (gold panel)

This is a sub-state of "aligned" that appears when the weekly flow direction contradicts the COT Index level. Example: large specs are adding longs this week (bullish flow) BUT the COT Index is at 25 (historically very underweight). Both groups are aligned bullish, but specs are still in their annual bearish range.

The message explains the nuance: is this early accumulation before a reversal, or a temporary bounce in a broader downtrend? The guidance is to wait for the COT Index to cross 50 before calling it a confirmed bullish shift.

**When you see this:** At potential turning points — the first few weeks of a new trend direction, when specs have been running bearish/bullish for months and are starting to turn.

---

**3. Mixed — Consolidation or Transition** (gold panel)

The weekly change in Large Spec net is too small to be meaningful (below 1% of average position size). No directional conviction from either group this week.

**When you see this:** Holidays (Christmas, Thanksgiving, Eid weeks), the week before a major central bank decision (traders stay flat), low-volatility consolidation periods between major moves. Very common in quiet markets. Do not confuse low WoW change with a trend reversal — it's just a quiet week.

---

**4. Counter-Movement — Watch for Reversal** (gold panel)

Large specs and commercials are moving in opposite directions. This is the most complex signal and requires your own judgment.

*Example:* Large specs are adding longs BUT commercials are also reducing their short hedge (covering) at the same time. Specs think the pair is going up; commercials don't think it's going much higher (they're taking off their hedge). This is a potential exhaustion signal — smart money is buying but the hedgers who know the fundamentals best don't agree.

*Opposite example:* Large specs are selling while commercials go more short — both reducing exposure but for different reasons. Often seen in uncertain macro environments.

**When you see this:** Near potential turning points — major tops and bottoms. Commercials have the best fundamental knowledge of fair value. When they disagree with speculative flow, the market is at a decision point. Wait for CHoCH confirmation on HTF before trading.

---

### 4-week history table

Expandable section at the bottom of each card — click "4-Week Position History" to open it. Shows the last 4 weeks of net positioning for all three groups with the WoW change column highlighted. Use this to spot:
- **Acceleration** — WoW changes getting bigger week after week = trend momentum building
- **Deceleration** — WoW changes getting smaller = trend losing steam
- **Reversal** — net switches from positive to negative or vice versa

The table floats below the card as an overlay so expanding one card never affects the height of the cards beside it. All cards in a row stay uniform height regardless of which history tables are open.

---

### Data source and history depth

Data is stored in Supabase PostgreSQL, seeded from the CFTC Legacy Futures-Only report (dataset `6dca-aqww` on publicreporting.cftc.gov). No API key required — this is free US government data.

| Pair | History depth |
|---|---|
| GBPUSD, USDJPY, USDCHF, USDCAD, XAUUSD | ~37 years (since 1986) |
| AUDUSD | ~34 years |
| DXY | ~33 years |
| EURUSD, NAS100 | ~27 years |
| NZDUSD | ~22 years |

The COT Index is calculated using the past **52 weeks** from the database — a 1-year rolling window, which is the industry standard.

A weekly cron job (configured at cron-jobs.org) hits `POST /api/cot/sync` every Tuesday at ~16:00 EST, after CFTC publishes. The sync pulls the latest 8 weeks and upserts into Supabase. The `/api/cot` route serves data from Supabase — page load never depends on the CFTC API being reachable.

**Manual refresh:** The **Refresh** button on the COT page does a live sync — it POSTs to `/api/cot/refresh` (auth-protected, any logged-in user), which pulls the latest data from the CFTC API and upserts it into Supabase, then re-reads the DB so the cards update immediately. This is the correct way to get Friday's report without waiting for the Tuesday cron. The button is disabled while the sync is in progress, so double-clicking is safe. Every refresh writes to the DB — subsequent page loads show the updated data instantly without hitting CFTC again.

---

### Educational panel (bottom of page)

Three-step guide for using COT with SMC:
1. **Identify the bias** — is Large Spec net positive or negative? Are they adding?
2. **Check divergence** — are commercials confirming? "Groups Aligned" = highest conviction
3. **Confirm with price** — COT gives you the HTF filter. You still need a swept liquidity pool, valid OB or FVG, and a killzone entry

Also includes: DXY master bias note, extreme readings guide (reversal vs continuation), and data source details.

---

## Community

A trading-focused social feed for Smile FX Traders members. Share trades, analysis, wins, losses, and lessons.

### Feed
- Posts show pair, direction, win/loss result badges where tagged
- Like and comment on any post
- Instructor posts from Kondwani are highlighted with a gold banner and a verified tick
- Your new posts appear at the top of the feed immediately after posting (optimistic update)
- **Infinite scroll** — a "Load more" button at the bottom fetches older posts in pages of 20
- **Fully persisted** — posts, likes, and comments are stored in Supabase PostgreSQL. The feed survives refresh and is consistent across devices
- **Relative timestamps** — posts show "just now", "5m ago", "3h ago", "2d ago" — computed client-side from the stored UTC timestamp
- **Free plan members** are blocked from posting (403 from the API). Read-only community access is enforced server-side

### Compose box
Write and post directly from the top of the feed. Your name, handle, and avatar are auto-populated.

### Comments
Threaded comments below each post. Press Enter to submit. Your avatar appears next to the input.

### Leaderboard sidebar
Top 10 traders for the current calendar month, ranked by net R, showing win rate and cumulative R. Computed live from the trades database — minimum 3 trades required to appear. First place gets a gold badge. The leaderboard is hidden if no qualifying traders exist yet. Revalidates every 15 minutes (cached at the edge).

### Community stats
Live counters showing: total members, total trades logged on the platform, countries represented, and average win rate across the community.

### Guidelines panel
Five community rules are pinned in the sidebar — including the most important one: post losses as well as wins.

### Proactive decisions
The feed deliberately includes Kondwani's posts mixed with community posts to model the right kind of content — detailed analysis, honest loss posts, and teaching. This sets the culture from day one.

---

## Academy

Structured SMC curriculum organised into six courses, gated by membership tier.

### Courses
| Course | Tier | Lessons |
|---|---|---|
| Foundations of Smart Money | Free | 6 |
| Advanced SMC Models | Pro | 6 |
| Risk Management & Psychology | Pro | 5 |
| Reading the COT Report | Pro | 3 |
| Live Trade Reviews with Kondwani | Pro | 3 |
| Prop Firm Preparation | Funded Track | 4 |

### Course cards
Each card shows a colour-coded icon, tier badge, course description, lesson count, and a progress bar showing how many lessons you've completed. Locked courses (tier too low) show at reduced opacity with a lock icon.

### Lesson list
Click an open course to enter it. Each lesson shows: lesson number or a green checkmark if complete, title, duration, and a chevron. Click a lesson to expand a video player placeholder (ready for video upload).

### Progress tracking
Completed lessons are persisted to Supabase per user. When you open a lesson, a **"Mark as complete"** button appears. Clicking it saves progress to the database immediately. Completed lessons show a green checkmark in the list. Click again to mark incomplete — progress is always reversible. The course card progress bar and lesson count ("X of Y complete") update live from the database, so your progress is accurate across devices and after refresh.

### Plan gating
Free plan: Foundations only. Pro plan: all courses except Prop Firm Prep. Funded Track: everything. Enforced client-side with a server-side check once sessions are wired.

---

## Profile

Your personal performance dashboard and trading identity card.

### Identity card (left panel)
- Avatar, name, username, plan badge, level chip
- Streak indicator (gold flame + day count when active)
- Experience level, risk per trade, member since date

### Badges
Six badges displayed in a 3×3 grid: First Trade, 5W Streak, Rule Follower, +10R Club, Model Master, Funded. Earned badges are highlighted in teal/gold; unearned are greyed out. Hover for the unlock condition.

### Stats
Four live stat boxes: Net R (coloured by profitability), Win Rate, Discipline %, and trade count.

### Equity curve
Full-width sparkline of your cumulative R growth across all closed trades.

### Performance breakdown
Avg win vs avg loss, closed trade count, open trade count — in a two-column grid alongside a discipline ring gauge.

### Best model
Shows your highest-win-rate model, trade count, win percentage, and a filled progress bar — updated live from your journal.

---

## Settings

All configurable preferences in a clean two-column layout.

### Profile settings
Edit full name, username (@ prefix auto-shown), and email address. Save button at the bottom of the section.

### Appearance
Theme toggle — Light / Dark / System — using three-way SegRow. Preference saved via next-themes and persists across sessions.

### Trading preferences
- Default risk per trade (%) — pre-fills the journal modal every time you log a trade
- **Trading framework** — Smart Money Concepts or Supply & Demand. Sets the default framework in the journal log modal and the validator. Changing this in settings updates both tools immediately. Saved to your account in the database.
- Experience level — Beginner / Intermediate / Advanced — affects Academy content recommendations
- Instruments I trade — clickable pair chips that update your watchlist preference

### Notifications
Four toggles — Setup alerts, Community replies, Weekly performance report, Email alerts — each with a description of what triggers it. Preferences are saved to the database on every change and loaded on each visit — your notification settings persist across devices and sessions.

**Weekly performance email:** If "Weekly performance report" is enabled, Pro and Funded Track traders receive an automated email every Sunday summarising their week: trade count, win rate, net R, best model, and streak. The email is sent via Resend from `noreply@smilefxtraders.com` and matches the platform's dark design. The cron endpoint is `POST /api/emails/weekly-report` — configure a weekly job (Sunday 08:00 UTC) with your `CRON_SECRET` in the Authorization header.

### Privacy
Two toggles — Show on leaderboard, Show win rate publicly — control what other community members can see.

### Danger zone
"Delete account" button with a clear warning. Triggers a toast with the support email — actual deletion requires server confirmation to prevent accidents.

---

## Membership / Pricing

Three-tier pricing page with annual billing toggle, feature comparison, and FAQ.

### Plans

| Plan | USD/mo | ZMW/mo | Key features |
|---|---|---|---|
| **Starter** | Free | Free | 20 trades, read-only community, Foundations course |
| **Pro Trader** | $29 | K750 | Unlimited journal, live alerts, full Academy, AI review, community, COT, leaderboard |
| **Funded Track** | $79 | K2,000 | Everything in Pro + 1-on-1 mentorship with Kondwani |

### Annual billing
Toggle between monthly and annual. Annual saves 20% (price shown per month). "Save 20%" chip appears when annual is active.

### Plan cards
- Colour-coded by tier (grey / teal / gold)
- "Most popular" banner floats above the Pro card
- Complete feature list with green checks and greyed-out crosses
- CTA button matches tier: teal gradient for Pro, gold gradient for Funded Track
- Current plan shows a greyed-out "Current plan" button instead of a CTA

### Guarantee
"7-day money-back guarantee" banner before the FAQ.

### FAQ
Five accordion questions — Kwacha payments, cancellation, AI Review explanation, mentorship details, free trial. Expand/collapse on click.

### Checkout
The upgrade button fires a toast ("Redirecting to checkout…") — ready to connect to Stripe or Paystack when payment is wired.

---

## FX Option Expiries

Large institutional FX option positions expire every day at the **10am New York Cut** (15:00 UTC). These options are significant enough that the underlying spot market will often drift toward — and sometimes pin exactly at — an expiry level in the final hour before cut. The platform tracks these levels daily so your traders can cross-reference option clusters against their SMC setups before entering.

---

### What is the 10am NY Cut?

Every business day at 10:00am New York time, a massive volume of FX options expires simultaneously. Banks and institutions that have sold these options must delta-hedge their exposure, which creates predictable, repeatable price behaviour:

- **Pinning** — spot drifts toward an expiry level and stalls there as hedgers keep buying/selling to stay delta-neutral.
- **Snap** — once the option expires, the hedging flows stop instantly. Price can snap away hard from the pin level.
- **Magnet then rejection** — price is attracted toward the level, briefly touches it, then reverses sharply as the hedging unwinds.

The larger the notional size (in billions), the stronger the effect. A $1bn+ expiry at a price near spot is a significant technical event you need to know about before you trade.

---

### Data source

Data is scraped daily from **InvestingLive** (formerly ForexLive) — the most widely used source for this data among professional retail traders. InvestingLive publishes the table every weekday morning as a formatted image. The platform fetches that image and passes it to **Claude Vision (Haiku)** which extracts all levels into structured JSON and stores them in Supabase.

The data normally appears on InvestingLive between **7:30–9:00am New York time**. A daily cron job (via cron-jobs.org) runs at **9:00am ET (14:00 UTC)** Monday–Friday to fetch and store the day's data automatically.

---

### Pairs covered

Eight pairs are tracked and displayed:

| Pair | Pip size | Notes |
|---|---|---|
| EURUSD | 0.0001 | Highest option volume |
| GBPUSD | 0.0001 | |
| NZDUSD | 0.0001 | |
| AUDUSD | 0.0001 | |
| USDJPY | 0.01 | |
| USDCHF | 0.0001 | |
| USDCAD | 0.0001 | |
| XAUUSD | 0.1 | Gold levels often show significant notionals |

---

### The list page (`/fx-orders`)

The landing page shows every date stored in the archive as a card grid. Each card covers one expiry date and shows:
- **Date** in large font-display numbers (DD/MM), day name, and the NY Cut time label
- **Pair count** — how many pairs have expiry levels for that date
- **Level count** — total number of individual price levels stored
- **Pair chip row** — all tracked pairs shown as mono-font badges so you can see at a glance that data was captured

**Today's card** is highlighted with a teal border glow and a "Today" label.

**Stat strip** above the grid (once data exists):
- Total dates in archive
- Total levels stored across all dates
- Whether today has been synced yet
- Number of pairs tracked

---

### The detail page (`/fx-orders/[date]`)

Click any date card to open that day's full expiry data. All pairs are displayed as individual cards in a responsive grid.

#### Pair cards

Each pair card has three zones:

**Header** — pair label (e.g. "EUR/USD") on the left, current spot price and "spot" label on the right.

**Level list** — all expiry levels for that pair sorted high to low. Each row shows:
- A colour-coded dot (teal = above spot within 50 pips, coral = below spot within 50 pips, gold = large notional ≥$1bn, grey = unremarkable)
- **Price** in monospace tabular font
- **Notional size** (e.g. "580m", "1.4bn") — weight of the option
- **Pip distance badge** — a small chip showing how many pips away from spot the level is, only visible for near levels (≤50 pips). Teal badge = above spot, coral badge = below spot.

**Footer** — level count and "10am NY Cut" label, always pinned to the bottom of the card.

#### Colour code logic

| Colour | Condition | What it means |
|---|---|---|
| **Teal** (bright) | Level above spot, ≤50 pips away | Active resistance — price may be pulled toward this level |
| **Coral** (bright) | Level below spot, ≤50 pips away | Active support — price may be pulled toward this level |
| **Gold** | Notional ≥ $1bn | Large enough to cause a meaningful pinning effect at any distance |
| **Grey** | Far from spot, small notional | Background context — note it but don't trade it |

Pair cards with any near-level (within 50 pips) get a subtle teal border highlight so they stand out immediately in the grid.

#### Legend bar

A compact key strip below the page header explains all four colour states — useful when showing this page to newer traders.

#### Stats summary

Above the card grid: pair count, total level count, count of levels ≥$1bn, count of pairs with at least one near level, and the last sync time.

#### Source image

If the data was fetched via the daily sync (not a manual upload), the original InvestingLive image appears below the card grid with a link to open it directly. This lets traders cross-check the parsed data against the source table if anything looks off.

---

### How to interpret expiry levels (the instructor's framework)

**Step 1 — Identify near levels before the session starts**

Check `/fx-orders` before your London or New York session begins. For any pair you are watching, note whether there is a significant expiry level within 50 pips of the current spot price.

**Step 2 — Classify by notional**

- **< $500m** — note it, do not trade it as a standalone reason
- **$500m–$999m** — meaningful; combine with a POI confluence to take it seriously
- **$1bn+** — high-priority level; price is statistically likely to interact with it before 10am

**Step 3 — Cross-reference with your HTF bias and POI**

An expiry level alone is not a trade. It becomes high-conviction when it coincides with:
- An active Order Block or FVG on H1 or H4
- A previous-day high/low (PDH/PDL) acting as a draw-on-liquidity
- Your HTF bias pointing toward that level

**Step 4 — Trade the magnet, not the level**

If price is below a large expiry at 1.0850 and your H4 bias is bullish, look for a long entry on the H1 targeting 1.0850 as your TP1. The option hedging will push price toward that number. Do not set TP at 1.0851 — set it a few pips before (1.0840–1.0845) to account for slippage before the full pin.

**Step 5 — Watch for the snap after 10am**

Once the option expires, the hedging stops and price can move freely. If you are still in a trade at 10:01am, be aware of potential sharp moves away from the expired level. Many experienced traders reduce size or close partial position just before the cut.

---

### Practical examples

**Scenario A — Bullish setup confirmed by expiry**
You are watching EURUSD on H4 with a bullish bias. There is a $1.2bn expiry at 1.0850 today. Current spot is 1.0810. Your H1 shows a clean FVG between 1.0800–1.0808. You enter long at 1.0804, target 1.0848 (just below the expiry), SL below the FVG low. The option hedging acts as an extra draw to get you to target.

**Scenario B — Avoid trading against a large expiry**
You have a short bias on GBPUSD for the session. There is a $2.1bn expiry at 1.2700. Current spot is 1.2695. Going short here puts you directly against an enormous magnet pulling price up to 1.2700. Skip this setup or wait until after 10am when the expiry is gone.

**Scenario C — Snap play after cut**
NZDUSD has a $900m expiry at 0.6050. Spot pins exactly at 0.6050 at 09:55am. You note a bearish H4 bias and a supply zone just above. At 10:01am, when the option expires and hedging stops, you enter short off the rejection from 0.6052, targeting the next liquidity pool below.

---

### Manual sync and upload

The daily cron handles syncing automatically. But there are two manual options for edge cases:

**Sync Today** button (in the page header)
- Fetches today's InvestingLive page, extracts the FXO image URL from the HTML, sends it to Claude Vision, and stores the result.
- Use this if the cron ran early (before InvestingLive posted) or if you want to refresh mid-morning after the table was updated.
- If InvestingLive hasn't published yet (before ~7:30am ET), the button shows a 404 error — that's normal. Try again at 9am.
- **If you see a 403 error:** InvestingLive's bot protection is blocking the server-side fetch. This is a known limitation of automated scraping — use the **Upload Image** fallback instead. The error banner includes an "Upload image manually instead →" link that opens the upload modal directly.
- **If you see a 429 error:** You are being rate-limited. Wait a few minutes before retrying.
- The request is sent with realistic browser headers (Chrome User-Agent, Accept, Referer, Sec-Fetch headers) to pass basic bot checks, but some protection systems (Cloudflare) block server-side IPs regardless of headers.

**Upload Image** button (reliable fallback)
- Download the FXO table screenshot directly from InvestingLive in your browser, then upload it here.
- Claude Vision parses it exactly the same way as the auto-sync — all pairs, all levels, spot prices, notionals, bold highlights.
- This bypasses all bot protection entirely since you're doing the page fetch in your own browser.
- Useful whenever Sync Today fails, on weekends, or on public holidays when InvestingLive posts in unusual formats.
- The extracted data is stored with `imageUrl = "manual-upload"` so you can identify it later.

---

### Data freshness and storage

- **Retention:** All dates are stored permanently in Supabase (table: `fx_option_expiries`). The list page shows up to 60 trading days (~3 months) of history by default.
- **Upsert logic:** If a date is synced twice (e.g. the cron runs before InvestingLive posts, then you trigger a manual sync later), the second run overwrites with the new data. Nothing is duplicated.
- **Spot prices:** The spot price displayed on each pair card is the spot at the time the data was fetched (from the InvestingLive table). It will be slightly different from the live price — it is used only to compute pip distances at time of extraction.
- **Pip distance accuracy:** Because spot changes throughout the day, a level shown as "32 pips away" at 9:05am may be 60 pips away by the time a trader looks at the page. Pip distances are a snapshot, not live. Traders should cross-check against their broker's current price.

---

### Cron configuration

See `CRON.md` for the full setup guide. Summary:

| Setting | Value |
|---|---|
| Route | `POST /api/fx-orders/sync` |
| Schedule | Mon–Fri · 14:00 UTC (9:00am ET) |
| Auth header | `x-cron-secret: <your_secret>` |
| Timeout | 60 seconds (Claude Vision takes 10–20s) |
| Retry | 1 retry after 30 minutes (in case InvestingLive is slow) |
| Cost | < $0.01/day (Claude Haiku 4.5 image input) |

---

## Admin Panel

Accessible only to accounts with the `INSTRUCTOR` role. Kondwani can reach it via `/admin` — the sidebar shows an extra "Admin" nav group with four sub-pages. Non-instructors are redirected to `/dashboard` server-side; there is no client-side gating to bypass.

### Overview (`/admin`)

Platform-wide stats at a glance:

| Stat | What it shows |
|---|---|
| Total users | All registered accounts |
| Plan breakdown | Free / Pro / Funded Track split with percentages |
| Total trades logged | Across all users |
| Total community posts | Across all users |
| Recent signups | Last 10 accounts with join date and plan |

### Students (`/admin/students`)

Full user table with one row per account showing: name, username, email, plan badge, join date, trade count, and post count. Lets Kondwani see at a glance which members are active and which plans they're on.

### Alerts (`/admin/alerts`)

Table of all setup alerts ever posted, showing: pair, direction, model, status, planned R:R, post date, hit rate (percentage of journal trades copied from this alert that closed as wins), and copy count (how many traders copied it to their journal). Useful for measuring which alert types perform best.

### Academy (`/admin/academy`)

Lesson completion heatmap. Shows every lesson across all courses and how many users have marked it complete. Quickly identifies which lessons are most and least used — useful for knowing where to focus new content or where students are getting stuck.

---

## Coming soon

Modules planned or in progress:

| Module | Status | Notes |
|---|---|---|
| **Rules Validator** | ✅ Built | — |
| **Trend Matrix** | ✅ Built | — |
| **Economic Calendar** | ✅ Built + Live | Powered by Tradays/MQL5 iframe widget — real live data, no API key required, theme-aware |
| **Setup Alerts** | ✅ Built | — |
| **COT Reports** | ✅ Built + Live data ready | Full rebuild: COT Index gauge, 8-week sparkline, divergence analysis, 4-week history table, 7 instruments (EURUSD/GBPUSD/NZDUSD/AUDUSD/XAUUSD/NAS100/DXY). CFTC data auto-fetched — no API key needed. |
| **Community** | ✅ Built | — |
| **Academy** | ✅ Built | Upload lesson videos to enable playback |
| **Profile** | ✅ Built | — |
| **Settings** | ✅ Built | — |
| **Membership / Pricing** | ✅ Built | Wire Stripe/Paystack checkout to activate upgrades |
| **Gavo AI Trade Review** | ✅ Live | ANTHROPIC_API_KEY wired — Gavo reviews each trade against the appropriate rulebook: full 13-rule SMC rulebook for SMC trades, full 13-rule Supply & Demand rulebook for S&D trades. Framework is read from the trade record and the correct system prompt is selected automatically. Grade A+→D with verdict, what-you-did-well, areas-to-improve, and one framework-specific tip. Prompt-cached: the rulebook system prompt is cached at Anthropic for 5 minutes, reducing cost of repeated reviews by 90%. |
| **Live Price Ticker** | ✅ Live | TWELVE_DATA_API_KEY wired — Topbar shows live prices for EURUSD/GBPUSD/NZDUSD/XAUUSD/NAS100/DXY. Auto-refreshes every 60 seconds. "LIVE" indicator in topbar. |
| **FX Option Expiries** | ✅ Built + Live data ready | Daily 10am NY Cut option levels stored in Supabase. Auto-scraped from InvestingLive via Claude Vision (Haiku) every weekday at 9am ET. Manual sync and image upload supported. 8 pairs, pip-distance colour coding, source image display. Configure `CRON_SECRET` and set up the cron-jobs.org job as per CRON.md to go live. |

---

*Last updated: 13 Jun 2026 · Production build passing, zero TypeScript errors · Live: Supabase auth + trade persistence, Anthropic AI Review (SMC + S&D dual rulebook, prompt-cached), Twelve Data live price ticker, CFTC COT data, FX Option Expiries (Claude Vision + InvestingLive), Tradays economic calendar (live data, theme-aware), Resend weekly email reports · New: Admin panel (overview/students/alerts/academy), expectancy stat tile, validator killzone auto-detection, validator position size calculator, lesson progress DB persistence, community feed DB-backed with infinite scroll, notification preferences persisted to DB · Remaining: Stripe/Paystack payments, plan gating enforcement, skeleton loading polish · Built by Kondwani with Claude Code*
