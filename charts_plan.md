# Real Charts — Spotware trendbars + a clean chart surface

Status: **Plan. No code written.**

Goal: every candle on the platform is real broker data, every annotation is the
trade's own numbers, and the chart looks like a TradingView idea rather than a
dashboard widget.

---

## 1. Where we are

Three surfaces render charts, all from a seeded PRNG:

| Surface | File | Generator |
|---|---|---|
| `/dashboard` featured alert | `(app)/dashboard/Dashboard.tsx` | `buildFeaturedChart()` |
| `/alerts` per-card | `(app)/alerts/Alerts.tsx` | `buildChart()` |
| `/journal/[id]` (no screenshot) | `(app)/journal/[id]/page.tsx` | `genCandles()` |

All three feed `components/ui/CandleChart.tsx` (lightweight-charts 5.2.0).

Two things are wrong, and the second is worse than the first:

**The prices are invented.** `mulberry32(hash(id))` random walk seeded off the
record id, so it's stable across reloads and reads as real. `PAIR_START` pins
EURUSD at 1.085 — roughly right whenever the prototype was written, ~7 cents
off today.

**The annotations are invented too, and at fixed indices:**

```ts
const zones_ = [{ i0: 22, i1: 26, ... }];             // FVG always candles 22–26
const lines_ = [{ price: cs[27].o, label: "Entry" }];  // entry always candle 27
const marks_ = [{ i: 42, label: mt.toUpperCase() }];   // BOS/CHoCH always candle 42
```

So a Liquidity Sweep → FVG trade and an OB + BOS trade get identically-placed
annotations on differently-seeded noise. On `/alerts` this sits directly under
Kondwani's real entry/SL/TP, which makes it read as the setup being called.
The "Entry" line is drawn at a random candle's open, not at `alert.entryPrice`.

Everything below exists to delete that.

---

## 2. What "clean" means here

From the TradingView reference: the chart is the hero, and almost everything
else is removed. Concretely, against what `CandleChart.tsx` does today:

| Now | Target |
|---|---|
| Grid lines both axes | No vertical grid; horizontal barely visible or gone |
| Bordered price + time scale | Borderless |
| Zones drawn as **two full-width price lines** each | One bounded translucent rectangle |
| Axis label on every zone boundary | Labels only on entry / SL / TP |
| Crosshair always on | On detail views; off on cards |
| Time axis with `timeVisible: true` | Sparse date ticks, no clock |

**The single biggest visual win is subtraction, not the library.** One FVG zone
currently draws four full-width horizontal lines (hi + lo, plus axis labels).
That is the noise. A real bounded box is both more correct and quieter.

lightweight-charts 5.2.0 supports this properly — `attachPrimitive` and
`ISeriesPrimitive` are in the installed typings (`dist/typings.d.ts:2591`), so
a zone can be a real rectangle spanning a time range, not a pair of lines
spanning the whole chart.

---

## 3. Data layer — Spotware trendbars

### 3.1 Messages to add (`lib/spotware/messages.ts`)

Verified against `spotware/openapi-proto-messages`. The payload IDs there for
messages we already implement (2114/2115/2127/2128/2131) match the file exactly,
which is good evidence the rest is right.

```
PROTO_OA_GET_TRENDBARS_REQ = 2137
PROTO_OA_GET_TRENDBARS_RES = 2138

ProtoOAGetTrendbarsReq { ctidTraderAccountId=2, fromTimestamp=3,
                         toTimestamp=4, period=5, symbolId=6, count=7 }
ProtoOAGetTrendbarsRes { ctidTraderAccountId=2, period=3, trendbar=5 (repeated),
                         symbolId=6, hasMore=7 }
ProtoOATrendbar { volume=3, period=4, low=5, deltaOpen=6,
                  deltaClose=7, deltaHigh=8, utcTimestampInMinutes=9 }

ProtoOATrendbarPeriod: M1=1 M2=2 M3=3 M4=4 M5=5 M10=6 M15=7 M30=8
                       H1=9 H4=10 H12=11 D1=12 W1=13 MN1=14
```

