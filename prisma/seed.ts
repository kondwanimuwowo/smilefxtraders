import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

// ── Course + lesson data ──────────────────────────────────────────────────────

const COURSES = [
  {
    slug:        "foundations-of-smart-money",
    title:       "Foundations of Smart Money",
    description: "The complete beginner-to-intermediate ICT curriculum. Market structure, liquidity, and the three key models.",
    tier:        "free",
    icon:        "school",
    color:       "var(--teal)",
    order:       1,
    published:   true,
    lessons: [
      {
        slug:     "what-is-smart-money",
        title:    "What is Smart Money? The institutional edge explained",
        duration: "18 min",
        order:    1,
        published: true,
        level:    1,
        summary:  "Introduction to Smart Money Concepts and institutional trading.",
        points:   ["Who the smart money is", "Why retail traders lose", "The institutional edge"],
        body: `# What is Smart Money? The Institutional Edge Explained

## What you'll learn
- Who the "smart money" actually is and why their actions move markets
- Why retail traders are consistently on the wrong side of the market
- How ICT methodology gives you an institutional edge as a retail trader

## Who is the Smart Money?

Smart money refers to the large institutional participants in the forex and financial markets — central banks, hedge funds, commercial banks, investment banks, prop trading firms, and sovereign wealth funds. These are entities that trade in sizes measured in billions, not thousands.

When a hedge fund needs to buy 500 million euros, they cannot simply place a market order. That would move the market significantly against them. Instead, they engineer price to the levels where they already have pending orders — areas where opposing liquidity exists. This is the core of Smart Money Concepts.

The retail trader, by contrast, is reacting to price. They see a pattern, place an order, and hope. The institutional trader is *creating* the price move. Understanding this distinction is the beginning of trading differently.

## Why Retail Traders Consistently Lose

The statistics are brutal. Studies consistently show that over 70–80% of retail forex traders lose money. The reason is not lack of intelligence — it is that retail traders are taught patterns and indicators designed by retail educators who were themselves retail traders. The patterns they teach — head and shoulders, double tops, MACD crossovers — are known to institutions and are actively hunted.

Consider the stop loss. Retail traders are taught to place stops just below support or above resistance. This creates a predictable concentration of orders at those levels. When price sweeps those levels and triggers those stops, it is not random — it is institutional order filling. The institution needed to buy; retail provided the liquidity at the sweep low.

This is not conspiracy. It is market microstructure. Liquidity must come from somewhere, and retail stop orders are the most predictable source.

## The ICT Methodology

ICT (Inner Circle Trader) is a framework developed over decades of studying how institutional price delivery works. The core insight is that price does not move randomly — it moves to specific levels to accomplish specific goals: collecting liquidity, delivering price to a fair value zone, and reaching the next draw on liquidity.

The Smile FX Traders system is built on this foundation. Everything in the rulebook — FVGs, Order Blocks, BOS, CHoCH, killzones — is a specific manifestation of institutional order flow. When you understand why price moves, you can anticipate where it is going next instead of chasing where it has been.

## How to apply it

As you progress through this course, you are building a mental model shift. Start practising this exercise:

1. Look at any recent price move on the daily chart of EURUSD
2. Ask: "Where is the liquidity above or below current price?" (Look for equal highs, equal lows, previous day highs and lows)
3. Ask: "Where would price need to go to collect that liquidity before making a real move?"
4. Watch how price actually behaves relative to those levels over the coming days

This exercise alone — done consistently for two weeks — will change how you see a chart forever.

## Common mistakes

- Thinking "smart money" is one entity with a plan. It is the collective result of large institutions all seeking liquidity at similar levels
- Expecting every move to make perfect sense immediately. Price delivery is a process over hours and days, not minutes
- Applying these concepts without context. Killzones, session biases, and HTF structure all matter equally

## Key takeaways
- Smart money participants are institutions that trade at sizes that physically move markets
- Retail patterns fail because institutions know them and use them as liquidity sources
- ICT methodology maps how institutional order flow creates the price moves we see on charts`,
      },
      {
        slug:     "market-structure-bos-choch",
        title:    "Market structure: BOS, CHoCH, and why they matter",
        duration: "22 min",
        order:    2,
        published: true,
        level:    1,
        summary:  "Understanding market structure shifts and their significance.",
        points:   ["Break of Structure (BOS)", "Change of Character (CHoCH)", "Trading with structure"],
        body: `# Market Structure: BOS, CHoCH, and Why They Matter

## What you'll learn
- How to correctly identify swing highs and lows on any timeframe
- The difference between a Break of Structure (BOS) and a Change of Character (CHoCH)
- How to use structure to determine bias before you look for an entry

## Reading Market Structure

Market structure is the framework that tells you whether price is in an uptrend, downtrend, or range. Before you look for any entry model — FVG, OB, sweep — you need to establish structure first. Entering without structure context is guessing.

An **uptrend** on the entry timeframe is defined by a series of Higher Highs (HH) and Higher Lows (HL). Each swing high is higher than the last; each pullback makes a higher low. Price is in a bullish delivery phase.

A **downtrend** is defined by Lower Highs (LH) and Lower Lows (LL). Each rally fails at a lower level; each drop makes a new low. Price is in a bearish delivery phase.

A **range** is when neither pattern is clear — highs and lows are roughly equal. This is the hardest environment to trade and often means you should wait.

## Break of Structure (BOS)

A Break of Structure confirms that the current trend is continuing. In a bullish market structure, price pulls back, forms a Higher Low, then breaks above the previous swing High — this is a BOS. It confirms the trend and is your signal to look for long entries on the next pullback.

In a bearish structure, price rallies to form a Lower High, then breaks below the previous swing Low — a bearish BOS. Look for shorts on the next rally.

The key characteristic of a BOS is that it happens *with* the existing trend. It is a continuation signal, not a reversal.

## Change of Character (CHoCH)

A Change of Character is the first signal that the trend may be reversing. In a bullish trend, a CHoCH occurs when price breaks *below* the most recent Higher Low — this is the first lower low, and it suggests the bullish structure may be ending.

In a bearish trend, a CHoCH occurs when price breaks *above* the most recent Lower High — the first higher high in a downtrend.

The critical rule: a CHoCH alone is not a trade signal. It is a warning. You need confluence — a sweep of liquidity, a valid POI, and session alignment — before acting on a CHoCH. Many traders get burned by fading a strong trend on the first CHoCH only to see price resume the original direction.

## Why Structure Determines Your Bias

Your bias is the direction you are willing to trade. If the daily chart shows bullish structure (HH HH HL HL), your bias is long. You will only look for buy setups on the H1 or H4. You will ignore short setups, no matter how good they look in isolation, because they conflict with the higher timeframe picture.

This is what Kondwani means when he says "HTF first, entry TF second." The daily and H4 tell you the story. The H1 and M15 tell you where to enter.

## How to apply it

1. Open EURUSD on the daily chart. Mark every swing high and swing low over the last 30 days
2. Label each as HH, HL, LH, or LL
3. Identify the most recent BOS — which direction did it confirm?
4. Drop to the H4. Does the H4 structure agree with the daily? If yes, you have HTF alignment
5. Only then look for entries in the confirmed direction on H1

## Common mistakes

- Marking every wick as a swing high/low. Use bodies + significant wicks; ignore minor impulses
- Calling a CHoCH a reversal immediately. Wait for the next move to confirm before trading the new direction
- Ignoring HTF structure when a lower timeframe setup looks compelling

## Key takeaways
- BOS confirms trend continuation — look for entries in the BOS direction on pullbacks
- CHoCH signals a potential reversal — treat it as a warning, not a trade
- Structure is the foundation. Never look for an entry without establishing structure context first`,
      },
      {
        slug:     "liquidity-equal-highs-lows",
        title:    "Liquidity: equal highs, equal lows, and stop hunts",
        duration: "20 min",
        order:    3,
        published: true,
        level:    1,
        summary:  "Understanding how institutions use liquidity pools.",
        points:   ["What liquidity is", "Equal highs and equal lows", "Stop hunt mechanics"],
        body: `# Liquidity: Equal Highs, Equal Lows, and Stop Hunts

## What you'll learn
- What "liquidity" means in the context of Smart Money trading
- How to identify liquidity pools on a chart
- Why price sweeps these levels before making its real move

## What is Liquidity?

In financial markets, liquidity is the pool of pending orders at a given price level. For a large institution to fill a buy order for hundreds of millions, they need sellers at that price. And for a large sell order, they need buyers. Retail traders' stop losses and pending orders are the most predictable source of that liquidity.

When price "sweeps" a level — briefly breaks through and immediately reverses — it is collecting those orders. The institution triggered the stops of traders on the wrong side, filled their own position, then price moved in the direction the institution intended.

This is the foundational concept behind every model in the Smile FX rulebook. The sweep is the fuel. The model is how you enter after the fuel is collected.

## Equal Highs and Equal Lows

Equal Highs (EQH) are two or more swing highs at approximately the same price level. Every retail trader can see them; every retail trader places their buy stop just above them. This creates a predictable cluster of buy orders above those highs.

Equal Lows (EQL) are the mirror image — two or more swing lows at the same level, with retail sell stops just below them.

These are the highest-probability liquidity pools on any timeframe. When you see equal highs on the H4, you know two things: (1) retail traders have buy stops clustered just above them, and (2) if the daily bias is bearish, price is highly likely to make a brief move above those highs to collect that liquidity before reversing hard.

## Other Liquidity Pools

Beyond EQH/EQL, high-probability liquidity sits at:

- **Previous Day High (PDH) and Previous Day Low (PDL)** — the most commonly watched levels by retail traders
- **Previous Week High/Low** — especially relevant for swing traders
- **Session highs and lows** — the Asian range high/low are classic liquidity pools for the London session
- **Round numbers** — 1.0900, 1.1000, 1.0850 etc. attract retail stops

When multiple liquidity types coincide at the same level (e.g. PDH aligns with EQH), the level becomes extremely significant.

## Stop Hunt Mechanics

A stop hunt follows a predictable pattern. On a bearish daily structure:

1. Price rallies during the Asian session or early London into the EQH / PDH level
2. A brief wick prints above those highs — stops triggered, buy orders filled
3. Price reverses hard and moves lower
4. The momentum candle leaving the sweep often contains the FVG or OB you will enter on

The critical insight: the sweep is not a random spike. It is the delivery mechanism for institutional buying (on a sweep of lows) or selling (on a sweep of highs). Once you identify the sweep and the structure context, you know exactly where to look for your entry.

## How to apply it

1. On XAUUSD H4, look for the two or three most obvious equal highs or equal lows visible to any chart reader
2. Note which direction the daily bias points
3. Watch whether price makes a brief move *into* those highs (if bearish bias) or lows (if bullish bias) before reversing
4. Mark the candle that swept the level — this candle's body or the FVG it created is often your entry zone

## Common mistakes

- Confusing a legitimate breakout with a stop hunt. A real breakout closes strongly above the level; a sweep wicks through and immediately reverses
- Marking too many levels. Focus on the most obvious ones — the ones every retail trader can see
- Trying to enter *during* the sweep. Wait for the reversal candle to confirm the sweep is complete

## Key takeaways
- Liquidity pools are clusters of pending orders and stop losses that institutions target
- Equal Highs/Lows, PDH/PDL, and session highs/lows are the most significant pools
- The sweep is deliberate — price collects liquidity before delivering in the true direction`,
      },
      {
        slug:     "fair-value-gaps",
        title:    "Fair Value Gaps — identifying and trading imbalances",
        duration: "25 min",
        order:    4,
        published: true,
        level:    1,
        summary:  "How to find and trade Fair Value Gaps.",
        points:   ["What creates an FVG", "How to draw FVG zones", "Entering on FVG retracement"],
        body: `# Fair Value Gaps — Identifying and Trading Imbalances

## What you'll learn
- What a Fair Value Gap is and why it forms
- How to correctly identify and draw FVG zones on your chart
- How to enter trades using FVG retracements with precision

## What is a Fair Value Gap?

A Fair Value Gap (FVG) is a three-candle pattern that represents a price imbalance — a zone where price moved so aggressively that not all orders were filled. On a bullish FVG, the gap exists between the wick of the first candle and the wick of the third candle, with the second candle being the large momentum candle that drove price through.

Think of it this way: when price moves from 1.0800 to 1.0850 in one large candle, orders between those levels were not filled at their requested prices. The market is "imbalanced" in that zone. Price has a strong tendency to return to these zones to fill those orders — to re-balance.

This is not retail support and resistance. It is not a pattern. It is the mechanical result of institutional order flow leaving an imbalance that the market will seek to correct.

## How to Draw an FVG

For a **bullish FVG**:
1. Identify a three-candle sequence where the middle candle is a large bullish candle
2. The FVG zone is drawn from the **high of candle 1** (the wick tip of the first candle before the impulse) to the **low of candle 3** (the wick base of the first candle after the impulse)
3. If the wicks of candles 1 and 3 overlap, there is no FVG — the imbalance was filled during the move itself

For a **bearish FVG**:
1. Identify a three-candle sequence with a large bearish middle candle
2. The zone is from the **low of candle 1** to the **high of candle 3**

The most valid FVGs are those that form during a clean, impulsive structural move — a BOS candle or the first leg after a liquidity sweep. FVGs that form in choppy, overlapping price action are less reliable.

## Which FVGs Are Valid?

Not all FVGs are equal. The highest-probability FVGs share these characteristics:

- **Formed during a structural move** — created as part of a BOS or CHoCH leg, not random chop
- **Located in the direction of the HTF bias** — a bullish FVG in a bullish HTF structure
- **Fresh** — price has not yet returned to the zone
- **Size** — a meaningful imbalance, not a tiny two-pip gap

When an FVG also overlaps with an Order Block, the confluence makes it a premium entry zone. We call this an OB+FVG setup — covered in Advanced SMC Models.

## Entering from an FVG

The entry process:
1. Identify the FVG after the structural move (BOS or sweep)
2. Wait for price to retrace into the FVG zone — specifically, the midpoint or the low of the zone for a bullish FVG
3. Look for a rejection sign (a wick, engulfing candle, or a lower-timeframe CHoCH) inside the zone
4. Enter with stop loss below the FVG low (bullish) or above the FVG high (bearish)
5. Target the next draw on liquidity — the liquidity pool that the original impulse was heading for

## Common mistakes

- Entering FVGs that form in choppy sideways price action — these are not valid
- Entering immediately as price touches the FVG without waiting for a reaction or lower-TF confirmation
- Trading FVGs that are multiple sessions old and have been "stale" for too long — probability decreases as time passes
- Forgetting HTF context: an FVG in a bearish H4 structure is not a buy signal regardless of how clean the zone looks

## Key takeaways
- An FVG is a three-candle imbalance zone where price moved too fast to fill all orders
- Draw from the wick of candle 1 to the wick of candle 3
- The highest-probability FVGs form during clean structural moves and align with HTF bias
- Wait for price to return to the zone and show a reaction before entering`,
      },
      {
        slug:     "order-blocks",
        title:    "Order Blocks — the last opposing candle before the BOS",
        duration: "19 min",
        order:    5,
        published: true,
        level:    1,
        summary:  "Identifying and trading Order Blocks.",
        points:   ["What an Order Block is", "How to draw the OB", "OB confluence with BOS"],
        body: `# Order Blocks — The Last Opposing Candle Before the BOS

## What you'll learn
- The precise definition of an Order Block and why it forms
- How to identify and draw Order Blocks correctly on your chart
- How to use OBs as high-probability entry zones with structure confirmation

## What is an Order Block?

An Order Block (OB) is the last opposing candle (or cluster of candles) before a significant Break of Structure. It represents the area where institutional orders were placed that caused the subsequent structural move.

In a bullish OB: before price breaks a significant high (BOS), the last bearish (down-close) candle or the last cluster of bearish candles before the impulse is the OB. This is where institutions were buying while price was still appearing to move lower — disguising their accumulation.

In a bearish OB: the last bullish candle before a bearish BOS. Institutions were selling while price was making a final rally, trapping late buyers.

When price returns to the OB zone, it is returning to an area where the same institutions have pending orders — the original orders that caused the breakout. They reload at those levels.

## How to Draw an Order Block

**Bullish OB** (for buying):
1. Find a BOS to the upside — a clear break above a significant swing high
2. Look back at the candles immediately before the impulse that caused the BOS
3. Find the last bearish (red/down) candle before the BOS impulse begins
4. The OB zone is from the **open to the high** of that last bearish candle (the body + upper wick)
5. Some traders use a wider definition: the range of the last 1–3 bearish candles

**Bearish OB** (for selling):
1. Find a bearish BOS — price breaking below a significant swing low
2. Last bullish (green/up) candle before the impulse
3. OB zone: from the **open to the low** of that candle

The most important rule: the OB is only valid if the BOS that followed it was significant — not every small candle before a minor move is an OB.

## OB + BOS Confluence

The setup is:
1. A clear BOS on your entry timeframe
2. Price pulls back to the OB zone
3. Entry inside the OB, stop below the OB low (bullish) or above the OB high (bearish)
4. Target: the next liquidity pool in the BOS direction

This is one of the seven models in the Smile FX rulebook and is arguably the most reliable for continuation trades. The reason: the institution placed orders at the OB level that caused the BOS. When price returns to that level, they fill the same position again at a better price.

## Mitigation

An OB is "mitigated" when price trades through the entire zone — through the open of that last opposing candle. A mitigated OB loses its significance. You should not trade a mitigated OB.

A partially visited OB (price entered but did not fully close through) can still be valid. Watch for a reaction.

## How to apply it

1. Find a recent clear BOS on GBPUSD H1
2. Identify the last bearish candle before the impulse that caused the BOS
3. Mark that candle's range as your OB zone
4. Set a price alert at the OB zone
5. When price returns, drop to the M15 and look for a CHoCH or FVG inside the OB — that is your entry trigger

## Common mistakes

- Marking OBs before insignificant structure moves — only valid OBs follow meaningful BOS
- Trading a mitigated OB — once price closes through the open of the OB candle, it is done
- Using OBs without structure context — an OB in a range is not the same as an OB after a clean BOS

## Key takeaways
- The OB is the last opposing candle before a significant Break of Structure
- Draw from the candle's open to its high (bullish OB) or open to low (bearish OB)
- The OB is valid until it is mitigated — price closing through the entire zone
- Always require a BOS before considering an OB trade setup`,
      },
      {
        slug:     "sessions-and-killzones",
        title:    "Sessions and killzones — when to trade and when to wait",
        duration: "14 min",
        order:    6,
        published: true,
        level:    1,
        summary:  "Session windows and high-probability killzone timing.",
        points:   ["The three sessions", "Killzone windows", "When to stay out of the market"],
        body: `# Sessions and Killzones — When to Trade and When to Wait

## What you'll learn
- The three main trading sessions and what each one does to the market
- The specific killzone windows that offer the highest probability for SMC entries
- How to build a session-based routine that protects you from low-probability trades

## The Three Sessions

Forex trades 24 hours a day Monday through Friday, but not all hours are equal. The market has three main sessions defined by the geographic location of the major financial centres:

**Asian Session (Tokyo)**: 00:00–09:00 UTC. Low volume, tight ranges, often choppy. The Asian session typically sets a range — the "Asian box" — that the London and New York sessions will hunt. If you see equal highs and equal lows forming in the Asian session, those are next session's targets.

**London Session**: 07:00–16:00 UTC. The most liquid session. London opens when the Asian session is winding down and often makes the biggest move of the day. The first two hours of London — the London Open Killzone — are the highest-probability window for SMC setups.

**New York Session**: 12:00–21:00 UTC. Second highest volume. New York often continues the London move or sets up a reversal. The New York Open Killzone at 13:00–15:00 UTC is another premium entry window.

## Killzones

A killzone is a specific 2-hour window within a session where institutional order flow is most active. During killzones, price moves with purpose — sweeps, BOS moves, and OB/FVG reactions are most reliable here.

**London Open Killzone**: 08:00–10:00 UTC
**New York Open Killzone**: 13:00–15:00 UTC
**Asian Open Killzone**: 00:00–02:00 UTC (lower probability than the other two)

The Smile FX platform's Rules Validator checks whether your entry falls inside the current killzone automatically — but you should understand *why* it matters.

## Why Killzones Work

Institutional traders operate during business hours in their respective cities. When London opens, the biggest desks in the world — Barclays, HSBC, Deutsche Bank — begin executing their sessions' orders. These orders are large enough to move price, create clear BOS moves, sweep liquidity pools that built up overnight, and establish the day's direction.

When you enter a setup inside the killzone after a liquidity sweep and a clear BOS, you are entering alongside that institutional flow. When you enter at 21:00 UTC or during the Asian consolidation, you are fighting a directionless market.

## When to Stay Out

- **Outside killzones**: lower probability, choppy execution
- **Into major news events**: NFP, FOMC, CPI — price is controlled by the news flow, not structure
- **Friday afternoons**: institutional desks close positions ahead of the weekend; moves are unreliable
- **After a strong trend has run far without a pullback**: chasing is the fastest way to be the liquidity

## How to build your routine

1. Check the daily chart for HTF structure and bias before the London open
2. Mark any nearby liquidity pools (equal highs/lows, PDH/PDL, Asian session range)
3. Between 08:00–10:00 UTC, watch for a sweep of one of those levels
4. If a sweep occurs and price reacts with a BOS/CHoCH on H1 or M15, look for your FVG or OB entry
5. No setup by 10:00 UTC? Close the charts. Wait for New York at 13:00.

## Common mistakes

- Trading the Asian session hoping to "get ahead" of London — more often leads to being caught in a reversal
- Entering valid-looking setups at 11:00–12:00 UTC (the dead zone between London and New York)
- Ignoring news events — a perfect setup at a valid OB during an NFP release is still dangerous

## Key takeaways
- London Open (08:00–10:00 UTC) and New York Open (13:00–15:00 UTC) are the highest-probability entry windows
- The Asian session builds liquidity that the following sessions will hunt — use it for analysis, not trading
- If your entry is not inside a killzone, it is a warning flag — reduce size or skip the trade`,
      },
    ],
  },
  {
    slug:        "advanced-smc-models",
    title:       "Advanced SMC Models",
    description: "Deep dives into every model in the Smile FX rulebook: Turtle Soup, SMT, OB+FVG, and BOS retrace.",
    tier:        "pro",
    icon:        "psychology",
    color:       "var(--gold)",
    order:       2,
    published:   true,
    lessons: [
      {
        slug:     "liquidity-sweep-fvg",
        title:    "Liquidity Sweep → FVG: the highest-probability setup",
        duration: "28 min",
        order:    1,
        published: true,
        level:    2,
        summary:  "The complete Liquidity Sweep → FVG entry model.",
        points:   ["Identifying the sweep", "Finding the FVG after the sweep", "Entry, stop, and target"],
        body: `# Liquidity Sweep → FVG: The Highest-Probability Setup

## What you'll learn
- How to identify a confirmed liquidity sweep before it happens and as it completes
- How to locate the FVG that forms during the sweep impulse
- The full entry sequence: trigger, stop placement, and target selection

## Why This is the Highest-Probability Setup

The Liquidity Sweep → FVG model is the cornerstone of the Smile FX rulebook for one reason: it requires three independent confluence factors before you enter. The sweep confirms that liquidity has been collected. The FVG confirms that institutional order flow was aggressive enough to leave an imbalance. The HTF structure confirms you are trading in the correct direction. When all three align inside a killzone, the setup is as high-probability as retail trading gets.

This model appears in some form on virtually every strong daily move. Learning to see it takes practice, but once you can spot it, you will see it constantly across all pairs and timeframes.

## Step 1 — Identify the Liquidity Target

Before the sweep can happen, you need to know what level is going to be swept. On the H4 or H1 chart, identify the most obvious liquidity pool in the direction opposite to your HTF bias:

- If daily structure is bullish, look for equal lows or a PDL below current price — this is where retail sell stops are clustered
- If daily structure is bearish, look for equal highs or a PDH above current price

Mark this level precisely. This is what price will reach before the real move begins.

## Step 2 — Wait for the Sweep

During the London or New York killzone, watch for price to make a move *toward* the liquidity level. The sweep candle often looks like:
- A large wick that breaks below the equal lows / PDL (bullish sweep)
- A wick or close above equal highs / PDH (bearish sweep)

The key confirmation: price breaks the level and then immediately begins to reverse. A true sweep does not close far below the level — it wicks through and comes back.

## Step 3 — Locate the FVG

As price sweeps the level, the impulse candle that reverses often leaves an FVG. This is the three-candle imbalance covering the zone between the wick of the candle before the impulse and the wick of the candle after it. Draw this zone precisely.

In many cases, the FVG will be 5–15 pips wide on the H1. On higher timeframes it will be larger. The FVG is your entry zone — not a support/resistance level, but the specific imbalance created by the institutional reversal move.

## Step 4 — Enter on the Retest

After the sweep impulse, price often retraces. Sometimes it retraces immediately; sometimes it consolidates first. Wait for price to come back into the FVG zone.

Entry: at or near the midpoint of the FVG
Stop: a few pips below the sweep low (bullish) or above the sweep high (bearish) — below the *entire* sweep, not just below the FVG
Target: the draw on liquidity on the other side — equal highs in a bullish scenario, equal lows in a bearish one

## How to apply it

1. On EURUSD H1, identify equal lows that have formed over the past 2–3 days
2. Confirm daily structure is bullish
3. Watch the London open (08:00–10:00 UTC) for a wick below those lows
4. When the sweep occurs, mark the FVG on the reversal impulse
5. Place a limit order at the FVG midpoint, stop 10 pips below the sweep low, target the equal highs above

## Common mistakes

- Entering during the sweep candle itself — wait for it to complete and the FVG to form
- Setting the stop inside the FVG — the stop must be below the sweep low, outside all the swept liquidity
- Treating every move below a low as a sweep — look for the immediate reversal characteristic

## Key takeaways
- Three confluences required: liquidity sweep + FVG + HTF structure alignment
- The FVG forms on the impulse candle that reverses after the sweep — draw it precisely
- Stop below the full sweep, not just below the FVG
- This setup requires patience — the entry often comes 30–90 minutes after the sweep`,
      },
      {
        slug:     "ob-bos",
        title:    "OB + BOS: catching institutional order flow",
        duration: "24 min",
        order:    2,
        published: true,
        level:    2,
        summary:  "Using Order Blocks with confirmed BOS for continuation entries.",
        points:   ["BOS confirmation criteria", "Drawing the OB precisely", "Managing the trade"],
        body: `# OB + BOS: Catching Institutional Order Flow

## What you'll learn
- What constitutes a valid BOS for this model (not all structure breaks are equal)
- How to precisely identify and draw the Order Block that preceded the BOS
- Trade management: when to move your stop and when to take partials

## The OB + BOS Model Explained

The OB + BOS model is a trend continuation setup. Unlike the Liquidity Sweep → FVG which is often a reversal entry, OB + BOS keeps you in the direction of established structure. The logic: a BOS has just confirmed the trend direction, institutions placed orders at the OB level that caused that BOS, and when price pulls back to the OB, they reload those positions.

This is the model to use in clear trending conditions — not in ranges, not when structure is uncertain, and not against the HTF bias.

## Valid BOS Criteria

Not every structure break qualifies. A valid BOS for this model must:

1. Break a **significant** swing high or low — one that has been the accepted boundary for at least 4–6 candles on the entry timeframe
2. Close beyond the level (not just wick through) — a close confirms commitment
3. Be delivered by a momentum candle — a small, slow grind through a level does not carry the same institutional weight
4. Occur inside or near a killzone (London or New York open)

Minor internal structure breaks — small wiggles within the trend — do not generate valid OBs.

## Identifying the OB

After a valid BOS is confirmed:
1. Go back to the candles immediately preceding the impulse candle that caused the BOS
2. Find the **last bearish candle** (for a bullish BOS) or **last bullish candle** (for a bearish BOS) before the impulse began
3. Draw the OB from its open to its high (bullish) or open to its low (bearish)

Sometimes there is a clear single OB candle. Other times there are 2–3 overlapping candles that form an "OB zone." Use the widest range of that cluster.

## Entry and Stop Placement

Wait for price to pull back into the OB zone. This pullback is your opportunity.

Entry: enter at the 50% level of the OB (the midpoint) or at the level where price shows a reaction — a lower-timeframe bullish CHoCH, a wick, an engulfing candle
Stop: below the entire OB zone for a bullish setup — a few pips below the OB low
Target: minimum 2:1 R:R targeting the previous swing high or the next significant liquidity pool

## Trade Management

Once price moves in your favour by 1R (the distance from your entry to your stop):
- Move your stop to breakeven
- Consider taking 50% of the position at 2R
- Let the remainder run to the next draw on liquidity

Never move your stop into profit before price has moved 1R away — too early and you get stopped out by normal pullback noise.

## Common mistakes

- Trading OBs after insignificant structure breaks — the BOS must be meaningful
- Entering the OB without waiting for a reaction — use lower-TF confirmation
- Having too tight a stop — it must be below the entire OB, giving the zone room to be tested

## Key takeaways
- OB + BOS is a trend continuation model — confirm structure direction before looking for the OB
- The BOS must be significant: closes beyond the level, momentum candle, killzone timing
- Enter at or near the OB midpoint with confirmation; stop below the full OB zone
- Move stop to breakeven after 1R of movement`,
      },
      {
        slug:     "turtle-soup",
        title:    "Turtle Soup: fading breakouts the smart money way",
        duration: "21 min",
        order:    3,
        published: true,
        level:    2,
        summary:  "Counter-trend reversal model targeting false breakouts.",
        points:   ["Identifying Turtle Soup setups", "The false break criteria", "Entry and risk management"],
        body: `# Turtle Soup: Fading Breakouts the Smart Money Way

## What you'll learn
- What makes a valid Turtle Soup setup versus a genuine breakout
- How to identify the false break characteristics that confirm the model
- Risk management for a counter-trend setup

## What is Turtle Soup?

The name comes from a counter-trend strategy that fades the "Turtle Trader" breakout system — a famous trend-following method from the 1980s. The insight: when breakout traders all buy the same breakout, they become the liquidity that smart money sells into.

Turtle Soup is a reversal model targeting obvious, well-watched levels that price breaks by a small margin before reversing. It is one of the higher-risk models in the rulebook because it requires you to counter a perceived trend, but when the setup is clean it offers exceptional risk-to-reward.

## Valid Turtle Soup Criteria

1. **Obvious, well-watched level**: Previous Week High/Low, Monthly High/Low, or a very clear set of equal highs/lows that every retail trader can see on their chart
2. **Small false break**: price exceeds the level by a small margin (5–20 pips on most pairs, $1–5 on XAUUSD) — not a large momentum breakout
3. **Immediate reversal**: the next 1–3 candles immediately move back below (on a bearish Turtle Soup) or above (bullish) the broken level
4. **FVG or OB on the reversal**: the reversal impulse should leave an entry zone
5. **HTF supply/demand context**: the false break ideally occurs into a higher-timeframe supply zone (bearish) or demand zone (bullish)

If price breaks the level with a large momentum candle and closes significantly beyond it, that is a breakout — not a Turtle Soup.

## The False Break Distinction

The key question: did price commit to the breakout or immediately retreat?

A false break looks like a wick that exceeds the level and comes back in the same candle or the next candle. The candle that breaks the level should close back on the "inside" of the level — showing that the breakout was rejected.

A genuine breakout closes beyond the level with momentum. Do not try to Turtle Soup a genuine breakout.

## Why Avoid This Model in Asia

The Asian session has lower liquidity, which means false breaks happen more frequently for mechanical reasons rather than institutional manipulation. The Turtle Soup model works best in London and New York where institutional intent is real. An Asia-session false break of a level may simply be noise.

## Entry and Risk

Entry: inside the FVG or OB on the reversal candle, after the false break is confirmed
Stop: 5–10 pips above the false break high (bearish Turtle Soup) — above the furthest point of the wick
Target: the next draw on liquidity in the reversal direction — often a major swing low (bearish) or high (bullish) on H4

Risk note: because this is counter-trend, run this at your minimum position size until you have 10+ successful examples in your journal.

## How to apply it

1. Mark the most obvious previous week high on GBPUSD on Sunday night
2. During London Monday morning, if price makes a brief move above that high (5–15 pips) then immediately reverses
3. Look for the FVG on the reversal impulse
4. Enter inside the FVG, stop above the false break high, target the Asian session low below

## Key takeaways
- Turtle Soup fades obvious breakouts that are clearly retail stop hunts
- The false break must be small — a large momentum close above the level is a real breakout
- Best in London and New York; avoid in Asia where false breaks are noise
- Run at minimum size until you have proven edge with this model in your journal`,
      },
      {
        slug:     "smt-divergence",
        title:    "SMT Divergence: reading correlated pairs for confirmation",
        duration: "30 min",
        order:    4,
        published: true,
        level:    2,
        summary:  "Using Smart Money Technique divergence between correlated pairs.",
        points:   ["Correlated pair relationships", "Identifying SMT divergence", "Using it as confirmation"],
        body: `# SMT Divergence: Reading Correlated Pairs for Confirmation

## What you'll learn
- Which pairs are correlated and why divergence between them is significant
- How to identify SMT divergence on your charts
- How to use divergence as a high-conviction confirmation for your entries

## What is SMT Divergence?

Smart Money Technique (SMT) divergence occurs when two positively correlated pairs behave differently at a key liquidity level. One pair sweeps the level; the other does not. This divergence signals that the sweep on one pair was a manipulation — not a genuine structural move — and the reversal that follows is high-probability.

The most common SMT pairs on the Smile FX platform:
- **EURUSD and GBPUSD**: both trend similarly against the USD. When EURUSD sweeps equal lows but GBPUSD does not, it signals a bullish reversal on EURUSD
- **XAUUSD and DXY (inverse)**: Gold and the Dollar Index move inversely. When DXY sweeps a high but Gold fails to make a new low, it confirms Gold is likely to rally

## Understanding the Correlation Logic

If EURUSD and GBPUSD are both USD pairs, and the dollar is weakening, both should be making highs together. If EUR makes a new high but GBP does not — or vice versa — it means the move is not driven by genuine USD weakness. One pair's move is a manipulation.

The pair that swept is manipulated. The pair that held is the confirmation. Trade the swept pair in the direction confirmed by the non-swept pair.

## Identifying SMT Divergence

The setup:
1. Both pairs approach a key liquidity level (equal lows, PDL, session low)
2. EURUSD's price briefly goes below the equal lows — sweeping retail sell stops
3. GBPUSD does NOT make a new low — it holds above or at the prior low
4. This divergence is SMT: EURUSD was swept (manipulation); GBPUSD confirms the low holds (real)
5. Enter long on EURUSD at the OB/FVG created by the sweep move

## Why This Is High-Conviction

SMT divergence adds a second-pair confirmation to your setup. Instead of relying solely on EURUSD's price action, you have evidence from a correlated market that the move is manipulative. This is the same logic that institutional analysts use — cross-market analysis to confirm or deny a move.

When you see a Liquidity Sweep → FVG on EURUSD AND SMT divergence confirms it, you have two independent reasons to enter. That is a premium setup.

## Application — the SMT + OB Model

The Smile FX rulebook's "SMT + OB" model specifically requires:
1. A clear liquidity level on both pairs
2. One pair sweeps; the other does not
3. An Order Block on the sweeping pair at the sweep zone
4. Entry inside the OB with stop beyond the sweep

The SMT checkbox in the Rules Validator must be confirmed before you log this model.

## Common mistakes

- Looking for divergence on pairs that are not actually correlated (EURUSD and USDJPY are not SMT pairs — they are negatively correlated)
- Using very minor new highs/lows as the divergence reference point — use significant swing levels
- Trading SMT without an entry model (OB or FVG) — divergence is confirmation, not an entry signal by itself

## Key takeaways
- SMT divergence occurs when a correlated pair fails to confirm a new high or low made by the other
- EURUSD/GBPUSD and XAUUSD/DXY are the main SMT pairs used in this system
- The non-swept pair is the confirmation; trade the swept pair
- SMT is always a confirmation layer — combine with OB or FVG for the actual entry`,
      },
      {
        slug:     "ob-fvg-confluence",
        title:    "OB + FVG confluence: the double-zone entry",
        duration: "19 min",
        order:    5,
        published: true,
        level:    2,
        summary:  "Trading the overlap of Order Block and FVG for maximum confluence.",
        points:   ["When OB and FVG overlap", "Entry precision within the zone", "Why confluence strengthens the setup"],
        body: `# OB + FVG Confluence: The Double-Zone Entry

## What you'll learn
- Why OB and FVG zones sometimes overlap and what that means
- How to find the precise entry within the confluence zone
- How this double-confluence increases setup quality

## The Logic of OB + FVG Confluence

An Order Block and a Fair Value Gap at the same price zone means two institutional mechanisms are pointing to the same area. The OB tells you institutions placed orders here (causing the BOS). The FVG tells you the move was so aggressive that an imbalance was left here (unfilled orders). When both are at the same level, the zone has double the reason to hold.

Think of it as two independent reasons to expect a reaction. An OB alone might hold 60% of the time. An FVG alone might hold 65% of the time. When they overlap, the probability of the zone holding increases meaningfully.

## When Do They Overlap?

The most common scenario: a BOS impulse candle is both the candle that confirms the OB (it is the candle immediately after the last opposing candle) and simultaneously creates an FVG (it is the large middle candle of a three-candle FVG pattern).

This happens naturally on strongly trending moves where the BOS candle itself is large and impulsive. The FVG is contained within the price range of the OB zone.

## Drawing the Combined Zone

1. Draw the OB as usual: last opposing candle's body range (open to high for bullish OB)
2. Draw the FVG: wick of candle before impulse to wick of candle after impulse
3. The overlap (the price range where both zones exist) is your entry zone
4. If the overlap is narrow (5–10 pips), enter at the overlap midpoint
5. If the zones are close but do not fully overlap, use the FVG high as your entry (more aggressive) or the OB midpoint (more conservative)

## Entry Precision

Within the combined zone, entry precision matters. The tighter your entry, the better your R:R:

- Most aggressive: enter at the first touch of the OB/FVG confluence — do not wait for a lower-TF signal
- Standard: wait for a M15 CHoCH or engulfing candle inside the zone
- Conservative: wait for price to close back above the FVG low (bullish) — this sacrifices some R:R but gives you strong confirmation

## When This Model Fails

The model fails most often when:
- The zones are drawn too wide — you included choppy candles in the OB range
- HTF structure has shifted bearish but you are still looking for the old bullish OB+FVG
- Price entered the zone but the daily candle closed beyond it (mitigation) — the zone is invalidated

## How to apply it

1. After a bullish BOS on XAUUSD H1, identify the OB (last bearish candle before impulse)
2. Identify the FVG (three-candle imbalance on the BOS impulse)
3. Check if they overlap
4. If yes, draw the overlap zone and set a limit order at the midpoint
5. Stop below the OB low; target the next equal highs above

## Key takeaways
- OB + FVG confluence is two independent institutional mechanisms at the same price — double confirmation
- Draw both zones precisely; the entry is within their overlap
- The more perfectly they overlap, the stronger the zone
- Still requires HTF structure alignment and killzone timing`,
      },
      {
        slug:     "bos-retrace",
        title:    "BOS + retrace: entering on the pullback with confidence",
        duration: "17 min",
        order:    6,
        published: true,
        level:    2,
        summary:  "The simplest continuation model: BOS followed by a structured pullback.",
        points:   ["Clean trending structure requirement", "Identifying the retrace FVG/OB", "When NOT to use this model"],
        body: `# BOS + Retrace: Entering on the Pullback with Confidence

## What you'll learn
- What "clean trending structure" looks like and why this model only works in those conditions
- How to identify the FVG or OB that price retraces to after a BOS
- The specific conditions that make a BOS + retrace a skip rather than a trade

## The Simplest Continuation Model

BOS + retrace is the most straightforward model in the rulebook. After a confirmed BOS, price will often pull back before continuing. Your job is to be positioned in the direction of the BOS before the continuation happens.

No liquidity sweep is required. No SMT divergence is needed. Just a clean BOS, a structured pullback to a valid zone, and an entry. This is why it is often the first model new traders learn — but it requires a truly trending market to work reliably.

## "Clean Trending Structure" Defined

Clean trending structure means:
- A clear series of HH → HL → HH → HL (bullish) or LH → LL → LH → LL (bearish)
- Each BOS is decisive — closes beyond the prior high/low with momentum
- Pullbacks are orderly — price retraces 30–50% of the impulse and then resumes
- No choppy sideways price action within the trend

If the structure chart looks like a mess of overlapping swings in both directions, this is NOT the environment for BOS + retrace. Wait for clearer conditions.

## Identifying the Entry Zone After a BOS

After a clean BOS:
1. The BOS impulse candle often creates an FVG — draw it
2. The last opposing candle before the impulse is the OB — draw it
3. Wait for price to pull back toward these zones
4. The 50% retracement of the BOS impulse is also a useful target for the pullback

Entry is whichever zone price reaches first — FVG, OB, or the 50% retracement level. Use lower-timeframe confirmation if you want higher precision.

## Risk:Reward Expectations

BOS + retrace typically offers 2:1 to 3:1 R:R. The target is the next significant liquidity pool in the trend direction (next equal highs in a bullish trend). Because there is no liquidity sweep providing the reversal fuel, the setup is a trend continuation — not a massive reversal — so targets tend to be closer.

If a setup shows less than 2:1 R:R, skip it.

## When NOT to Use This Model

- In a ranging or sideways market — the "BOS" is likely just a range break that will reverse
- When the trend has run very far without a meaningful pullback — the risk of a deeper retracement or reversal is high
- When the BOS occurred outside a killzone — the momentum behind it is suspect
- When HTF structure is ranging or against the trade direction

## How to apply it

1. On NZDUSD H1, confirm the past 2–3 days show clean bullish structure (HH, HL pattern)
2. Wait for the next BOS — a close above the last significant high
3. Mark the FVG and OB on the BOS impulse
4. Wait for the first pullback into those zones during the next London session
5. Enter with stop below the OB, target the next swing high

## Key takeaways
- BOS + retrace is the cleanest continuation setup — but only works in genuinely trending conditions
- Entry zone is the FVG or OB on the BOS impulse; aim for the 50% pullback level
- Minimum 2:1 R:R required — skip setups that do not meet this
- When structure is ambiguous, this model does not apply — choose a different setup or wait`,
      },
    ],
  },
  {
    slug:        "risk-management-psychology",
    title:       "Risk Management & Psychology",
    description: "The part most traders ignore. Position sizing, risk per trade, drawdown management, and emotional control.",
    tier:        "pro",
    icon:        "health_and_safety",
    color:       "var(--coral)",
    order:       3,
    published:   true,
    lessons: [
      {
        slug:     "the-05-percent-rule",
        title:    "The 0.5% rule: why less risk = more profit long term",
        duration: "16 min",
        order:    1,
        published: true,
        level:    2,
        summary:  "Why risking less per trade compounding builds larger accounts.",
        points:   ["Risk per trade mathematics", "Drawdown recovery math", "Why 0.5–1% is optimal"],
        body: `# The 0.5% Rule: Why Less Risk = More Profit Long Term

## What you'll learn
- The mathematics behind why small risk percentages outperform large ones over time
- How drawdowns compound and why recovery is exponentially harder than you think
- How to calculate your position size using the 0.5% rule

## The Counter-Intuitive Truth About Risk

Most new traders believe that the way to build an account faster is to risk more per trade. Risk 5% per trade and you will grow five times faster than risking 1%, right? This is mathematically wrong, and understanding why is one of the most important lessons you will learn.

The problem is drawdowns. A 10-trade losing streak at 5% risk wipes out 40% of your account. Recovering 40% requires a 67% gain. A 10-trade losing streak at 1% risk loses 10%. Recovering 10% requires just 11% gains. The mathematics of compounding losses is asymmetric and brutal.

## The Drawdown Recovery Math

| Loss | Recovery Needed |
|---|---|
| 10% | 11% |
| 20% | 25% |
| 30% | 43% |
| 40% | 67% |
| 50% | 100% |

At 5% risk and a 60% win rate, a 10-trade streak of losses (which statistics says *will* happen eventually) can end your trading. At 0.5%, the same streak is a minor bump — you tighten, review, adjust, and continue.

## The Long-Term Compounding Advantage

At 0.5% risk, 60% win rate, and 3:1 R:R, after 200 trades you have compounded your account by approximately 120–180%. At 2% risk with the same statistics, the *average* result is similar — but the variance (the risk of ruin) is dramatically higher. You will experience longer and deeper drawdowns, and the psychological damage from those drawdowns causes traders to make mistakes that destroy the theoretical edge.

Lower risk per trade → smaller drawdowns → better psychological state → better decisions → better execution → better results. It is a compounding loop.

## The 0.5% Starting Point

Kondwani recommends starting at 0.5% risk per trade. This means if you have a $1,000 account, you risk $5 per trade. On EURUSD with a 20-pip stop, that means trading 0.025 lots (a micro lot and a half).

You are not going to get rich in three months. You are going to build a track record, learn your edge, and protect your capital while you do. When your win rate is proven and consistent over 50+ trades, you can consider moving to 1%.

## How to apply it

1. Take your total account balance
2. Calculate 0.5% of that amount — this is your maximum risk in dollars per trade
3. Measure your stop loss in pips/points for the trade
4. Divide your dollar risk by (pips × pip value per lot) to get your lot size
5. The Smile FX position size calculator on the Validator page does this automatically

## Common mistakes

- Risking more on setups that "look better" — your edge is statistical, not per-setup; risk the same every trade
- Reducing risk after losses and increasing after wins — the opposite of what emotion tells you
- Confusing account growth speed with account stability — a slow but steady equity curve is worth infinitely more than a volatile one

## Key takeaways
- Drawdown recovery is exponentially harder as the drawdown deepens — avoid large losses at all costs
- 0.5–1% risk per trade keeps you in the game through inevitable losing streaks
- Your edge compounds through consistency, not through large bets`,
      },
      {
        slug:     "position-sizing",
        title:    "Position sizing with fixed fractional risk",
        duration: "14 min",
        order:    2,
        published: true,
        level:    2,
        summary:  "How to calculate exact lot sizes for every trade.",
        points:   ["The formula for lot size", "Pip value by instrument", "Lot size calculator"],
        body: `# Position Sizing with Fixed Fractional Risk

## What you'll learn
- The exact formula to calculate your lot size for any trade on any instrument
- Pip and point values for each pair traded on the Smile FX platform
- How to use the built-in position size calculator in the validator

## The Fixed Fractional Method

Fixed fractional position sizing means you risk the same *percentage* of your account on every trade, regardless of how confident you feel or how good the setup looks. This removes emotion from sizing decisions and ensures consistent R:R across all trades.

**Formula:**

Lot size = (Account Balance × Risk%) / (Stop Loss in Pips × Pip Value per Standard Lot)

Example: $2,000 account, 0.5% risk, EURUSD trade with 20-pip stop
- Dollar risk = $2,000 × 0.5% = $10
- Pip value for EURUSD standard lot = $10 per pip
- Lot size = $10 / (20 × $10) = $10 / $200 = **0.05 lots**

## Pip Values by Instrument

| Instrument | Pip/Point Size | Pip Value (Standard Lot) |
|---|---|---|
| EURUSD | 0.0001 | $10 |
| GBPUSD | 0.0001 | $10 |
| NZDUSD | 0.0001 | $10 |
| XAUUSD | 0.01 (1 cent) | $100 per $1 move |
| NAS100 | 1 point | $1 per point |

For XAUUSD, use dollar distance (not pips): a $5 stop = 5 dollar risk points. A standard lot risks $100 per $1 move, so: lot size = dollar risk / (stop in dollars × 100).

## The Smile FX Position Size Calculator

The validator has a built-in calculator under "Position Size" at the bottom of the left panel. Enter:
- Your account balance (saved in your browser so you do not retype it each session)
- Your risk % (default 1%)
- Your entry price and stop loss

The calculator shows your exact lot size, pip distance, dollar risk, and TP level. Use it before every trade.

## Why Every Trade Gets the Same Risk

It is tempting to risk more on setups that look exceptional. The problem: your gut feeling about a setup's quality is not a reliable predictor of its outcome. Your brain's confidence in a trade is often highest right after a winning streak — when you are emotionally in a "hot hand" bias. The data shows win rates do not change based on how confident you felt about a specific trade.

Varying your risk introduces unpredictability into your equity curve and makes it impossible to identify your true edge. If you risk 3% on your winners and 0.5% on your losers, your statistics are meaningless.

## Key takeaways
- Dollar risk = Balance × Risk%
- Lot size = Dollar risk / (Stop in pips × Pip value per lot)
- XAUUSD and NAS100 use dollar/point distances, not pip values
- The same risk percentage on every trade, regardless of setup quality`,
      },
      {
        slug:     "drawdown-management",
        title:    "Drawdown: how much is too much and when to stop",
        duration: "18 min",
        order:    3,
        published: true,
        level:    2,
        summary:  "Rules for managing and surviving drawdown periods.",
        points:   ["Daily and weekly loss limits", "Drawdown recovery plan", "When to pause trading"],
        body: `# Drawdown: How Much Is Too Much and When to Stop

## What you'll learn
- The specific loss limits Kondwani recommends for daily, weekly, and monthly drawdowns
- How to create a drawdown recovery plan that gets you back on track
- The psychological signs that mean you need to step away from the market

## Drawdown Is Normal — But You Need Rules for It

Every professional trader has losing periods. A 10–15% drawdown during a month is not unusual even for experienced traders with a proven edge. The difference between traders who survive and those who blow accounts is not their ability to avoid drawdowns — it is how they behave during them.

Without rules, losing periods cause emotional escalation. You increase size to recover faster. You take setups that do not fully meet your criteria. You override your system. Each of these actions digs the hole deeper. Rules prevent this.

## The Smile FX Drawdown Rules

**Daily stop loss**: If you lose 2× your standard risk in a single day (e.g. 2 losing trades at 0.5% each = 1% of account), stop trading for the day. No exceptions.

**Weekly stop**: If you reach a 3% drawdown in a single week, stop for the rest of that week. Review your trades on Sunday.

**Monthly pause point**: At 8–10% monthly drawdown, take a one-week break from live trading. Return to the simulator. Review every loss trade in your journal.

These numbers are not arbitrary. They are designed to prevent the psychological cascade that turns a 10% drawdown into a 40% drawdown through emotional decision-making.

## Drawdown Recovery Protocol

When you hit a drawdown rule:

1. **Stop immediately**. No "just one more trade to get it back."
2. **Review every loss trade from the week**. Open your journal and go through each one. Was the entry valid? Was the stop placement correct? Was there a setup qualification issue?
3. **Identify the pattern**. If multiple losses came from the same model, avoid that model for the next 20 trades and observe it paper-trading
4. **Return at half size**. When you resume, trade at half your normal risk (0.25% if you normally trade 0.5%) until you have had 5 consecutive winning or break-even sessions
5. **Rebuild gradually**. Once your confidence and metrics are restored, return to full size

## The Psychological Signs to Stop

Sometimes the market is not the problem — you are the problem. Pause trading immediately if you notice:

- Reviewing your trade before the entry, convincing yourself it is valid when you know it is not
- Feeling *desperate* to enter a trade — any trade
- Arguing with your system ("the setup is 90% there, close enough")
- Checking your phone for prices every five minutes during a trade
- Trading to cover a loss from earlier in the day

These are emotional states, not trading states. The market will still be there tomorrow. Your capital, once gone, may not return.

## Key takeaways
- Daily limit: 1–2% loss. Weekly limit: 3%. Monthly: 8–10% triggers a review week
- When you hit a limit, stop immediately — no exceptions, no "just one more"
- Return to live trading at half size after a review period, rebuild to full size over 5 clean sessions
- Emotional states are often more dangerous than bad setups — learn to recognize them`,
      },
      {
        slug:     "revenge-trading",
        title:    "The revenge trade — recognising and breaking the pattern",
        duration: "20 min",
        order:    4,
        published: true,
        level:    2,
        summary:  "Understanding and eliminating revenge trading from your practice.",
        points:   ["What triggers a revenge trade", "The anatomy of a revenge trade", "Breaking the cycle"],
        body: `# The Revenge Trade — Recognising and Breaking the Pattern

## What you'll learn
- The psychological triggers that cause revenge trading
- How to recognise you are about to make a revenge trade
- Concrete steps to break the cycle before it destroys your account

## What is a Revenge Trade?

A revenge trade is any trade entered primarily to recover a loss, rather than because a valid setup exists. The word "revenge" is accurate — you are emotionally trying to "get back" at the market for taking your money.

The problem: the market is not your opponent. It has no awareness of your loss. The loss is in the past and cannot be undone. But the emotional state it creates — frustration, urgency, damaged pride — is very present, and it overrides your analytical brain and makes you take trades you would otherwise never consider.

## The Anatomy of a Revenge Trade

1. **The loss**: you take a valid trade and it stops out. This is normal. But the stop-out feels personal.
2. **The urgency**: within seconds or minutes, you are already scanning for the next setup. The desire to recover feels like a need, not an option.
3. **The rationalisation**: you find a chart that "looks good enough." You talk yourself into it. The criteria are stretched, ignored, or invented.
4. **The entry**: you take the trade with double or triple your normal size to recover faster.
5. **The outcome**: statistically worse than your normal trades, because setup quality was compromised and emotion was driving the sizing decision.
6. **The cascade**: if this trade also loses, the emotional state escalates further. Traders who cannot break the cycle here often blow their accounts in a single session.

## The Emotional State Recognition Exercise

After any loss, ask yourself these questions before looking for the next trade:

- "Am I looking for a trade because a setup has appeared, or because I want to recover?"
- "Would I take this exact setup after a winning day, when I feel calm?"
- "Am I planning to size up to recover faster?"
- "Have I waited at least 15–30 minutes since the loss before opening charts?"

If any of these reveal emotional motivation, you are in revenge mode. Close the charts.

## Breaking the Cycle

The most effective techniques traders use:

**Physical break**: Close your trading platform immediately after a loss. Walk away from the desk for 15–30 minutes. Physical distance breaks the emotional feedback loop.

**The journal rule**: Before your next trade after a loss, you must have written a brief review of the loss trade in your journal. This forces analysis over emotion, and often reveals that the loss was actually a valid trade execution.

**The 24-hour rule**: Some traders with severe revenge trading patterns implement a rule: no further live trading after hitting the daily loss limit, period. The next session starts fresh the next day.

**Pre-session ritual**: Before every session, write in your journal: "My goal today is clean execution of valid setups. Recovery is not a goal for a single session — it is a goal over 100+ trades."

## Key takeaways
- Revenge trading is any trade taken primarily to recover a loss, not because of a valid setup
- The emotional state after a loss physically degrades decision-making — you need time to reset
- Stop, journal, take a break, then evaluate whether there is a real setup
- The market will always have more opportunities tomorrow — your capital may not if you revenge trade`,
      },
      {
        slug:     "journal-psychology",
        title:    "Trading journal psychology: honest review practice",
        duration: "15 min",
        order:    5,
        published: true,
        level:    2,
        summary:  "How to review your journal to find edge, not excuses.",
        points:   ["How to review objectively", "The mistake pattern analysis", "Turning losses into lessons"],
        body: `# Trading Journal Psychology: Honest Review Practice

## What you'll learn
- Why most traders journal incorrectly and get no useful insight from it
- How to review your trades with brutal honesty rather than post-hoc rationalisation
- How to use the journal to identify your edge and eliminate your leaks

## Why Most Traders Journal Wrong

Most traders, when they review a losing trade, unconsciously look for ways to explain why the loss was "not their fault." Price was manipulated. The spread was wider than usual. The news event they did not know about caused a spike. The setup looked perfect.

These explanations may sometimes be true. But the pattern of finding external reasons for losses while taking credit for wins is a psychological defence mechanism that destroys your ability to improve. If your losses were all external and your wins were all your skill, you cannot learn from the losses.

The correct mindset: **every loss is a data point about either your edge or your execution.** Your job is to identify which.

## Honest Review Protocol

For every trade in your journal, ask:

**Setup quality**: "Did this trade meet ALL my entry criteria, without exception?" If yes, it was a valid trade that did not work — that is normal. If no, you need to identify which criterion was compromised.

**Execution**: "Did I enter at the right price? Did I size correctly? Did I manage the trade according to my rules?"

**Bias check**: "Would I have taken this trade if I had not been looking for a reason to trade?" (Relevant after a winning streak when overconfidence rises.)

**Pattern recognition**: "Have I seen this type of loss before? Is this the third or fourth loss from the same model, the same session, or the same type of setup?" Patterns in your losses are the most valuable information your journal can give you.

## The Mistake Leak Analysis

In your Smile FX journal's Analytics section, the "Recurring Leaks" tab shows you which models you keep breaking rules on. This is not random — if you consistently break rules on "OB + BOS" setups, you likely have a specific confusion about what constitutes a valid OB. That is fixable with education.

Review this section weekly. Every recurring leak represents a rule you do not fully understand or a psychological pattern you have not yet addressed.

## Turning Losses into Lessons

For every losing trade that involved a rule break:

1. Write the mistake explicitly: "I entered before the M15 CHoCH confirmed. I was impatient."
2. Write the correction: "In future, I will wait for the lower-TF confirmation candle to close before entering, regardless of how obvious the setup looks."
3. Tag the trade as a rule-break in the journal. After 20 tagged trades, review the pattern.

For losing trades where the setup was valid:

1. Acknowledge it: "This was a valid trade. The market did not follow the expected path. This is statistically normal."
2. Check R:R: "Was my target realistic given the market structure? Was my stop placement correct?"
3. No further action needed. Trust the edge over sample size.

## Key takeaways
- Honest review means equally interrogating both your wins and your losses
- Pattern recognition across multiple trades is more valuable than analysis of any single trade
- Tag rule-break trades separately from valid losses — only rule-break patterns require behaviour changes
- Weekly review of the Recurring Leaks section is one of the highest-value activities you can do`,
      },
    ],
  },
  {
    slug:        "reading-the-cot-report",
    title:       "Reading the COT Report",
    description: "Use institutional positioning data to confirm HTF bias before you trade. A weekly edge most retailers never use.",
    tier:        "pro",
    icon:        "bar_chart",
    color:       "var(--navy)",
    order:       4,
    published:   true,
    lessons: [
      {
        slug:     "what-cot-tells-us",
        title:    "What the CFTC data tells us that price charts don't",
        duration: "22 min",
        order:    1,
        published: true,
        level:    2,
        summary:  "Introduction to COT data and its use in forex bias.",
        points:   ["What the CFTC reports", "Large Specs vs Commercials", "How to read net positioning"],
        body: `# What the CFTC Data Tells Us That Price Charts Don't

## What you'll learn
- What the Commitments of Traders report is and who is required to report
- The difference between Large Speculators, Commercials, and Small Speculators
- How to read the net position data and what it tells you about institutional bias

## What is the COT Report?

The Commitments of Traders (COT) report is published every Friday by the US Commodity Futures Trading Commission (CFTC). It is a free government document that shows the aggregate positions of three categories of traders in the futures markets: large speculators (Non-Commercial), commercials (Commercial), and small speculators (Non-Reportable).

Every large futures trader — hedge funds, investment banks, corporate hedgers — must report their positions weekly. The COT aggregates this data. No other free data source gives you this level of visibility into what institutional traders are actually doing.

## The Three Groups

**Large Speculators (Non-Commercial)**: These are the trend-following institutional participants — hedge funds, CTAs (Commodity Trading Advisors), and large prop firms. They are speculating for profit. When they are net long, they expect the market to go up. Their positioning is the primary signal we use.

**Commercials**: Corporations and banks hedging real-world exposure. An airline buys oil futures to hedge against rising fuel costs. A European exporter sells EUR futures to hedge receivables. Commercials move opposite to the direction they expect prices to move — they are hedging, not speculating. Their positioning is read as a contrarian signal.

**Small Speculators (Non-Reportable)**: The retail crowd. They are often wrong at extremes. When small specs are overwhelmingly net long, it can signal a potential reversal — but this is the weakest signal and requires other confluence.

## Reading Net Positioning

The key number is the **Large Speculator Net** position:

Net = Long contracts − Short contracts

- **Positive net** (e.g. +150,000): Large specs hold more longs than shorts → bullish bias
- **Negative net** (e.g. −80,000): Large specs hold more shorts than longs → bearish bias

The size of the net tells you conviction. A net of +200,000 is stronger than +50,000. But context matters — +200,000 for a pair with a historical range of ±300,000 is different from +200,000 for a pair that historically only moves ±100,000. This is why we use the COT Index (covered in lesson 2).

## The USD Pairs Complication

The CFTC reports positions for the underlying currency, not the pair. EUR futures reflect EUR/USD positioning. Yen futures reflect Yen positions — but since we trade USDJPY, a net long Yen position means bearish USDJPY. The Smile FX COT page automatically inverts USD-base pairs so that all signals read consistently.

## How to apply it

Every Sunday:
1. Open the Smile FX COT page
2. Check the net position for each pair you plan to trade this week
3. Is the net positive or negative? Is it growing (adding) or shrinking (reducing)?
4. Cross-reference with your Trend Matrix bias for the same pairs

If the COT and your price-action-based Trend Matrix agree, your HTF bias confidence should be high. If they disagree, treat that pair cautiously.

## Key takeaways
- The COT report shows actual institutional positions — information no chart indicator can provide
- Large Speculators net position is the primary signal: positive = bullish bias, negative = bearish
- Commercials are contrarian hedgers — their behaviour confirms or challenges the speculator signal
- Use COT weekly for HTF bias — it is not an intraday entry tool`,
      },
      {
        slug:     "non-commercial-extremes",
        title:    "Non-commercial net positions: how to find extreme readings",
        duration: "18 min",
        order:    2,
        published: true,
        level:    2,
        summary:  "Using the COT Index to identify extreme positioning and reversals.",
        points:   ["The COT Index formula", "Extreme readings and reversals", "When not to trade against the trend"],
        body: `# Non-Commercial Net Positions: How to Find Extreme Readings

## What you'll learn
- How to calculate and interpret the COT Index (0–100 cycle gauge)
- What extreme readings (above 80 or below 20) mean for potential reversals
- How to combine the COT Index with weekly WoW change for the full signal

## The COT Index

The absolute net position number tells you direction, but it does not tell you how extreme that positioning is relative to history. A net of +180,000 long contracts might be normal for EURUSD, but for NZDUSD it could be an all-time record.

The COT Index solves this by expressing current positioning as a percentile of the last 52 weeks:

**COT Index = (Current Net − 52-Week Low) / (52-Week High − 52-Week Low) × 100**

- **Index 80–100**: Large specs are near the most bullish they have been in the past year. The long trade is crowded.
- **Index 65–79**: Strong bullish positioning, trend likely has room.
- **Index 45–64**: Moderate bullish bias.
- **Index 35–44**: Moderate bearish bias.
- **Index 20–34**: Near the most bearish of the year. Potential mean-reversion zone.
- **Index 0–19**: Historically maximum short positioning — watch for exhaustion.

## Extreme Readings and Reversals

When the COT Index is above 80 and Large Specs have been net long and adding for several weeks, two things are true: (1) the trend has been strong, and (2) the trade is crowded. Crowded trades unwind violently.

This does not mean you short automatically. You look for price-level confirmation: a CHoCH on the weekly/daily chart, a failed breakout, a major liquidity sweep that does not continue. When these price signals appear against an extreme COT reading, the reversal trade becomes high-conviction.

Similarly, an Index below 20 with price at a key support level and specs aggressively covering shorts is a strong potential reversal setup for a long trade.

## Week-Over-Week (WoW) Change

The WoW Change shows how the net position moved compared to last week. This is the momentum component:

- Large net + growing (adding) → **Strong Bullish Setup**
- Large net + shrinking (reducing) → Bullish but weakening
- Near cycle high (Index > 80) + reducing sharply → **Distribution** — potential reversal
- Large net − growing (adding shorts) → **Strong Bearish Setup**
- Large net − shrinking (covering) + Index < 20 → **Potential bullish reversal**

The Smile FX COT page shows these signals automatically as teal/gold/coral badges. But understanding why the badge is what it is allows you to make better judgment calls when the signal is ambiguous.

## When Not to Trade Against the Trend Despite Extreme Readings

Extreme COT readings can stay extreme for months in a strong trend. Do not fade a trend solely because the COT Index is above 80. Wait for:
1. Price confirmation — a failed breakout, a significant CHoCH on the weekly chart
2. Commercial position change — if commercials start reducing their hedge significantly, institutional confidence in the trend is decreasing
3. WoW deceleration — if the net is still growing but the weekly change is getting smaller, momentum is fading

## Key takeaways
- The COT Index is a 52-week percentile gauge — it tells you how extreme positioning is relative to history
- Above 80 = crowded long; below 20 = crowded short. These are reversal watch zones, not automatic trade signals
- Combine COT Index + WoW change + price confirmation before acting on an extreme reading
- A strong trend can maintain extreme COT readings for extended periods — always wait for price confirmation`,
      },
      {
        slug:     "cot-smc-bias-trade",
        title:    "Combining COT + SMC structure: the institutional bias trade",
        duration: "26 min",
        order:    3,
        published: true,
        level:    2,
        summary:  "Using COT data to filter SMC entries for maximum conviction.",
        points:   ["COT as an HTF filter", "The three-step confluence process", "Real trade examples"],
        body: `# Combining COT + SMC Structure: The Institutional Bias Trade

## What you'll learn
- How COT data functions as the highest-timeframe filter before you look at price charts
- The three-step process to move from COT → Trend Matrix → Entry
- How to avoid SMC setups that look perfect technically but go against the institutional flow

## COT as the HTF Filter

Your analysis hierarchy should be:

1. **COT (Weekly, macro)**: What do Large Speculators think about this pair over the next weeks/months?
2. **Daily structure (Trend Matrix)**: Is price action confirming the COT bias with clean structure?
3. **H4/H1 structure**: Is there a fresh entry setup in the COT direction?
4. **Entry**: FVG, OB, or sweep model on H1 or M15

COT is the widest lens. It does not tell you where to enter — it tells you *which direction* your entries should be. If EURUSD COT is showing Strong Bullish Setup (large specs adding longs), you should only be looking for long entries on EURUSD until the COT picture changes.

## The Three-Step Confluence Process

**Step 1 — COT bias**: On Sunday, check the Smile FX COT page. Note the signal badge for each pair: Strong Bullish, Bullish, Neutral, Bearish, Strong Bearish. Write down your COT bias for the week.

**Step 2 — Trend Matrix alignment**: Open your Trend Matrix. Does the daily, H4, and H1 structure agree with the COT bias? If COT is bullish EURUSD but the daily structure is bearish (LH, LL pattern), there is a conflict. Either the COT is about to shift price back up, or the price action is telling you that the COT data has not yet been reflected in price. In these cases, wait for the resolution.

**Step 3 — Entry model**: Once COT and Trend Matrix agree, look for entries in that direction using your killzone setups. A Liquidity Sweep → FVG or OB + BOS in the direction of both COT and daily structure is the highest-conviction trade available.

## What to Do When COT and Price Disagree

Disagreement between COT bias and daily price structure happens at market turning points — exactly when the COT is shifting before price has moved significantly. In these periods:

- Do not trade aggressively
- Reduce position size to minimum
- Wait for price structure to confirm the COT signal (CHoCH on daily, first BOS in new direction)
- Once price confirms, you have a high-conviction entry with macro COT flow behind it

## Real Application Example

Scenario: COT shows Large Specs adding longs on GBPUSD for the third consecutive week. Index at 62 — not extreme, room to run. Daily chart shows a recent CHoCH from bearish to bullish, with the first HH formed. H4 shows a pullback to a clean FVG.

This is a complete institutional bias trade:
- COT: bullish and building
- Daily: CHoCH confirms bullish turn
- H4: FVG pullback entry

Enter long at the H4 FVG, stop below the FVG, target the next weekly high. Risk 0.5–1% depending on conviction.

## Common mistakes

- Using COT as a timing tool ("COT is bullish, I will buy right now") — it is a directional filter, not an entry signal
- Ignoring COT when it conflicts with a compelling technical setup — the macro is often right; the technical setup may resolve in the opposite direction
- Checking COT daily instead of weekly — COT is a weekly tool; looking at it more frequently creates noise

## Key takeaways
- COT → Trend Matrix → Entry is the correct order of analysis
- When COT and price structure agree, setup quality is highest
- COT tells you the direction; SMC structure tells you where to enter
- At turning points when COT and price disagree, reduce size and wait for confirmation`,
      },
    ],
  },
  {
    slug:        "live-trade-reviews",
    title:       "Live Trade Reviews with Kondwani",
    description: "Kondwani walks through real trades — his alerts, your submitted trades, winners and losers all reviewed live.",
    tier:        "pro",
    icon:        "videocam",
    color:       "var(--teal)",
    order:       5,
    published:   true,
    lessons: [
      {
        slug:     "june-2026-week1-xauusd",
        title:    "June 2026 week 1 — XAUUSD London sweep reviewed",
        duration: "34 min",
        order:    1,
        published: true,
        level:    2,
        summary:  "Full trade review of a XAUUSD London sweep setup.",
        points:   ["How the setup was identified", "Entry and management", "What to learn from the outcome"],
        body: `# June 2026 Week 1 — XAUUSD London Sweep Reviewed

## Trade overview

This lesson walks through a live XAUUSD trade from the week of June 2–6 2026. This was a textbook Liquidity Sweep → FVG setup during the London open killzone.

## What you'll learn
- How the trade was identified before the London open through Sunday analysis
- The exact entry, stop, and target reasoning
- What the trade teaches about XAUUSD-specific behaviour in London

## Pre-session Analysis (Sunday night)

**COT**: Large Spec net on Gold was +198,000 — strongly bullish. Index at 67, still room to run. WoW change positive for the third consecutive week.

**Daily structure**: Bullish — series of HH and HL forming since May 15. The most recent HL was the swing low at $2,298. Equal highs sat at $2,341 from two weeks prior — the obvious liquidity target above.

**H4 analysis**: Price had been pulling back from $2,341 for 6 days. Equal lows had formed on H4 at $2,306 — retail sell stops were clustered there.

**Expectation**: London open was likely to run the equal lows at $2,306 before making a move toward the equal highs at $2,341. The COT confirmed directional bias.

## The London Open Setup

At 08:14 UTC, XAUUSD made a move lower. The H1 candle at 08:00 had already printed a bearish wick before recovering. By 08:14, price broke below $2,306 by $1.80 — sweeping the equal lows and triggering retail sell stops.

The 08:15 candle immediately reversed. The sweep candle (08:00–08:15 period) left an FVG between $2,307.40 (the high of the candle before the impulse reversal) and $2,309.80 (the low of the candle after the impulse reversal).

## Entry

Price retraced into the FVG at $2,308.60 at 09:02 UTC.

- **Entry**: $2,308.60
- **Stop**: $2,303.50 (below the sweep low with $2.50 buffer)
- **TP1**: $2,326.00 (nearest swing resistance)
- **TP2**: $2,341.00 (equal highs — full draw on liquidity)
- **R:R to TP1**: 3.5:1

## Trade Management

Price moved up steadily through London. TP1 was hit at 11:40 UTC — 50% of the position was closed. Stop was moved to breakeven on the remaining position.

New York open saw a brief pullback to $2,321 (holding above the breakeven stop) before price pushed higher. TP2 at $2,341 was hit at 15:22 UTC during the New York session.

Full trade duration: approximately 7 hours.

## Key lessons from this trade

**Lesson 1 — Sunday analysis is the edge**: This trade was identified Sunday night. Monday morning was execution only. Traders who analyse in the moment are reacting; traders who analyse on weekends are executing a plan.

**Lesson 2 — XAUUSD sweeps are aggressive**: Gold moves fast. The sweep happened in 15 minutes and the FVG filled within 45 minutes of the sweep. Be ready to act at the London open — entries sit for hours on forex pairs but minutes on gold.

**Lesson 3 — COT confirmed the long bias**: Without COT backing, this might have been a 50/50 decision. With Large Specs strongly adding to net longs and the Index at 67, the long bias was clear before price action even set up.

**Lesson 4 — Equal lows are the most reliable sweep level**: Retail sell stops sit below double lows and equal lows predictably. If you do not have equal highs or lows to work with, the setup is less structured.

## Key takeaways
- Pre-session Sunday analysis creates the plan; London open is execution
- XAUUSD sweeps are fast — the FVG entry window is often 30–60 minutes, not hours
- COT + price structure alignment is the highest-conviction setup available
- Taking 50% at TP1 and moving stop to breakeven removes all downside risk on the runner`,
      },
      {
        slug:     "may-2026-week4-gbpusd-short",
        title:    "May 2026 week 4 — GBPUSD shorting into premium OB",
        duration: "29 min",
        order:    2,
        published: true,
        level:    2,
        summary:  "Reviewing a bearish GBPUSD OB + BOS trade into a premium zone.",
        points:   ["Bearish structure identification", "Premium vs discount zones", "OB entry into HTF supply"],
        body: `# May 2026 Week 4 — GBPUSD Shorting Into Premium OB

## Trade overview

This lesson reviews a bearish GBPUSD trade from the week of May 26–30 2026. The setup was an OB + BOS continuation short into a premium zone, executed during the London killzone.

## What you'll learn
- How to identify whether price is in a premium or discount zone before entering
- Why the bearish OB was valid for this setup and how it was drawn
- Trade outcome and what it confirms about shorting into premium

## Pre-session Analysis

**COT GBPUSD**: Large Spec net was −42,000 — mildly bearish. Index at 38 — below midpoint, bearish cycle. WoW change was negative (adding shorts).

**Daily**: Bearish structure — LH and LL pattern forming since May 10. Most recent LH at 1.2786. The PDH from May 27 was 1.2752.

**H4**: Clear downtrend. A BOS had occurred on May 23 breaking below 1.2680. Price had retraced to an H4 bearish OB between 1.2748–1.2762.

**Premium/Discount context**: The 50% level of the last bearish impulse (from 1.2786 to 1.2622) was 1.2704. Price was at 1.2750 — above the 50% level, in premium territory. In a bearish trend, premium is where you sell. This alignment was strong.

## The Setup

On Tuesday May 28, London open, price rallied from 1.2718 during the Asian session to 1.2753 — pushing into the H4 bearish OB zone (1.2748–1.2762).

The rally into the OB was the pullback after the prior week's bearish BOS. Three criteria confirmed the OB entry:
1. BOS confirmed (May 23 break below 1.2680)
2. Price in premium zone (above 1.2704 midpoint)
3. Retrace reached the H4 OB (1.2748–1.2762)

## Entry

H1 chart showed a CHoCH within the OB at 09:22 UTC — a small bullish swing high broke to the downside, confirming the OB zone was holding. Entry triggered at 1.2746 on the M15 CHoCH confirmation.

- **Entry**: 1.2746
- **Stop**: 1.2768 (above the OB high with 6-pip buffer)
- **TP1**: 1.2680 (prior BOS level — nearest liquidity)
- **TP2**: 1.2622 (swing low — full draw on liquidity)
- **R:R to TP1**: 3:1

## What is a Premium Zone?

In ICT methodology, markets move in ranges between draws on liquidity. Within any range:
- **Premium** = the upper portion (above 50% of the range). This is where institutions sell.
- **Discount** = the lower portion (below 50%). This is where institutions buy.

For a long trade, you want to buy in discount. For a short trade, you want to sell in premium. Entering a short in discount (near the bottom of a range) is the most common error — you are trying to short at the same level institutions are buying.

## Key lessons

**Lesson 1 — OB validity requires prior BOS**: This OB was valid because it preceded a confirmed bearish BOS. Without that BOS, it was just a random candle.

**Lesson 2 — Premium zone adds conviction to short entries**: The confluence of OB + BOS + premium zone + bearish COT is as strong as the setup gets. Each layer adds independent probability.

**Lesson 3 — Lower-TF CHoCH confirmation**: Rather than entering the moment price touched the OB, waiting for the H1/M15 CHoCH to confirm that the OB was holding reduced the risk of entering into a deeper pullback.

**Lesson 4 — COT was weak bearish, not strongly bearish**: The position size was kept at 0.5% (not 1%) because COT conviction was mild. On strongly bearish COT signals, size can be increased to 1%.

## Key takeaways
- Sell in premium (above 50% of the range), buy in discount (below 50%) — this filters out most bad entries
- OB validity requires a prior BOS — do not trade random OBs in ranging conditions
- H1/M15 CHoCH confirmation inside the OB improves entry precision and reduces risk
- Match your position size to COT conviction — strong signal = full size, weak signal = half size`,
      },
      {
        slug:     "may-2026-week3-nas100-bos-retrace",
        title:    "May 2026 week 3 — NAS100 BOS retrace, what I saw",
        duration: "31 min",
        order:    3,
        published: true,
        level:    2,
        summary:  "Reviewing a NAS100 BOS retrace setup and what almost went wrong.",
        points:   ["NAS100 structure specifics", "The BOS + retrace on indices", "What almost went wrong"],
        body: `# May 2026 Week 3 — NAS100 BOS Retrace, What I Saw

## Trade overview

This lesson reviews a NAS100 trade from May 19–23 2026 — a BOS + retrace long setup during the New York open. It also covers what nearly caused the trade to be skipped and the lesson that provides.

## What you'll learn
- How NAS100 structure differs from forex pairs in terms of speed and pip size
- The specific BOS + retrace that triggered this trade and why it was valid
- What nearly caused this trade to be missed and the lesson in that near-miss

## NAS100 Specifics

NAS100 (the NASDAQ 100 futures contract) is one of the most volatile and fast-moving instruments available to retail traders. Key differences from forex:

- **Point-based, not pip-based**: moves are measured in points. A 50-point move on NAS100 is approximately equivalent to a 5-pip move on EURUSD in terms of percentage.
- **Faster price delivery**: structure breaks on NAS100 happen faster and often more explosively than on forex pairs. A bullish BOS on NAS100 H1 can be a 200-point impulse candle.
- **New York session dominance**: NAS100 is most active during the New York open (13:00–15:00 UTC). The Asian and London sessions produce less reliable structure.
- **Earnings and macro sensitivity**: Be aware of major tech earnings (Apple, Microsoft, Nvidia, Meta) and CPI/FOMC announcements — these cause extreme volatility that overrides technical setups.

## The Pre-Session Analysis

**COT NAS100**: Futures (E-mini NASDAQ) showed Large Spec net at +88,000 — bullish. Index at 58 — moderate, room to run.

**Daily**: Clean bullish structure from May 12. After a sharp selloff in early May, structure had shifted with a CHoCH on May 12 and a BOS on May 15.

**H4**: Pullback was forming. The BOS impulse from May 19 (breaking above 18,450) left an FVG between 18,412 and 18,438.

## The Near-Miss

On Monday May 20, price pulled back toward the H4 FVG. By the Asian session, price had reached 18,435 — just inside the FVG. However, the New York open had not yet started, and this was a forex trader reviewing the NAS100 setup.

The temptation was to enter during the Asian session at 18,435. This would have been wrong — NAS100 Asian session moves are unreliable and the entry would have been caught in a further pullback to 18,395 (below the FVG low) during London, potentially stopping out before the real move.

The lesson: **NAS100 entries on daily/H4 setups belong in the New York open killzone, not during London or Asia.**

## The Actual Entry

At 13:18 UTC on Tuesday May 21 (New York open), price had pulled further to 18,388 — slightly below the original FVG but inside the OB zone identified (the last bearish candle before the bullish BOS impulse had a body range of 18,371–18,412).

- **Entry**: 18,395 (inside OB zone, M15 CHoCH confirmation)
- **Stop**: 18,340 (below OB low with 31-point buffer)
- **TP**: 18,560 (next significant swing high)
- **R:R**: 3:0:1

Price reached TP at 15:42 UTC the same day — a 2.5-hour trade.

## Key lessons

**Lesson 1 — Instrument-specific session awareness**: NAS100 belongs in New York. Entering NAS100 setups during Asian or London sessions introduces unnecessary risk.

**Lesson 2 — The near-miss teaches patience**: Had the trade been entered at 18,435 during Asia, it would have been stopped out before the actual move. Patience with session timing produced the valid entry.

**Lesson 3 — OB provided a second entry zone when FVG was briefly breached**: When price dipped below the FVG low, the OB below provided the actual entry. Having both zones drawn means you are not stuck if price goes slightly deeper than expected.

**Lesson 4 — Fast profits on NAS100**: The trade resolved in 2.5 hours. NAS100 moves fast — be ready to move stops aggressively and do not expect the same slow development as a multi-day forex trade.

## Key takeaways
- NAS100 is a New York session instrument — apply your H4/daily setups in the NY killzone only
- The OB zone provides a backup entry when price overshoots the FVG slightly
- NAS100 trades resolve faster than forex — active trade management is important
- Drawing both FVG and OB zones for the same setup gives you two valid entry levels, not one`,
      },
    ],
  },
  {
    slug:        "prop-firm-preparation",
    title:       "Prop Firm Preparation",
    description: "Everything you need to pass a funded evaluation: consistency rules, max drawdown rules, and a 30-day plan.",
    tier:        "funded",
    icon:        "workspace_premium",
    color:       "var(--gold)",
    order:       6,
    published:   true,
    lessons: [
      {
        slug:     "choosing-the-right-prop-firm",
        title:    "Choosing the right prop firm for an SMC trader",
        duration: "20 min",
        order:    1,
        published: true,
        level:    3,
        summary:  "How to select a prop firm that suits the Smile FX trading style.",
        points:   ["Key evaluation criteria", "Firms that suit SMC trading", "Red flags to avoid"],
        body: `# Choosing the Right Prop Firm for an SMC Trader

## What you'll learn
- The specific evaluation rules that matter most for an SMC / ICT trading style
- Which prop firm structures are compatible with killzone-based trading
- Red flags in prop firm terms that disqualify them for this style

## Why Prop Firm Selection Matters

Not all prop firm evaluations are designed for the same trading style. A firm that works perfectly for a high-frequency scalper may be impossible for a swing trader who holds positions overnight. An SMC trader using Kondwani's system takes 3–8 trades per week in London and New York sessions, holds for hours, uses 0.5–1% risk, and targets 2:1–4:1 R:R.

Before you attempt any evaluation, verify that the firm's rules are compatible with this profile.

## The Key Rules to Check

**Maximum Daily Loss**: Most firms have a daily loss limit of 4–5% of the starting account. At 0.5–1% risk per trade, you can take 4–10 losses in a day before hitting the limit. This is compatible. Firms with 2% daily limits are problematic — two bad trades end your day, creating pressure that leads to poor decisions.

**Maximum Drawdown**: A 10% maximum drawdown is standard. An 8% drawdown is tighter but workable at low risk. Do not attempt firms with 5% maximum drawdown — one large gap event or news spike can end your account.

**Minimum Trading Days**: Some firms require 10–30 minimum trading days in a phase. This is fine — it prevents people from getting lucky in one big trade. It suits a consistent 3–5 trades per week approach.

**News trading restriction**: Many firms ban trading 2–5 minutes around high-impact news events (NFP, FOMC, CPI). This should not affect Kondwani's style — we avoid trading into major news anyway. But check the exact definition and avoid firms that ban trading for 30+ minutes around news.

**Weekend holding restriction**: Some firms prohibit holding positions over the weekend. This eliminates swing trades that mature into Friday. Plan your trading accordingly or choose firms that allow weekend holding.

**No hedging restriction**: Not relevant for this system (we do not hedge within a single firm), but note it if you plan to trade correlated pairs.

## Firms That Suit SMC Trading (General Criteria)

Rather than naming specific firms (which change their terms frequently), look for firms that:
- Allow news trading with a 2-minute or shorter restriction window
- Have at minimum 10% maximum overall drawdown
- Have 4–5% daily loss limits
- Do not cap the number of trades per day
- Use MT4 or MT5 — compatible with all major brokers offering our instruments
- Have a track record of paying traders (check communities and reviews)

## Red Flags to Avoid

- **Consistency rules**: some firms require that no single trade constitutes more than 40% of your total profit. This penalises good trades and incentivises taking more trades when you should be selective
- **Maximum lot size restrictions**: ensure the lot size the firm allows is sufficient for your target account size and risk parameters
- **"We can close your account if we feel like it" clauses**: legitimate firms have clear, objective rules. Vague language about sole discretion is a red flag
- **Very cheap evaluations that seem too good**: these are often scam operations. Pay a reasonable price for a reputable firm

## Key takeaways
- Verify daily loss limit, maximum drawdown, news restrictions, and minimum trading days before signing up
- 10% maximum drawdown and 4–5% daily loss limit are the minimum acceptable parameters for this style
- Avoid consistency rules and vague discretionary clauses
- Read reviews in trading communities before paying any evaluation fee`,
      },
      {
        slug:     "30-day-challenge-plan",
        title:    "The 30-day challenge plan: 0.5% risk, 5 trades per week",
        duration: "25 min",
        order:    2,
        published: true,
        level:    3,
        summary:  "A structured 30-day evaluation strategy for SMC traders.",
        points:   ["Week-by-week structure", "Profit target pacing", "Rule adherence during evaluation stress"],
        body: `# The 30-Day Challenge Plan: 0.5% Risk, 5 Trades Per Week

## What you'll learn
- How to pace your profit target across 30 days without taking unnecessary risk
- The week-by-week psychological and tactical approach
- How evaluation stress specifically affects decision-making and how to guard against it

## The 30-Day Structure

Most prop firm evaluations run 30 days with a profit target of 8–10% and a 10% maximum drawdown. At 0.5% risk, a 3:1 R:R, and a 60% win rate, the expected value per trade is approximately 1.3% of account (0.6 × 1.5% − 0.4 × 0.5%). Over 20 trades in 30 days, the expected return is 26% — well above the 8–10% target.

The plan: **5 trades per week, 4 weeks, maximum 0.5% risk per trade.** The target is to reach the profit threshold comfortably by the end of week 3, leaving week 4 as buffer.

## Week-by-Week Breakdown

**Week 1 — Establish rhythm**:
- Focus entirely on valid setup execution, not on the profit target
- Take only A and B grade setups from the Validator
- Target: 5 trades, break even or small positive is a success
- Avoid the temptation to trade more because "the target is only 8%"

**Week 2 — Build momentum**:
- By week 2, you should be 2–4% in profit if executions have been clean
- Continue the same discipline — 5 trades maximum
- If you are behind target by week 2, do NOT increase risk to catch up. Instead, review the journal for execution issues.

**Week 3 — Protect the profit**:
- If you reach 6–7% profit in week 3, you are ahead of target
- Reduce to 0.25% risk per trade — protect the account
- A losing week 3 at 0.25% risk cannot blow the evaluation; a 0.5% risk mistake could cost you 3–4%

**Week 4 — Cross the line cleanly**:
- If the target is reached, stop trading or continue at minimal risk
- If not reached in week 3, approach week 4 normally at 0.5% risk
- Never trade more than 5 setups per week to chase the target

## Evaluation Stress: The Hidden Risk

The evaluation environment changes how you think about setups. On a live account, a B-grade setup might get skipped. On an evaluation where the target is $400 away and there are 3 days left, that same B-grade setup suddenly "looks like an A."

This cognitive bias is universal. The only defence is rules that do not change based on context:
- Minimum B grade from Validator (no exceptions during evaluation)
- Maximum 0.5% risk (no exceptions regardless of proximity to target)
- Daily loss limit observed (stop at 1.5% daily drawdown, regardless of time remaining in the evaluation)

Write these rules on a card. Put it on your desk. Read it before every session.

## When You Fail an Evaluation

Treat it as tuition, not failure. After a failed evaluation:
1. Export your trades and review every setup in the journal
2. Identify the specific error that caused the failure (usually 1–3 large losses from emotion-driven trades in the final week)
3. Address that specific error before retrying
4. Consider doing 30 days of paper-trading under the same rules before paying for another evaluation

## Key takeaways
- 5 trades per week × 4 weeks at 0.5% risk — stick to this regardless of where the profit target stands
- The evaluation stress changes your perception of setups. Pre-commit to your rules in writing before you begin
- If ahead by week 3, reduce to 0.25% risk and protect the account
- A failed evaluation is a practice session with a fee — extract the lesson before retrying`,
      },
      {
        slug:     "passing-the-evaluation",
        title:    "Passing the evaluation: rules, mindset, and daily process",
        duration: "22 min",
        order:    3,
        published: true,
        level:    3,
        summary:  "The daily execution process during a live prop firm evaluation.",
        points:   ["Pre-session routine", "During-session discipline", "End-of-day review"],
        body: `# Passing the Evaluation: Rules, Mindset, and Daily Process

## What you'll learn
- The specific pre-session routine that maximises execution quality during an evaluation
- How to manage your mindset when you are in drawdown mid-evaluation
- The end-of-day review process that compounds your learning across the 30 days

## The Pre-Session Routine (45 minutes before London open)

This is non-negotiable during an evaluation. Cutting this routine to save time is one of the most common reasons evaluations fail.

1. **Check the COT page** (5 min): Has the Large Spec signal changed from last week? Any major COT shifts overnight?
2. **Review the daily chart for each target pair** (10 min): Identify the current structure state. Where are the nearest draws on liquidity? Mark them.
3. **Check for high-impact news today** (2 min): If NFP, FOMC, or CPI is releasing today during your planned session, either set a hard stop before the release or skip the day entirely
4. **Update the Trend Matrix** (5 min): Any structural shifts from yesterday that change your bias?
5. **Pre-define the trade plan** (10 min): Write in your journal: "Today I am looking for [long/short] on [pair] because [structure/COT reason]. My invalidation is [specific level]. If this setup does not appear by [killzone end time], I will not trade today."
6. **Check account status** (3 min): Where is the evaluation account relative to the profit target and maximum drawdown? Knowing this prevents surprises.

## During-Session Discipline

During the killzone (08:00–10:00 UTC London or 13:00–15:00 UTC New York):

- Watch the pre-identified pair(s) only. Do not "explore" other setups.
- If the setup appears: run the Validator, confirm grade A or B, size at 0.5%, set stop and target, then **walk away from the screen**. Let the trade develop. Watching tick-by-tick is the number one cause of premature exits.
- If the setup does not appear by killzone end: **do not trade.** Write "No valid setup today" in your journal and close the platform.

The hardest skill in an evaluation is not trading when there is no setup. The urge to force a trade — any trade — intensifies when you are close to the profit target. Resist it.

## Managing Drawdown Mid-Evaluation

If you find yourself in a 4–5% drawdown in the first two weeks:

- Do not increase risk to recover — this is statistically guaranteed to increase the final drawdown
- Review the last 5 trades in your journal. What was the error? Was it setup quality, execution, or simply a bad variance run with valid setups?
- If setup quality is the issue: go back to basics. Only take setups that score 90%+ on the Validator for the next 5 sessions
- If it was valid trades that did not work: trust the edge, continue at the same risk level

A 5% drawdown with 12 days remaining at 0.5% risk and a 60% win rate is still recoverable. A 5% drawdown followed by a 3% chase trade that fails leaves you with only 2% before the maximum drawdown is hit.

## End-of-Day Review (15–20 minutes after session)

Every trading day during an evaluation:

1. Screenshot the chart showing every entry and exit from today's session
2. Open the journal and write 3–5 sentences about each trade: what the setup was, whether it was valid, and what the outcome was
3. Rate your execution 1–5 (separate from the trade outcome — a valid trade that lost can still get 5/5 for execution)
4. Note one thing to watch for in tomorrow's session

This review practice, done daily, compounds your learning faster than any single lesson. By day 30, you will have a detailed record of your 30-day process — whether you pass or fail, this record is your most valuable asset.

## Key takeaways
- The 45-minute pre-session routine is the most valuable time spent during an evaluation — do not skip it
- During the session: execute the pre-defined setup and then do not interfere with the trade
- Drawdown recovery through consistent execution beats recovery through increased risk every time
- The end-of-day review is your compounding tool — 30 days of reviews equals 30 trading lessons`,
      },
      {
        slug:     "after-the-evaluation",
        title:    "After the evaluation: scaling, payouts, and the next step",
        duration: "18 min",
        order:    4,
        published: true,
        level:    3,
        summary:  "What comes after passing: scaling plans, payouts, and growth.",
        points:   ["First payout process", "Scaling rules", "The path from one account to multiple"],
        body: `# After the Evaluation: Scaling, Payouts, and the Next Step

## What you'll learn
- How to request your first payout and what to expect from the process
- How funded account scaling works and when to request scale-ups
- The mindset shift required when trading at larger account sizes

## The First 30 Days Funded

Passing the evaluation is a milestone, but it is the beginning, not the end. Most traders are surprised to find that their psychology changes again once they are trading real firm money. The first 30 days funded require the same discipline as the evaluation — often more, because the payouts are real.

**Continue the same system**: Do not change anything. The same risk, the same pairs, the same sessions, the same Validator criteria. The most common error after passing is "celebrating" by taking larger risks or exploring new setups. This is the fastest path to a drawdown that triggers a reset or termination.

**Treat payout as the goal, not profit**: Your first payout confirmation that the system works. Aim to qualify for your first payout (typically after 30 days and reaching the firm's threshold) before thinking about scaling.

## How Payouts Work

Most firms pay out 80–90% of profits. At a $50,000 funded account and 8% profit, your payout would be:
- $50,000 × 8% = $4,000 total profit
- 80% profit split = **$3,200 payout**

Payout timelines: typically 5–14 business days after request. Keep a record of all trade history screenshots before requesting — this prevents disputes.

## Scaling Plans

Once you have proven consistent performance (typically 3–6 months of profitable trading), most firms offer scale-up programs. Common structure:
- Pass 3–6 months with no drawdown violations and consistent profitability
- Account doubles (e.g. $50,000 → $100,000) or increases by 25–50%

Some firms scale aggressively (doubling every 3 months). Others are conservative. Choose based on what matches your proven performance — do not accept a scale-up to $200,000 if you have only 60 days of trading history. The psychological pressure at larger account sizes is real and requires time to adapt to.

## The Mindset Shift at Larger Sizes

At $50,000 with 1% risk, a loss is $500. At $200,000 with 1% risk, a loss is $2,000. The market behaviour is identical. The mathematics are identical. But your brain will not treat them the same.

Prepare by gradually scaling your mental model:
- When you first get the funded account, remind yourself frequently that you are managing the firm's capital, not yours — it removes personal emotional attachment
- When the account grows, review the journal to confirm your win rate and R:R are consistent before the scale-up
- If you notice your decision-making changing at larger sizes (more hesitation, different holding periods, earlier exits), scale back down temporarily and re-stabilise

## Running Multiple Funded Accounts

Some traders with a proven system eventually manage 2–4 funded accounts simultaneously across different firms. This diversifies the risk of a single firm's rules or policies affecting your income.

The criteria before attempting multiple accounts:
- Minimum 6 months of consistent profitable trading at one firm
- A track record in your journal that proves repeatability
- Kondwani's system is well-suited to this approach — the same Sunday analysis and killzone execution works identically across all accounts

## Key takeaways
- The first 30 funded days require the same discipline as the evaluation — no system changes
- First payout is the goal before thinking about scaling
- Psychological pressure increases with account size — allow time to adapt before accepting large scale-ups
- Multiple funded accounts are the end goal, but only after 6+ months of proven single-account performance`,
      },
    ],
  },
] as const;

// ── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding academy courses and lessons...");

  for (const courseData of COURSES) {
    const { lessons, ...courseFields } = courseData;

    const course = await prisma.course.upsert({
      where:  { slug: courseFields.slug },
      update: {
        title:       courseFields.title,
        description: courseFields.description,
        tier:        courseFields.tier,
        icon:        courseFields.icon,
        color:       courseFields.color,
        order:       courseFields.order,
        published:   courseFields.published,
      },
      create: courseFields as {
        slug: string; title: string; description: string;
        tier: string; icon: string; color: string;
        level?: number; order: number; published: boolean;
      },
    });

    console.log(`  Course: ${course.title} (${course.id})`);

    for (const lessonData of lessons) {
      const lesson = await prisma.lesson.upsert({
        where:  { courseId_slug: { courseId: course.id, slug: lessonData.slug } },
        update: {
          title:     lessonData.title,
          duration:  lessonData.duration,
          body:      lessonData.body,
          summary:   lessonData.summary,
          points:    [...lessonData.points],
          order:     lessonData.order,
          published: lessonData.published,
        },
        create: {
          courseId:  course.id,
          slug:      lessonData.slug,
          title:     lessonData.title,
          duration:  lessonData.duration,
          body:      lessonData.body,
          summary:   lessonData.summary,
          points:    [...lessonData.points],
          level:     lessonData.level,
          order:     lessonData.order,
          published: lessonData.published,
        },
      });
      console.log(`    Lesson: ${lesson.title}`);
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