OHLC reconstruction (per the proto's own comments):

```
open  = low + deltaOpen
close = low + deltaClose
high  = low + deltaHigh
```

then divide by `PRICE_SCALE` (100_000), the same constant the spot path
already uses. `utcTimestampInMinutes * 60` gives the bar's open time in
seconds, which is what lightweight-charts wants for `Time`.

### 3.2 The hard part — request/response correlation

`SpotwareFeed` today is **fire-and-forget**: it writes requests and broadcasts
whatever comes back. Trendbars need the opposite — a caller must `await` the
response to *its* request.

The envelope already carries `clientMsgId` (field 3), which is currently never
set. Plan:

- Set a `clientMsgId` on outgoing trendbar requests.
- Hold `pendingRequests: Map<string, { resolve, reject, timer }>` in the DO.
- In `handleFrame`, route `OA_GET_TRENDBARS_RES` by the frame's `clientMsgId`
  rather than by payload type alone. `decodeFrame` currently discards field 3
  and will need to return it.
- Time out after ~10s and reject, so a lost response can't leak a promise.
- `OA_ERROR_RES` carrying a `clientMsgId` must reject the matching request
  rather than only logging.

This is genuinely the riskiest piece — it changes the DO from a broadcaster
into a request broker, and it has to not disturb the spot stream that the
ticker and the expiry cards now depend on.

### 3.3 Limits (confirmed)

- **14,000 bars** hard cap per request.
- **5 historical requests/sec per connection.**
- Per-period max window between `fromTimestamp`/`toTimestamp` exists but is
  **not publicly documented per period** — establish empirically and record the
  findings here. Design for `hasMore` and paginate rather than assuming.

At the sizes we need (200–400 bars per chart) neither cap binds, but the 5/sec
rate limit does matter if a `/alerts` page with 20 cards each fires its own
request. That is an argument for caching hard and batching by symbol.

### 3.4 Caching

Closed candles are immutable — only the most recent bar changes. So:

- Cache key: `symbolId : period : fromBar : toBar`.
- Store in the DO's SQLite storage, or Postgres if we want them queryable.
  Leaning DO storage: it's next to the connection and needs no schema.
- HTTP: `s-maxage` tied to the period (H1 → 60s is plenty; D1 → an hour).
- Never cache the currently-forming bar as if it were closed.

A trade from March needs the same 200 H1 bars every time anyone opens it —
that should be one Spotware request, ever.

### 3.5 Symbol mapping

`Instrument` already has `symbol` and `tdSymbol`. Add `ctidSymbolId Int?` and
populate it from the `ProtoOASymbolsListRes` the DO already receives on connect
(it currently builds `symbolById` in memory and throws it away on disconnect).

Unresolved symbols must produce *no chart*, never a fabricated one — the same
rule the FX spot route follows.

---

## 4. API surface

```
GET /api/candles?pair=EURUSD&period=H1&from=<iso>&to=<iso>
  → { candles: [{ time, o, h, l, c }], period, partial: boolean }
```

- Auth required (unlike `/api/fx-orders/spot`, this is a genuine cost centre).
  Note the open question in §8 first.
- Server → DO via the binding, same pattern as `lib/spotware/snapshot.ts`.
- On any failure return an explicit error, **not** an empty array — the empty
  array masquerading as success is the exact bug that hid Academy, alerts and
  the expiry spot prices.
- Client consumes via React Query, like everything else now does.

---

## 5. Chart component

Rewrite `components/ui/CandleChart.tsx`:

- **Props change from generated candles to a query.** `<TradeChart trade={…} />`
  and `<AlertChart alert={…} />` wrappers own the fetch + annotation build;
  `CandleChart` stays dumb and takes real data.
- **Zone rectangles** via an `ISeriesPrimitive` implementation
  (`components/ui/chart/ZonePrimitive.ts`) — bounded in both time and price,
  filled at ~8% opacity in `--teal`/`--coral`.
- **Real annotations** from the record:
  - `Trade.entryPrice` / `stopLoss` / `takeProfit` — all nullable, so draw only
    what exists.
  - `Alert.entryPrice` / `stopLoss` / `tp1` / `tp2` — required except `tp2`.
- **Fix the re-render bug** in `journal/[id]`: `annotations={{ zones, lines, marks }}`
  is a fresh object literal every render and sits in the effect's dependency
  array, so the chart is destroyed and rebuilt constantly. Dashboard and Alerts
  memoise and don't have this.
- Keep all colours tokenised (`--teal`, `--coral`, `--gold`), per CLAUDE.md.

---

## 6. Per-surface application

**`/journal/[id]`** — the clearest win. Window the candles around `trade.date`
→ `closedAt ?? date + N`, and draw the trader's actual entry, stop and target.
This turns a decorative panel into a review tool: where price actually went
versus where they said it would.

**`/alerts`** — same treatment against `postedAt`. Because alert status
advances (`ACTIVE → TP1 → TP2 → SL`), the chart also becomes the record of
whether the call worked. That is the TradingView "Trade active / tp1 hit"
timeline in the reference screenshots.

**`/dashboard`** — featured alert; falls out of the alert work for free.

**Card size.** At `height: 100` an `/alerts` card chart is illegible — the
TradingView grid thumbnails are roughly 440×240. Either enlarge the collapsed
state or drop to a sparkline on cards and keep the real chart for expanded.
Worth deciding before building, not after.

---

## 7. Failure modes

| Case | Behaviour |
|---|---|
| Spotware down / DO cold | Skeleton, then a quiet "chart unavailable" — never fake candles |
| Trade older than available history | Fall back to a coarser period (H4/D1); if still nothing, no chart |
| Pair not in the broker's symbol list | No chart. Explicitly not a fallback to noise |
| Trade has no entry/SL/TP | Draw the candles, skip the missing lines |
| Trade has `chartUrl` | Keep showing the screenshot — it's the trader's own mark-up |

The governing rule: **a missing chart is fine, an invented one is not.** That is
the whole point of the exercise.

---

## 8. Open questions

1. **Auth on `/api/candles`.** I gated `/api/fx-orders/spot` today, it rejected
   the page's own authenticated fetch, and I reverted it without finding out
   why. That mechanism is unexplained and will bite this route the same way.
   **Resolve the gate bug before building anything that depends on auth.**
2. **How far back do IC Markets trendbars actually go**, per period? Determines
   whether historical journal entries get charts at all.
3. **Collapsed alert card**: bigger chart, or sparkline?
4. Do we want the TradingView *idea* format for alerts more broadly — chart +
   written analysis + status timeline + comments? The screenshots suggest yes,
   but that's a community-feature change, not a charting one, and should be
   planned separately.

---

## 9. Sequencing

1. **Delete the fake generators** and ship "no chart" in their place. One
   commit, immediately honest, unblocks everything else. Do this even if the
   rest slips.
2. Resolve the auth-gate mechanism (blocker for §4).
3. Trendbar messages + parser, with unit-level checks against known bars.
4. Request/response correlation in the DO — the risky one; verify the spot
   stream is undisturbed.
5. `ctidSymbolId` on `Instrument`, populated from the symbols list.
6. `/api/candles` + cache.
7. `CandleChart` rewrite: clean visual pass + zone primitive + real annotations.
8. Apply to journal → alerts → dashboard.

Steps 1 and 7 are independently valuable: the visual cleanup improves the
component whether or not real data has landed behind it yet.

---

## Sources

- [Spotware openapi-proto-messages](https://github.com/spotware/openapi-proto-messages) — message/enum definitions
- [Attain symbol data — cTrader Open API](https://help.ctrader.com/open-api/symbol-data/)
- [cTrader Open API messages reference](https://help.ctrader.com/open-api/messages/)
- [Lightweight Charts — Series Primitives](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives)
- [Lightweight Charts — Rectangle drawing tool example](https://tradingview.github.io/lightweight-charts/plugin-examples/plugins/rectangle-drawing-tool/example/)
