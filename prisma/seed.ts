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

Smart money refers to the large institutional participants in the forex and financial markets: central banks, hedge funds, commercial banks, investment banks, prop trading firms, and sovereign wealth funds. These are entities that trade in sizes measured in billions, not thousands.

When a hedge fund needs to buy 500 million euros, they cannot simply place a market order. That would move the market significantly against them. Instead, they engineer price to the levels where they already have pending orders, the areas where opposing liquidity exists. This is the core of Smart Money Concepts.

The retail trader, by contrast, is reacting to price. They see a pattern, place an order, and hope. The institutional trader is *creating* the price move. Understanding this distinction is the beginning of trading differently.

## Why Retail Traders Consistently Lose

The statistics are brutal. Studies consistently show that over 70–80% of retail forex traders lose money. The reason is not lack of intelligence. It is that retail traders are taught patterns and indicators designed by retail educators who were themselves retail traders. The patterns they teach (head and shoulders, double tops, MACD crossovers) are known to institutions and are actively hunted.

Consider the stop loss. Retail traders are taught to place stops just below support or above resistance. This creates a predictable concentration of orders at those levels. When price sweeps those levels and triggers those stops, it is not random. It is institutional order filling. The institution needed to buy; retail provided the liquidity at the sweep low.

This is not conspiracy. It is market microstructure. Liquidity must come from somewhere, and retail stop orders are the most predictable source.

## The ICT Methodology

ICT (Inner Circle Trader) is a framework developed over decades of studying how institutional price delivery works. The core insight is that price does not move randomly. It moves to specific levels to accomplish specific goals: collecting liquidity, delivering price to a fair value zone, and reaching the next draw on liquidity.

The Smile FX Traders system is built on this foundation. Everything in the rulebook (FVGs, Order Blocks, BOS, CHoCH, killzones) is a specific manifestation of institutional order flow. When you understand why price moves, you can anticipate where it is going next instead of chasing where it has been.

## How to apply it

As you progress through this course, you are building a mental model shift. Start practising this exercise:

1. Look at any recent price move on the daily chart of EURUSD
2. Ask: "Where is the liquidity above or below current price?" (Look for equal highs, equal lows, previous day highs and lows)
3. Ask: "Where would price need to go to collect that liquidity before making a real move?"
4. Watch how price actually behaves relative to those levels over the coming days

This exercise alone, done consistently for two weeks, will change how you see a chart forever.

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

Market structure is the framework that tells you whether price is in an uptrend, downtrend, or range. Before you look for any entry model (FVG, OB, sweep) you need to establish structure first. Entering without structure context is guessing.

An **uptrend** on the entry timeframe is defined by a series of Higher Highs (HH) and Higher Lows (HL). Each swing high is higher than the last; each pullback makes a higher low. Price is in a bullish delivery phase.

A **downtrend** is defined by Lower Highs (LH) and Lower Lows (LL). Each rally fails at a lower level; each drop makes a new low. Price is in a bearish delivery phase.

A **range** is when neither pattern is clear: highs and lows are roughly equal. This is the hardest environment to trade and often means you should wait.

## Break of Structure (BOS)

A Break of Structure confirms that the current trend is continuing. In a bullish market structure, price pulls back, forms a Higher Low, then breaks above the previous swing High. This is a BOS. It confirms the trend and is your signal to look for long entries on the next pullback.

In a bearish structure, price rallies to form a Lower High, then breaks below the previous swing Low, a bearish BOS. Look for shorts on the next rally.

The key characteristic of a BOS is that it happens *with* the existing trend. It is a continuation signal, not a reversal.

## Change of Character (CHoCH)

A Change of Character is the first signal that the trend may be reversing. In a bullish trend, a CHoCH occurs when price breaks *below* the most recent Higher Low. This is the first lower low, and it suggests the bullish structure may be ending.

In a bearish trend, a CHoCH occurs when price breaks *above* the most recent Lower High, the first higher high in a downtrend.

The critical rule: a CHoCH alone is not a trade signal. It is a warning. You need confluence (a sweep of liquidity, a valid POI, and session alignment) before acting on a CHoCH. Many traders get burned by fading a strong trend on the first CHoCH only to see price resume the original direction.

## Why Structure Determines Your Bias

Your bias is the direction you are willing to trade. If the daily chart shows bullish structure (HH HH HL HL), your bias is long. You will only look for buy setups on the H1 or H4. You will ignore short setups, no matter how good they look in isolation, because they conflict with the higher timeframe picture.

This is what Kondwani means when he says "HTF first, entry TF second." The daily and H4 tell you the story. The H1 and M15 tell you where to enter.

## How to apply it

1. Open EURUSD on the daily chart. Mark every swing high and swing low over the last 30 days
2. Label each as HH, HL, LH, or LL
3. Identify the most recent BOS: which direction did it confirm?
4. Drop to the H4. Does the H4 structure agree with the daily? If yes, you have HTF alignment
5. Only then look for entries in the confirmed direction on H1

## Common mistakes

- Marking every wick as a swing high/low. Use bodies + significant wicks; ignore minor impulses
- Calling a CHoCH a reversal immediately. Wait for the next move to confirm before trading the new direction
- Ignoring HTF structure when a lower timeframe setup looks compelling

## Key takeaways
- BOS confirms trend continuation. Look for entries in the BOS direction on pullbacks
- CHoCH signals a potential reversal. Treat it as a warning, not a trade
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

When price "sweeps" a level (briefly breaks through and immediately reverses), it is collecting those orders. The institution triggered the stops of traders on the wrong side, filled their own position, then price moved in the direction the institution intended.

This is the foundational concept behind every model in the Smile FX rulebook. The sweep is the fuel. The model is how you enter after the fuel is collected.

## Equal Highs and Equal Lows

Equal Highs (EQH) are two or more swing highs at approximately the same price level. Every retail trader can see them; every retail trader places their buy stop just above them. This creates a predictable cluster of buy orders above those highs.

Equal Lows (EQL) are the mirror image: two or more swing lows at the same level, with retail sell stops just below them.

These are the highest-probability liquidity pools on any timeframe. When you see equal highs on the H4, you know two things: (1) retail traders have buy stops clustered just above them, and (2) if the daily bias is bearish, price is highly likely to make a brief move above those highs to collect that liquidity before reversing hard.

## Other Liquidity Pools

Beyond EQH/EQL, high-probability liquidity sits at:

- **Previous Day High (PDH) and Previous Day Low (PDL)**: the most commonly watched levels by retail traders
- **Previous Week High/Low**: especially relevant for swing traders
- **Session highs and lows**: the Asian range high/low are classic liquidity pools for the London session
- **Round numbers**: 1.0900, 1.1000, 1.0850 etc. attract retail stops

When multiple liquidity types coincide at the same level (e.g. PDH aligns with EQH), the level becomes extremely significant.

## Stop Hunt Mechanics

A stop hunt follows a predictable pattern. On a bearish daily structure:

1. Price rallies during the Asian session or early London into the EQH / PDH level
2. A brief wick prints above those highs: stops triggered, buy orders filled
3. Price reverses hard and moves lower
4. The momentum candle leaving the sweep often contains the FVG or OB you will enter on

The critical insight: the sweep is not a random spike. It is the delivery mechanism for institutional buying (on a sweep of lows) or selling (on a sweep of highs). Once you identify the sweep and the structure context, you know exactly where to look for your entry.

## How to apply it

1. On XAUUSD H4, look for the two or three most obvious equal highs or equal lows visible to any chart reader
2. Note which direction the daily bias points
3. Watch whether price makes a brief move *into* those highs (if bearish bias) or lows (if bullish bias) before reversing
4. Mark the candle that swept the level. This candle's body or the FVG it created is often your entry zone

## Common mistakes

- Confusing a legitimate breakout with a stop hunt. A real breakout closes strongly above the level; a sweep wicks through and immediately reverses
- Marking too many levels. Focus on the most obvious ones, the ones every retail trader can see
- Trying to enter *during* the sweep. Wait for the reversal candle to confirm the sweep is complete

## Key takeaways
- Liquidity pools are clusters of pending orders and stop losses that institutions target
- Equal Highs/Lows, PDH/PDL, and session highs/lows are the most significant pools
- The sweep is deliberate: price collects liquidity before delivering in the true direction`,
      },
      {
        slug:     "fair-value-gaps",
        title:    "Fair Value Gaps: identifying and trading imbalances",
        duration: "25 min",
        order:    4,
        published: true,
        level:    1,
        summary:  "How to find and trade Fair Value Gaps.",
        points:   ["What creates an FVG", "How to draw FVG zones", "Entering on FVG retracement"],
        body: `# Fair Value Gaps: Identifying and Trading Imbalances

## What you'll learn
- What a Fair Value Gap is and why it forms
- How to correctly identify and draw FVG zones on your chart
- How to enter trades using FVG retracements with precision

## What is a Fair Value Gap?

A Fair Value Gap (FVG) is a three-candle pattern that represents a price imbalance: a zone where price moved so aggressively that not all orders were filled. On a bullish FVG, the gap exists between the wick of the first candle and the wick of the third candle, with the second candle being the large momentum candle that drove price through.

Think of it this way: when price moves from 1.0800 to 1.0850 in one large candle, orders between those levels were not filled at their requested prices. The market is "imbalanced" in that zone. Price has a strong tendency to return to these zones to fill those orders, to re-balance.

This is not retail support and resistance. It is not a pattern. It is the mechanical result of institutional order flow leaving an imbalance that the market will seek to correct.

## How to Draw an FVG

For a **bullish FVG**:
1. Identify a three-candle sequence where the middle candle is a large bullish candle
2. The FVG zone is drawn from the **high of candle 1** (the wick tip of the first candle before the impulse) to the **low of candle 3** (the wick base of the first candle after the impulse)
3. If the wicks of candles 1 and 3 overlap, there is no FVG, because the imbalance was filled during the move itself

For a **bearish FVG**:
1. Identify a three-candle sequence with a large bearish middle candle
2. The zone is from the **low of candle 1** to the **high of candle 3**

The most valid FVGs are those that form during a clean, impulsive structural move, such as a BOS candle or the first leg after a liquidity sweep. FVGs that form in choppy, overlapping price action are less reliable.

## Which FVGs Are Valid?

Not all FVGs are equal. The highest-probability FVGs share these characteristics:

- **Formed during a structural move**: created as part of a BOS or CHoCH leg, not random chop
- **Located in the direction of the HTF bias**: a bullish FVG in a bullish HTF structure
- **Fresh**: price has not yet returned to the zone
- **Size**: a meaningful imbalance, not a tiny two-pip gap

When an FVG also overlaps with an Order Block, the confluence makes it a premium entry zone. We call this an OB+FVG setup, covered in Advanced SMC Models.

## Entering from an FVG

The entry process:
1. Identify the FVG after the structural move (BOS or sweep)
2. Wait for price to retrace into the FVG zone: specifically, the midpoint or the low of the zone for a bullish FVG
3. Look for a rejection sign (a wick, engulfing candle, or a lower-timeframe CHoCH) inside the zone
4. Enter with stop loss below the FVG low (bullish) or above the FVG high (bearish)
5. Target the next draw on liquidity, the liquidity pool that the original impulse was heading for

## Common mistakes

- Entering FVGs that form in choppy sideways price action. These are not valid
- Entering immediately as price touches the FVG without waiting for a reaction or lower-TF confirmation
- Trading FVGs that are multiple sessions old and have been "stale" for too long. Probability decreases as time passes
- Forgetting HTF context: an FVG in a bearish H4 structure is not a buy signal regardless of how clean the zone looks

## Key takeaways
- An FVG is a three-candle imbalance zone where price moved too fast to fill all orders
- Draw from the wick of candle 1 to the wick of candle 3
- The highest-probability FVGs form during clean structural moves and align with HTF bias
- Wait for price to return to the zone and show a reaction before entering`,
      },
      {
        slug:     "order-blocks",
        title:    "Order Blocks: the last opposing candle before the BOS",
        duration: "19 min",
        order:    5,
        published: true,
        level:    1,
        summary:  "Identifying and trading Order Blocks.",
        points:   ["What an Order Block is", "How to draw the OB", "OB confluence with BOS"],
        body: `# Order Blocks: The Last Opposing Candle Before the BOS

## What you'll learn
- The precise definition of an Order Block and why it forms
- How to identify and draw Order Blocks correctly on your chart
- How to use OBs as high-probability entry zones with structure confirmation

## What is an Order Block?

An Order Block (OB) is the last opposing candle (or cluster of candles) before a significant Break of Structure. It represents the area where institutional orders were placed that caused the subsequent structural move.

In a bullish OB: before price breaks a significant high (BOS), the last bearish (down-close) candle or the last cluster of bearish candles before the impulse is the OB. This is where institutions were buying while price was still appearing to move lower, disguising their accumulation.

In a bearish OB: the last bullish candle before a bearish BOS. Institutions were selling while price was making a final rally, trapping late buyers.

When price returns to the OB zone, it is returning to an area where the same institutions have pending orders: the original orders that caused the breakout. They reload at those levels.

## How to Draw an Order Block

**Bullish OB** (for buying):
1. Find a BOS to the upside: a clear break above a significant swing high
2. Look back at the candles immediately before the impulse that caused the BOS
3. Find the last bearish (red/down) candle before the BOS impulse begins
4. The OB zone is from the **open to the high** of that last bearish candle (the body + upper wick)
5. Some traders use a wider definition: the range of the last 1–3 bearish candles

**Bearish OB** (for selling):
1. Find a bearish BOS: price breaking below a significant swing low
2. Last bullish (green/up) candle before the impulse
3. OB zone: from the **open to the low** of that candle

The most important rule: the OB is only valid if the BOS that followed it was significant. Not every small candle before a minor move is an OB.

## OB + BOS Confluence

The setup is:
1. A clear BOS on your entry timeframe
2. Price pulls back to the OB zone
3. Entry inside the OB, stop below the OB low (bullish) or above the OB high (bearish)
4. Target: the next liquidity pool in the BOS direction

This is one of the seven models in the Smile FX rulebook and is arguably the most reliable for continuation trades. The reason: the institution placed orders at the OB level that caused the BOS. When price returns to that level, they fill the same position again at a better price.

## Mitigation

An OB is "mitigated" when price trades through the entire zone, through the open of that last opposing candle. A mitigated OB loses its significance. You should not trade a mitigated OB.

A partially visited OB (price entered but did not fully close through) can still be valid. Watch for a reaction.

## How to apply it

1. Find a recent clear BOS on GBPUSD H1
2. Identify the last bearish candle before the impulse that caused the BOS
3. Mark that candle's range as your OB zone
4. Set a price alert at the OB zone
5. When price returns, drop to the M15 and look for a CHoCH or FVG inside the OB. That is your entry trigger

## Common mistakes

- Marking OBs before insignificant structure moves. Only valid OBs follow meaningful BOS
- Trading a mitigated OB. Once price closes through the open of the OB candle, it is done
- Using OBs without structure context. An OB in a range is not the same as an OB after a clean BOS

## Key takeaways
- The OB is the last opposing candle before a significant Break of Structure
- Draw from the candle's open to its high (bullish OB) or open to low (bearish OB)
- The OB is valid until it is mitigated, meaning price closes through the entire zone
- Always require a BOS before considering an OB trade setup`,
      },
      {
        slug:     "sessions-and-killzones",
        title:    "Sessions and killzones: when to trade and when to wait",
        duration: "14 min",
        order:    6,
        published: true,
        level:    1,
        summary:  "Session windows and high-probability killzone timing.",
        points:   ["The three sessions", "Killzone windows", "When to stay out of the market"],
        body: `# Sessions and Killzones: When to Trade and When to Wait

## What you'll learn
- The three main trading sessions and what each one does to the market
- The specific killzone windows that offer the highest probability for SMC entries
- How to build a session-based routine that protects you from low-probability trades

## The Three Sessions

Forex trades 24 hours a day Monday through Friday, but not all hours are equal. The market has three main sessions defined by the geographic location of the major financial centres:

**Asian Session (Tokyo)**: 00:00–09:00 UTC. Low volume, tight ranges, often choppy. The Asian session typically sets a range (the "Asian box") that the London and New York sessions will hunt. If you see equal highs and equal lows forming in the Asian session, those are next session's targets.

**London Session**: 07:00–16:00 UTC. The most liquid session. London opens when the Asian session is winding down and often makes the biggest move of the day. The first two hours of London (the London Open Killzone) are the highest-probability window for SMC setups.

**New York Session**: 12:00–21:00 UTC. Second highest volume. New York often continues the London move or sets up a reversal. The New York Open Killzone at 13:00–15:00 UTC is another premium entry window.

## Killzones

A killzone is a specific 2-hour window within a session where institutional order flow is most active. During killzones, price moves with purpose: sweeps, BOS moves, and OB/FVG reactions are most reliable here.

**London Open Killzone**: 08:00–10:00 UTC
**New York Open Killzone**: 13:00–15:00 UTC
**Asian Open Killzone**: 00:00–02:00 UTC (lower probability than the other two)

The Smile FX platform's Rules Validator checks whether your entry falls inside the current killzone automatically, but you should understand *why* it matters.

## Why Killzones Work

Institutional traders operate during business hours in their respective cities. When London opens, the biggest desks in the world (Barclays, HSBC, Deutsche Bank) begin executing their sessions' orders. These orders are large enough to move price, create clear BOS moves, sweep liquidity pools that built up overnight, and establish the day's direction.

When you enter a setup inside the killzone after a liquidity sweep and a clear BOS, you are entering alongside that institutional flow. When you enter at 21:00 UTC or during the Asian consolidation, you are fighting a directionless market.

## When to Stay Out

- **Outside killzones**: lower probability, choppy execution
- **Into major news events**: NFP, FOMC, CPI, when price is controlled by the news flow, not structure
- **Friday afternoons**: institutional desks close positions ahead of the weekend; moves are unreliable
- **After a strong trend has run far without a pullback**: chasing is the fastest way to be the liquidity

## How to build your routine

1. Check the daily chart for HTF structure and bias before the London open
2. Mark any nearby liquidity pools (equal highs/lows, PDH/PDL, Asian session range)
3. Between 08:00–10:00 UTC, watch for a sweep of one of those levels
4. If a sweep occurs and price reacts with a BOS/CHoCH on H1 or M15, look for your FVG or OB entry
5. No setup by 10:00 UTC? Close the charts. Wait for New York at 13:00.

## Common mistakes

- Trading the Asian session hoping to "get ahead" of London. This more often leads to being caught in a reversal
- Entering valid-looking setups at 11:00–12:00 UTC (the dead zone between London and New York)
- Ignoring news events. A perfect setup at a valid OB during an NFP release is still dangerous

## Key takeaways
- London Open (08:00–10:00 UTC) and New York Open (13:00–15:00 UTC) are the highest-probability entry windows
- The Asian session builds liquidity that the following sessions will hunt. Use it for analysis, not trading
- If your entry is not inside a killzone, it is a warning flag. Reduce size or skip the trade`,
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

## Step 1: Identify the Liquidity Target

Before the sweep can happen, you need to know what level is going to be swept. On the H4 or H1 chart, identify the most obvious liquidity pool in the direction opposite to your HTF bias:

- If daily structure is bullish, look for equal lows or a PDL below current price. This is where retail sell stops are clustered
- If daily structure is bearish, look for equal highs or a PDH above current price

Mark this level precisely. This is what price will reach before the real move begins.

## Step 2: Wait for the Sweep

During the London or New York killzone, watch for price to make a move *toward* the liquidity level. The sweep candle often looks like:
- A large wick that breaks below the equal lows / PDL (bullish sweep)
- A wick or close above equal highs / PDH (bearish sweep)

The key confirmation: price breaks the level and then immediately begins to reverse. A true sweep does not close far below the level. It wicks through and comes back.

## Step 3: Locate the FVG

As price sweeps the level, the impulse candle that reverses often leaves an FVG. This is the three-candle imbalance covering the zone between the wick of the candle before the impulse and the wick of the candle after it. Draw this zone precisely.

In many cases, the FVG will be 5–15 pips wide on the H1. On higher timeframes it will be larger. The FVG is your entry zone: not a support/resistance level, but the specific imbalance created by the institutional reversal move.

## Step 4: Enter on the Retest

After the sweep impulse, price often retraces. Sometimes it retraces immediately; sometimes it consolidates first. Wait for price to come back into the FVG zone.

Entry: at or near the midpoint of the FVG
Stop: a few pips below the sweep low (bullish) or above the sweep high (bearish), below the *entire* sweep, not just below the FVG
Target: the draw on liquidity on the other side: equal highs in a bullish scenario, equal lows in a bearish one

## How to apply it

1. On EURUSD H1, identify equal lows that have formed over the past 2–3 days
2. Confirm daily structure is bullish
3. Watch the London open (08:00–10:00 UTC) for a wick below those lows
4. When the sweep occurs, mark the FVG on the reversal impulse
5. Place a limit order at the FVG midpoint, stop 10 pips below the sweep low, target the equal highs above

## Common mistakes

- Entering during the sweep candle itself. Wait for it to complete and the FVG to form
- Setting the stop inside the FVG. The stop must be below the sweep low, outside all the swept liquidity
- Treating every move below a low as a sweep. Look for the immediate reversal characteristic

## Key takeaways
- Three confluences required: liquidity sweep + FVG + HTF structure alignment
- The FVG forms on the impulse candle that reverses after the sweep. Draw it precisely
- Stop below the full sweep, not just below the FVG
- This setup requires patience. The entry often comes 30–90 minutes after the sweep`,
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

This is the model to use in clear trending conditions: not in ranges, not when structure is uncertain, and not against the HTF bias.

## Valid BOS Criteria

Not every structure break qualifies. A valid BOS for this model must:

1. Break a **significant** swing high or low, one that has been the accepted boundary for at least 4–6 candles on the entry timeframe
2. Close beyond the level (not just wick through), because a close confirms commitment
3. Be delivered by a momentum candle. A small, slow grind through a level does not carry the same institutional weight
4. Occur inside or near a killzone (London or New York open)

Minor internal structure breaks (small wiggles within the trend) do not generate valid OBs.

## Identifying the OB

After a valid BOS is confirmed:
1. Go back to the candles immediately preceding the impulse candle that caused the BOS
2. Find the **last bearish candle** (for a bullish BOS) or **last bullish candle** (for a bearish BOS) before the impulse began
3. Draw the OB from its open to its high (bullish) or open to its low (bearish)

Sometimes there is a clear single OB candle. Other times there are 2–3 overlapping candles that form an "OB zone." Use the widest range of that cluster.

## Entry and Stop Placement

Wait for price to pull back into the OB zone. This pullback is your opportunity.

Entry: enter at the 50% level of the OB (the midpoint) or at the level where price shows a reaction: a lower-timeframe bullish CHoCH, a wick, an engulfing candle
Stop: below the entire OB zone for a bullish setup, a few pips below the OB low
Target: minimum 2:1 R:R targeting the previous swing high or the next significant liquidity pool

## Trade Management

Once price moves in your favour by 1R (the distance from your entry to your stop):
- Move your stop to breakeven
- Consider taking 50% of the position at 2R
- Let the remainder run to the next draw on liquidity

Never move your stop into profit before price has moved 1R away. Too early and you get stopped out by normal pullback noise.

## Common mistakes

- Trading OBs after insignificant structure breaks. The BOS must be meaningful
- Entering the OB without waiting for a reaction. Use lower-TF confirmation
- Having too tight a stop. It must be below the entire OB, giving the zone room to be tested

## Key takeaways
- OB + BOS is a trend continuation model. Confirm structure direction before looking for the OB
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

The name comes from a counter-trend strategy that fades the "Turtle Trader" breakout system, a famous trend-following method from the 1980s. The insight: when breakout traders all buy the same breakout, they become the liquidity that smart money sells into.

Turtle Soup is a reversal model targeting obvious, well-watched levels that price breaks by a small margin before reversing. It is one of the higher-risk models in the rulebook because it requires you to counter a perceived trend, but when the setup is clean it offers exceptional risk-to-reward.

## Valid Turtle Soup Criteria

1. **Obvious, well-watched level**: Previous Week High/Low, Monthly High/Low, or a very clear set of equal highs/lows that every retail trader can see on their chart
2. **Small false break**: price exceeds the level by a small margin (5–20 pips on most pairs, $1–5 on XAUUSD), not a large momentum breakout
3. **Immediate reversal**: the next 1–3 candles immediately move back below (on a bearish Turtle Soup) or above (bullish) the broken level
4. **FVG or OB on the reversal**: the reversal impulse should leave an entry zone
5. **HTF supply/demand context**: the false break ideally occurs into a higher-timeframe supply zone (bearish) or demand zone (bullish)

If price breaks the level with a large momentum candle and closes significantly beyond it, that is a breakout, not a Turtle Soup.

## The False Break Distinction

The key question: did price commit to the breakout or immediately retreat?

A false break looks like a wick that exceeds the level and comes back in the same candle or the next candle. The candle that breaks the level should close back on the "inside" of the level, showing that the breakout was rejected.

A genuine breakout closes beyond the level with momentum. Do not try to Turtle Soup a genuine breakout.

## Why Avoid This Model in Asia

The Asian session has lower liquidity, which means false breaks happen more frequently for mechanical reasons rather than institutional manipulation. The Turtle Soup model works best in London and New York where institutional intent is real. An Asia-session false break of a level may simply be noise.

## Entry and Risk

Entry: inside the FVG or OB on the reversal candle, after the false break is confirmed
Stop: 5–10 pips above the false break high (bearish Turtle Soup), above the furthest point of the wick
Target: the next draw on liquidity in the reversal direction, often a major swing low (bearish) or high (bullish) on H4

Risk note: because this is counter-trend, run this at your minimum position size until you have 10+ successful examples in your journal.

## How to apply it

1. Mark the most obvious previous week high on GBPUSD on Sunday night
2. During London Monday morning, if price makes a brief move above that high (5–15 pips) then immediately reverses
3. Look for the FVG on the reversal impulse
4. Enter inside the FVG, stop above the false break high, target the Asian session low below

## Key takeaways
- Turtle Soup fades obvious breakouts that are clearly retail stop hunts
- The false break must be small. A large momentum close above the level is a real breakout
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

Smart Money Technique (SMT) divergence occurs when two positively correlated pairs behave differently at a key liquidity level. One pair sweeps the level; the other does not. This divergence signals that the sweep on one pair was a manipulation, not a genuine structural move, and the reversal that follows is high-probability.

The most common SMT pairs on the Smile FX platform:
- **EURUSD and GBPUSD**: both trend similarly against the USD. When EURUSD sweeps equal lows but GBPUSD does not, it signals a bullish reversal on EURUSD
- **XAUUSD and DXY (inverse)**: Gold and the Dollar Index move inversely. When DXY sweeps a high but Gold fails to make a new low, it confirms Gold is likely to rally

## Understanding the Correlation Logic

If EURUSD and GBPUSD are both USD pairs, and the dollar is weakening, both should be making highs together. If EUR makes a new high but GBP does not (or vice versa), it means the move is not driven by genuine USD weakness. One pair's move is a manipulation.

The pair that swept is manipulated. The pair that held is the confirmation. Trade the swept pair in the direction confirmed by the non-swept pair.

## Identifying SMT Divergence

The setup:
1. Both pairs approach a key liquidity level (equal lows, PDL, session low)
2. EURUSD's price briefly goes below the equal lows, sweeping retail sell stops
3. GBPUSD does NOT make a new low. It holds above or at the prior low
4. This divergence is SMT: EURUSD was swept (manipulation); GBPUSD confirms the low holds (real)
5. Enter long on EURUSD at the OB/FVG created by the sweep move

## Why This Is High-Conviction

SMT divergence adds a second-pair confirmation to your setup. Instead of relying solely on EURUSD's price action, you have evidence from a correlated market that the move is manipulative. This is the same logic that institutional analysts use: cross-market analysis to confirm or deny a move.

When you see a Liquidity Sweep → FVG on EURUSD AND SMT divergence confirms it, you have two independent reasons to enter. That is a premium setup.

## Application: the SMT + OB Model

The Smile FX rulebook's "SMT + OB" model specifically requires:
1. A clear liquidity level on both pairs
2. One pair sweeps; the other does not
3. An Order Block on the sweeping pair at the sweep zone
4. Entry inside the OB with stop beyond the sweep

The SMT checkbox in the Rules Validator must be confirmed before you log this model.

## Common mistakes

- Looking for divergence on pairs that are not actually correlated (EURUSD and USDJPY are not SMT pairs; they are negatively correlated)
- Using very minor new highs/lows as the divergence reference point. Use significant swing levels
- Trading SMT without an entry model (OB or FVG). Divergence is confirmation, not an entry signal by itself

## Key takeaways
- SMT divergence occurs when a correlated pair fails to confirm a new high or low made by the other
- EURUSD/GBPUSD and XAUUSD/DXY are the main SMT pairs used in this system
- The non-swept pair is the confirmation; trade the swept pair
- SMT is always a confirmation layer. Combine with OB or FVG for the actual entry`,
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

- Most aggressive: enter at the first touch of the OB/FVG confluence. Do not wait for a lower-TF signal
- Standard: wait for a M15 CHoCH or engulfing candle inside the zone
- Conservative: wait for price to close back above the FVG low (bullish). This sacrifices some R:R but gives you strong confirmation

## When This Model Fails

The model fails most often when:
- The zones are drawn too wide, meaning you included choppy candles in the OB range
- HTF structure has shifted bearish but you are still looking for the old bullish OB+FVG
- Price entered the zone but the daily candle closed beyond it (mitigation), so the zone is invalidated

## How to apply it

1. After a bullish BOS on XAUUSD H1, identify the OB (last bearish candle before impulse)
2. Identify the FVG (three-candle imbalance on the BOS impulse)
3. Check if they overlap
4. If yes, draw the overlap zone and set a limit order at the midpoint
5. Stop below the OB low; target the next equal highs above

## Key takeaways
- OB + FVG confluence is two independent institutional mechanisms at the same price: double confirmation
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

No liquidity sweep is required. No SMT divergence is needed. Just a clean BOS, a structured pullback to a valid zone, and an entry. This is why it is often the first model new traders learn, but it requires a truly trending market to work reliably.

## "Clean Trending Structure" Defined

Clean trending structure means:
- A clear series of HH → HL → HH → HL (bullish) or LH → LL → LH → LL (bearish)
- Each BOS is decisive: it closes beyond the prior high/low with momentum
- Pullbacks are orderly: price retraces 30–50% of the impulse and then resumes
- No choppy sideways price action within the trend

If the structure chart looks like a mess of overlapping swings in both directions, this is NOT the environment for BOS + retrace. Wait for clearer conditions.

## Identifying the Entry Zone After a BOS

After a clean BOS:
1. The BOS impulse candle often creates an FVG. Draw it
2. The last opposing candle before the impulse is the OB. Draw it
3. Wait for price to pull back toward these zones
4. The 50% retracement of the BOS impulse is also a useful target for the pullback

Entry is whichever zone price reaches first: FVG, OB, or the 50% retracement level. Use lower-timeframe confirmation if you want higher precision.

## Risk:Reward Expectations

BOS + retrace typically offers 2:1 to 3:1 R:R. The target is the next significant liquidity pool in the trend direction (next equal highs in a bullish trend). Because there is no liquidity sweep providing the reversal fuel, the setup is a trend continuation, not a massive reversal, so targets tend to be closer.

If a setup shows less than 2:1 R:R, skip it.

## When NOT to Use This Model

- In a ranging or sideways market, where the "BOS" is likely just a range break that will reverse
- When the trend has run very far without a meaningful pullback, when the risk of a deeper retracement or reversal is high
- When the BOS occurred outside a killzone, because the momentum behind it is suspect
- When HTF structure is ranging or against the trade direction

## How to apply it

1. On NZDUSD H1, confirm the past 2–3 days show clean bullish structure (HH, HL pattern)
2. Wait for the next BOS: a close above the last significant high
3. Mark the FVG and OB on the BOS impulse
4. Wait for the first pullback into those zones during the next London session
5. Enter with stop below the OB, target the next swing high

## Key takeaways
- BOS + retrace is the cleanest continuation setup, but it only works in genuinely trending conditions
- Entry zone is the FVG or OB on the BOS impulse; aim for the 50% pullback level
- Minimum 2:1 R:R required. Skip setups that do not meet this
- When structure is ambiguous, this model does not apply. Choose a different setup or wait`,
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

At 5% risk and a 60% win rate, a 10-trade streak of losses (which statistics says *will* happen eventually) can end your trading. At 0.5%, the same streak is a minor bump. You tighten, review, adjust, and continue.

## The Long-Term Compounding Advantage

At 0.5% risk, 60% win rate, and 3:1 R:R, after 200 trades you have compounded your account by approximately 120–180%. At 2% risk with the same statistics, the *average* result is similar, but the variance (the risk of ruin) is dramatically higher. You will experience longer and deeper drawdowns, and the psychological damage from those drawdowns causes traders to make mistakes that destroy the theoretical edge.

Lower risk per trade → smaller drawdowns → better psychological state → better decisions → better execution → better results. It is a compounding loop.

## The 0.5% Starting Point

Kondwani recommends starting at 0.5% risk per trade. This means if you have a $1,000 account, you risk $5 per trade. On EURUSD with a 20-pip stop, that means trading 0.025 lots (a micro lot and a half).

You are not going to get rich in three months. You are going to build a track record, learn your edge, and protect your capital while you do. When your win rate is proven and consistent over 50+ trades, you can consider moving to 1%.

## How to apply it

1. Take your total account balance
2. Calculate 0.5% of that amount. This is your maximum risk in dollars per trade
3. Measure your stop loss in pips/points for the trade
4. Divide your dollar risk by (pips × pip value per lot) to get your lot size
5. The Smile FX position size calculator on the Validator page does this automatically

## Common mistakes

- Risking more on setups that "look better". Your edge is statistical, not per-setup; risk the same every trade
- Reducing risk after losses and increasing after wins, which is the opposite of what emotion tells you
- Confusing account growth speed with account stability. A slow but steady equity curve is worth infinitely more than a volatile one

## Key takeaways
- Drawdown recovery is exponentially harder as the drawdown deepens. Avoid large losses at all costs
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

It is tempting to risk more on setups that look exceptional. The problem: your gut feeling about a setup's quality is not a reliable predictor of its outcome. Your brain's confidence in a trade is often highest right after a winning streak, when you are emotionally in a "hot hand" bias. The data shows win rates do not change based on how confident you felt about a specific trade.

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

## Drawdown Is Normal, But You Need Rules for It

Every professional trader has losing periods. A 10–15% drawdown during a month is not unusual even for experienced traders with a proven edge. The difference between traders who survive and those who blow accounts is not their ability to avoid drawdowns. It is how they behave during them.

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

Sometimes the market is not the problem. You are the problem. Pause trading immediately if you notice:

- Reviewing your trade before the entry, convincing yourself it is valid when you know it is not
- Feeling *desperate* to enter a trade, any trade
- Arguing with your system ("the setup is 90% there, close enough")
- Checking your phone for prices every five minutes during a trade
- Trading to cover a loss from earlier in the day

These are emotional states, not trading states. The market will still be there tomorrow. Your capital, once gone, may not return.

## Key takeaways
- Daily limit: 1–2% loss. Weekly limit: 3%. Monthly: 8–10% triggers a review week
- When you hit a limit, stop immediately. No exceptions, no "just one more"
- Return to live trading at half size after a review period, rebuild to full size over 5 clean sessions
- Emotional states are often more dangerous than bad setups. Learn to recognize them`,
      },
      {
        slug:     "revenge-trading",
        title:    "The revenge trade: recognising and breaking the pattern",
        duration: "20 min",
        order:    4,
        published: true,
        level:    2,
        summary:  "Understanding and eliminating revenge trading from your practice.",
        points:   ["What triggers a revenge trade", "The anatomy of a revenge trade", "Breaking the cycle"],
        body: `# The Revenge Trade: Recognising and Breaking the Pattern

## What you'll learn
- The psychological triggers that cause revenge trading
- How to recognise you are about to make a revenge trade
- Concrete steps to break the cycle before it destroys your account

## What is a Revenge Trade?

A revenge trade is any trade entered primarily to recover a loss, rather than because a valid setup exists. The word "revenge" is accurate. You are emotionally trying to "get back" at the market for taking your money.

The problem: the market is not your opponent. It has no awareness of your loss. The loss is in the past and cannot be undone. But the emotional state it creates (frustration, urgency, damaged pride) is very present, and it overrides your analytical brain and makes you take trades you would otherwise never consider.

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

**Pre-session ritual**: Before every session, write in your journal: "My goal today is clean execution of valid setups. Recovery is not a goal for a single session. It is a goal over 100+ trades."

## Key takeaways
- Revenge trading is any trade taken primarily to recover a loss, not because of a valid setup
- The emotional state after a loss physically degrades decision-making. You need time to reset
- Stop, journal, take a break, then evaluate whether there is a real setup
- The market will always have more opportunities tomorrow. Your capital may not if you revenge trade`,
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

**Setup quality**: "Did this trade meet ALL my entry criteria, without exception?" If yes, it was a valid trade that did not work, and that is normal. If no, you need to identify which criterion was compromised.

**Execution**: "Did I enter at the right price? Did I size correctly? Did I manage the trade according to my rules?"

**Bias check**: "Would I have taken this trade if I had not been looking for a reason to trade?" (Relevant after a winning streak when overconfidence rises.)

**Pattern recognition**: "Have I seen this type of loss before? Is this the third or fourth loss from the same model, the same session, or the same type of setup?" Patterns in your losses are the most valuable information your journal can give you.

## The Mistake Leak Analysis

In your Smile FX journal's Analytics section, the "Recurring Leaks" tab shows you which models you keep breaking rules on. This is not random. If you consistently break rules on "OB + BOS" setups, you likely have a specific confusion about what constitutes a valid OB. That is fixable with education.

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
- Tag rule-break trades separately from valid losses. Only rule-break patterns require behaviour changes
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

Every large futures trader (hedge funds, investment banks, corporate hedgers) must report their positions weekly. The COT aggregates this data. No other free data source gives you this level of visibility into what institutional traders are actually doing.

## The Three Groups

**Large Speculators (Non-Commercial)**: These are the trend-following institutional participants: hedge funds, CTAs (Commodity Trading Advisors), and large prop firms. They are speculating for profit. When they are net long, they expect the market to go up. Their positioning is the primary signal we use.

**Commercials**: Corporations and banks hedging real-world exposure. An airline buys oil futures to hedge against rising fuel costs. A European exporter sells EUR futures to hedge receivables. Commercials move opposite to the direction they expect prices to move, because they are hedging, not speculating. Their positioning is read as a contrarian signal.

**Small Speculators (Non-Reportable)**: The retail crowd. They are often wrong at extremes. When small specs are overwhelmingly net long, it can signal a potential reversal, but this is the weakest signal and requires other confluence.

## Reading Net Positioning

The key number is the **Large Speculator Net** position:

Net = Long contracts − Short contracts

- **Positive net** (e.g. +150,000): Large specs hold more longs than shorts → bullish bias
- **Negative net** (e.g. −80,000): Large specs hold more shorts than longs → bearish bias

The size of the net tells you conviction. A net of +200,000 is stronger than +50,000. But context matters: +200,000 for a pair with a historical range of ±300,000 is different from +200,000 for a pair that historically only moves ±100,000. This is why we use the COT Index (covered in lesson 2).

## The USD Pairs Complication

The CFTC reports positions for the underlying currency, not the pair. EUR futures reflect EUR/USD positioning. Yen futures reflect Yen positions, but since we trade USDJPY, a net long Yen position means bearish USDJPY. The Smile FX COT page automatically inverts USD-base pairs so that all signals read consistently.

## How to apply it

Every Sunday:
1. Open the Smile FX COT page
2. Check the net position for each pair you plan to trade this week
3. Is the net positive or negative? Is it growing (adding) or shrinking (reducing)?
4. Cross-reference with your Trend Matrix bias for the same pairs

If the COT and your price-action-based Trend Matrix agree, your HTF bias confidence should be high. If they disagree, treat that pair cautiously.

## Key takeaways
- The COT report shows actual institutional positions, information no chart indicator can provide
- Large Speculators net position is the primary signal: positive = bullish bias, negative = bearish
- Commercials are contrarian hedgers. Their behaviour confirms or challenges the speculator signal
- Use COT weekly for HTF bias. It is not an intraday entry tool`,
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
- **Index 0–19**: Historically maximum short positioning. Watch for exhaustion.

## Extreme Readings and Reversals

When the COT Index is above 80 and Large Specs have been net long and adding for several weeks, two things are true: (1) the trend has been strong, and (2) the trade is crowded. Crowded trades unwind violently.

This does not mean you short automatically. You look for price-level confirmation: a CHoCH on the weekly/daily chart, a failed breakout, a major liquidity sweep that does not continue. When these price signals appear against an extreme COT reading, the reversal trade becomes high-conviction.

Similarly, an Index below 20 with price at a key support level and specs aggressively covering shorts is a strong potential reversal setup for a long trade.

## Week-Over-Week (WoW) Change

The WoW Change shows how the net position moved compared to last week. This is the momentum component:

- Large net + growing (adding) → **Strong Bullish Setup**
- Large net + shrinking (reducing) → Bullish but weakening
- Near cycle high (Index > 80) + reducing sharply → **Distribution**, a potential reversal
- Large net − growing (adding shorts) → **Strong Bearish Setup**
- Large net − shrinking (covering) + Index < 20 → **Potential bullish reversal**

The Smile FX COT page shows these signals automatically as teal/gold/coral badges. But understanding why the badge is what it is allows you to make better judgment calls when the signal is ambiguous.

## When Not to Trade Against the Trend Despite Extreme Readings

Extreme COT readings can stay extreme for months in a strong trend. Do not fade a trend solely because the COT Index is above 80. Wait for:
1. Price confirmation: a failed breakout, a significant CHoCH on the weekly chart
2. Commercial position change: if commercials start reducing their hedge significantly, institutional confidence in the trend is decreasing
3. WoW deceleration: if the net is still growing but the weekly change is getting smaller, momentum is fading

## Key takeaways
- The COT Index is a 52-week percentile gauge. It tells you how extreme positioning is relative to history
- Above 80 = crowded long; below 20 = crowded short. These are reversal watch zones, not automatic trade signals
- Combine COT Index + WoW change + price confirmation before acting on an extreme reading
- A strong trend can maintain extreme COT readings for extended periods. Always wait for price confirmation`,
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

COT is the widest lens. It does not tell you where to enter. It tells you *which direction* your entries should be. If EURUSD COT is showing Strong Bullish Setup (large specs adding longs), you should only be looking for long entries on EURUSD until the COT picture changes.

## The Three-Step Confluence Process

**Step 1: COT bias**: On Sunday, check the Smile FX COT page. Note the signal badge for each pair: Strong Bullish, Bullish, Neutral, Bearish, Strong Bearish. Write down your COT bias for the week.

**Step 2: Trend Matrix alignment**: Open your Trend Matrix. Does the daily, H4, and H1 structure agree with the COT bias? If COT is bullish EURUSD but the daily structure is bearish (LH, LL pattern), there is a conflict. Either the COT is about to shift price back up, or the price action is telling you that the COT data has not yet been reflected in price. In these cases, wait for the resolution.

**Step 3: Entry model**: Once COT and Trend Matrix agree, look for entries in that direction using your killzone setups. A Liquidity Sweep → FVG or OB + BOS in the direction of both COT and daily structure is the highest-conviction trade available.

## What to Do When COT and Price Disagree

Disagreement between COT bias and daily price structure happens at market turning points, exactly when the COT is shifting before price has moved significantly. In these periods:

- Do not trade aggressively
- Reduce position size to minimum
- Wait for price structure to confirm the COT signal (CHoCH on daily, first BOS in new direction)
- Once price confirms, you have a high-conviction entry with macro COT flow behind it

## Real Application Example

Scenario: COT shows Large Specs adding longs on GBPUSD for the third consecutive week. Index at 62: not extreme, room to run. Daily chart shows a recent CHoCH from bearish to bullish, with the first HH formed. H4 shows a pullback to a clean FVG.

This is a complete institutional bias trade:
- COT: bullish and building
- Daily: CHoCH confirms bullish turn
- H4: FVG pullback entry

Enter long at the H4 FVG, stop below the FVG, target the next weekly high. Risk 0.5–1% depending on conviction.

## Common mistakes

- Using COT as a timing tool ("COT is bullish, I will buy right now"). It is a directional filter, not an entry signal
- Ignoring COT when it conflicts with a compelling technical setup. The macro is often right; the technical setup may resolve in the opposite direction
- Checking COT daily instead of weekly. COT is a weekly tool; looking at it more frequently creates noise

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
    description: "Kondwani walks through real trades: his alerts, your submitted trades, winners and losers all reviewed live.",
    tier:        "pro",
    icon:        "videocam",
    color:       "var(--teal)",
    order:       5,
    published:   true,
    lessons: [
      {
        slug:     "june-2026-week1-xauusd",
        title:    "June 2026 week 1: XAUUSD London sweep reviewed",
        duration: "34 min",
        order:    1,
        published: true,
        level:    2,
        summary:  "Full trade review of a XAUUSD London sweep setup.",
        points:   ["How the setup was identified", "Entry and management", "What to learn from the outcome"],
        body: `# June 2026 Week 1: XAUUSD London Sweep Reviewed

## Trade overview

This lesson walks through a live XAUUSD trade from the week of June 2–6 2026. This was a textbook Liquidity Sweep → FVG setup during the London open killzone.

## What you'll learn
- How the trade was identified before the London open through Sunday analysis
- The exact entry, stop, and target reasoning
- What the trade teaches about XAUUSD-specific behaviour in London

## Pre-session Analysis (Sunday night)

**COT**: Large Spec net on Gold was +198,000, strongly bullish. Index at 67, still room to run. WoW change positive for the third consecutive week.

**Daily structure**: Bullish, with a series of HH and HL forming since May 15. The most recent HL was the swing low at $2,298. Equal highs sat at $2,341 from two weeks prior, the obvious liquidity target above.

**H4 analysis**: Price had been pulling back from $2,341 for 6 days. Equal lows had formed on H4 at $2,306, where retail sell stops were clustered.

**Expectation**: London open was likely to run the equal lows at $2,306 before making a move toward the equal highs at $2,341. The COT confirmed directional bias.

## The London Open Setup

At 08:14 UTC, XAUUSD made a move lower. The H1 candle at 08:00 had already printed a bearish wick before recovering. By 08:14, price broke below $2,306 by $1.80, sweeping the equal lows and triggering retail sell stops.

The 08:15 candle immediately reversed. The sweep candle (08:00–08:15 period) left an FVG between $2,307.40 (the high of the candle before the impulse reversal) and $2,309.80 (the low of the candle after the impulse reversal).

## Entry

Price retraced into the FVG at $2,308.60 at 09:02 UTC.

- **Entry**: $2,308.60
- **Stop**: $2,303.50 (below the sweep low with $2.50 buffer)
- **TP1**: $2,326.00 (nearest swing resistance)
- **TP2**: $2,341.00 (equal highs, the full draw on liquidity)
- **R:R to TP1**: 3.5:1

## Trade Management

Price moved up steadily through London. TP1 was hit at 11:40 UTC, and 50% of the position was closed. Stop was moved to breakeven on the remaining position.

New York open saw a brief pullback to $2,321 (holding above the breakeven stop) before price pushed higher. TP2 at $2,341 was hit at 15:22 UTC during the New York session.

Full trade duration: approximately 7 hours.

## Key lessons from this trade

**Lesson 1: Sunday analysis is the edge**: This trade was identified Sunday night. Monday morning was execution only. Traders who analyse in the moment are reacting; traders who analyse on weekends are executing a plan.

**Lesson 2: XAUUSD sweeps are aggressive**: Gold moves fast. The sweep happened in 15 minutes and the FVG filled within 45 minutes of the sweep. Be ready to act at the London open, because entries sit for hours on forex pairs but minutes on gold.

**Lesson 3: COT confirmed the long bias**: Without COT backing, this might have been a 50/50 decision. With Large Specs strongly adding to net longs and the Index at 67, the long bias was clear before price action even set up.

**Lesson 4: Equal lows are the most reliable sweep level**: Retail sell stops sit below double lows and equal lows predictably. If you do not have equal highs or lows to work with, the setup is less structured.

## Key takeaways
- Pre-session Sunday analysis creates the plan; London open is execution
- XAUUSD sweeps are fast. The FVG entry window is often 30–60 minutes, not hours
- COT + price structure alignment is the highest-conviction setup available
- Taking 50% at TP1 and moving stop to breakeven removes all downside risk on the runner`,
      },
      {
        slug:     "may-2026-week4-gbpusd-short",
        title:    "May 2026 week 4: GBPUSD shorting into premium OB",
        duration: "29 min",
        order:    2,
        published: true,
        level:    2,
        summary:  "Reviewing a bearish GBPUSD OB + BOS trade into a premium zone.",
        points:   ["Bearish structure identification", "Premium vs discount zones", "OB entry into HTF supply"],
        body: `# May 2026 Week 4: GBPUSD Shorting Into Premium OB

## Trade overview

This lesson reviews a bearish GBPUSD trade from the week of May 26–30 2026. The setup was an OB + BOS continuation short into a premium zone, executed during the London killzone.

## What you'll learn
- How to identify whether price is in a premium or discount zone before entering
- Why the bearish OB was valid for this setup and how it was drawn
- Trade outcome and what it confirms about shorting into premium

## Pre-session Analysis

**COT GBPUSD**: Large Spec net was −42,000, mildly bearish. Index at 38, below the midpoint in a bearish cycle. WoW change was negative (adding shorts).

**Daily**: Bearish structure, with an LH and LL pattern forming since May 10. Most recent LH at 1.2786. The PDH from May 27 was 1.2752.

**H4**: Clear downtrend. A BOS had occurred on May 23 breaking below 1.2680. Price had retraced to an H4 bearish OB between 1.2748–1.2762.

**Premium/Discount context**: The 50% level of the last bearish impulse (from 1.2786 to 1.2622) was 1.2704. Price was at 1.2750, above the 50% level, in premium territory. In a bearish trend, premium is where you sell. This alignment was strong.

## The Setup

On Tuesday May 28, London open, price rallied from 1.2718 during the Asian session to 1.2753, pushing into the H4 bearish OB zone (1.2748–1.2762).

The rally into the OB was the pullback after the prior week's bearish BOS. Three criteria confirmed the OB entry:
1. BOS confirmed (May 23 break below 1.2680)
2. Price in premium zone (above 1.2704 midpoint)
3. Retrace reached the H4 OB (1.2748–1.2762)

## Entry

H1 chart showed a CHoCH within the OB at 09:22 UTC: a small bullish swing high broke to the downside, confirming the OB zone was holding. Entry triggered at 1.2746 on the M15 CHoCH confirmation.

- **Entry**: 1.2746
- **Stop**: 1.2768 (above the OB high with 6-pip buffer)
- **TP1**: 1.2680 (prior BOS level, the nearest liquidity)
- **TP2**: 1.2622 (swing low, the full draw on liquidity)
- **R:R to TP1**: 3:1

## What is a Premium Zone?

In ICT methodology, markets move in ranges between draws on liquidity. Within any range:
- **Premium** = the upper portion (above 50% of the range). This is where institutions sell.
- **Discount** = the lower portion (below 50%). This is where institutions buy.

For a long trade, you want to buy in discount. For a short trade, you want to sell in premium. Entering a short in discount (near the bottom of a range) is the most common error. You are trying to short at the same level institutions are buying.

## Key lessons

**Lesson 1: OB validity requires prior BOS**: This OB was valid because it preceded a confirmed bearish BOS. Without that BOS, it was just a random candle.

**Lesson 2: Premium zone adds conviction to short entries**: The confluence of OB + BOS + premium zone + bearish COT is as strong as the setup gets. Each layer adds independent probability.

**Lesson 3: Lower-TF CHoCH confirmation**: Rather than entering the moment price touched the OB, waiting for the H1/M15 CHoCH to confirm that the OB was holding reduced the risk of entering into a deeper pullback.

**Lesson 4: COT was weak bearish, not strongly bearish**: The position size was kept at 0.5% (not 1%) because COT conviction was mild. On strongly bearish COT signals, size can be increased to 1%.

## Key takeaways
- Sell in premium (above 50% of the range), buy in discount (below 50%). This filters out most bad entries
- OB validity requires a prior BOS. Do not trade random OBs in ranging conditions
- H1/M15 CHoCH confirmation inside the OB improves entry precision and reduces risk
- Match your position size to COT conviction: strong signal = full size, weak signal = half size`,
      },
      {
        slug:     "may-2026-week3-nas100-bos-retrace",
        title:    "May 2026 week 3: NAS100 BOS retrace, what I saw",
        duration: "31 min",
        order:    3,
        published: true,
        level:    2,
        summary:  "Reviewing a NAS100 BOS retrace setup and what almost went wrong.",
        points:   ["NAS100 structure specifics", "The BOS + retrace on indices", "What almost went wrong"],
        body: `# May 2026 Week 3: NAS100 BOS Retrace, What I Saw

## Trade overview

This lesson reviews a NAS100 trade from May 19–23 2026: a BOS + retrace long setup during the New York open. It also covers what nearly caused the trade to be skipped and the lesson that provides.

## What you'll learn
- How NAS100 structure differs from forex pairs in terms of speed and pip size
- The specific BOS + retrace that triggered this trade and why it was valid
- What nearly caused this trade to be missed and the lesson in that near-miss

## NAS100 Specifics

NAS100 (the NASDAQ 100 futures contract) is one of the most volatile and fast-moving instruments available to retail traders. Key differences from forex:

- **Point-based, not pip-based**: moves are measured in points. A 50-point move on NAS100 is approximately equivalent to a 5-pip move on EURUSD in terms of percentage.
- **Faster price delivery**: structure breaks on NAS100 happen faster and often more explosively than on forex pairs. A bullish BOS on NAS100 H1 can be a 200-point impulse candle.
- **New York session dominance**: NAS100 is most active during the New York open (13:00–15:00 UTC). The Asian and London sessions produce less reliable structure.
- **Earnings and macro sensitivity**: Be aware of major tech earnings (Apple, Microsoft, Nvidia, Meta) and CPI/FOMC announcements. These cause extreme volatility that overrides technical setups.

## The Pre-Session Analysis

**COT NAS100**: Futures (E-mini NASDAQ) showed Large Spec net at +88,000, bullish. Index at 58: moderate, room to run.

**Daily**: Clean bullish structure from May 12. After a sharp selloff in early May, structure had shifted with a CHoCH on May 12 and a BOS on May 15.

**H4**: Pullback was forming. The BOS impulse from May 19 (breaking above 18,450) left an FVG between 18,412 and 18,438.

## The Near-Miss

On Monday May 20, price pulled back toward the H4 FVG. By the Asian session, price had reached 18,435, just inside the FVG. However, the New York open had not yet started, and this was a forex trader reviewing the NAS100 setup.

The temptation was to enter during the Asian session at 18,435. This would have been wrong. NAS100 Asian session moves are unreliable and the entry would have been caught in a further pullback to 18,395 (below the FVG low) during London, potentially stopping out before the real move.

The lesson: **NAS100 entries on daily/H4 setups belong in the New York open killzone, not during London or Asia.**

## The Actual Entry

At 13:18 UTC on Tuesday May 21 (New York open), price had pulled further to 18,388, slightly below the original FVG but inside the OB zone identified (the last bearish candle before the bullish BOS impulse had a body range of 18,371–18,412).

- **Entry**: 18,395 (inside OB zone, M15 CHoCH confirmation)
- **Stop**: 18,340 (below OB low with 31-point buffer)
- **TP**: 18,560 (next significant swing high)
- **R:R**: 3:0:1

Price reached TP at 15:42 UTC the same day, a 2.5-hour trade.

## Key lessons

**Lesson 1: Instrument-specific session awareness**: NAS100 belongs in New York. Entering NAS100 setups during Asian or London sessions introduces unnecessary risk.

**Lesson 2: The near-miss teaches patience**: Had the trade been entered at 18,435 during Asia, it would have been stopped out before the actual move. Patience with session timing produced the valid entry.

**Lesson 3: OB provided a second entry zone when FVG was briefly breached**: When price dipped below the FVG low, the OB below provided the actual entry. Having both zones drawn means you are not stuck if price goes slightly deeper than expected.

**Lesson 4: Fast profits on NAS100**: The trade resolved in 2.5 hours. NAS100 moves fast, so be ready to move stops aggressively and do not expect the same slow development as a multi-day forex trade.

## Key takeaways
- NAS100 is a New York session instrument. Apply your H4/daily setups in the NY killzone only
- The OB zone provides a backup entry when price overshoots the FVG slightly
- NAS100 trades resolve faster than forex, so active trade management is important
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

**Maximum Daily Loss**: Most firms have a daily loss limit of 4–5% of the starting account. At 0.5–1% risk per trade, you can take 4–10 losses in a day before hitting the limit. This is compatible. Firms with 2% daily limits are problematic: two bad trades end your day, creating pressure that leads to poor decisions.

**Maximum Drawdown**: A 10% maximum drawdown is standard. An 8% drawdown is tighter but workable at low risk. Do not attempt firms with 5% maximum drawdown. One large gap event or news spike can end your account.

**Minimum Trading Days**: Some firms require 10–30 minimum trading days in a phase. This is fine, since it prevents people from getting lucky in one big trade. It suits a consistent 3–5 trades per week approach.

**News trading restriction**: Many firms ban trading 2–5 minutes around high-impact news events (NFP, FOMC, CPI). This should not affect Kondwani's style, because we avoid trading into major news anyway. But check the exact definition and avoid firms that ban trading for 30+ minutes around news.

**Weekend holding restriction**: Some firms prohibit holding positions over the weekend. This eliminates swing trades that mature into Friday. Plan your trading accordingly or choose firms that allow weekend holding.

**No hedging restriction**: Not relevant for this system (we do not hedge within a single firm), but note it if you plan to trade correlated pairs.

## Firms That Suit SMC Trading (General Criteria)

Rather than naming specific firms (which change their terms frequently), look for firms that:
- Allow news trading with a 2-minute or shorter restriction window
- Have at minimum 10% maximum overall drawdown
- Have 4–5% daily loss limits
- Do not cap the number of trades per day
- Use MT4 or MT5, compatible with all major brokers offering our instruments
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

Most prop firm evaluations run 30 days with a profit target of 8–10% and a 10% maximum drawdown. At 0.5% risk, a 3:1 R:R, and a 60% win rate, the expected value per trade is approximately 1.3% of account (0.6 × 1.5% − 0.4 × 0.5%). Over 20 trades in 30 days, the expected return is 26%, well above the 8–10% target.

The plan: **5 trades per week, 4 weeks, maximum 0.5% risk per trade.** The target is to reach the profit threshold comfortably by the end of week 3, leaving week 4 as buffer.

## Week-by-Week Breakdown

**Week 1: Establish rhythm**:
- Focus entirely on valid setup execution, not on the profit target
- Take only A and B grade setups from the Validator
- Target: 5 trades, break even or small positive is a success
- Avoid the temptation to trade more because "the target is only 8%"

**Week 2: Build momentum**:
- By week 2, you should be 2–4% in profit if executions have been clean
- Continue the same discipline: 5 trades maximum
- If you are behind target by week 2, do NOT increase risk to catch up. Instead, review the journal for execution issues.

**Week 3: Protect the profit**:
- If you reach 6–7% profit in week 3, you are ahead of target
- Reduce to 0.25% risk per trade to protect the account
- A losing week 3 at 0.25% risk cannot blow the evaluation; a 0.5% risk mistake could cost you 3–4%

**Week 4: Cross the line cleanly**:
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
- 5 trades per week × 4 weeks at 0.5% risk. Stick to this regardless of where the profit target stands
- The evaluation stress changes your perception of setups. Pre-commit to your rules in writing before you begin
- If ahead by week 3, reduce to 0.25% risk and protect the account
- A failed evaluation is a practice session with a fee. Extract the lesson before retrying`,
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

The hardest skill in an evaluation is not trading when there is no setup. The urge to force a trade (any trade) intensifies when you are close to the profit target. Resist it.

## Managing Drawdown Mid-Evaluation

If you find yourself in a 4–5% drawdown in the first two weeks:

- Do not increase risk to recover. This is statistically guaranteed to increase the final drawdown
- Review the last 5 trades in your journal. What was the error? Was it setup quality, execution, or simply a bad variance run with valid setups?
- If setup quality is the issue: go back to basics. Only take setups that score 90%+ on the Validator for the next 5 sessions
- If it was valid trades that did not work: trust the edge, continue at the same risk level

A 5% drawdown with 12 days remaining at 0.5% risk and a 60% win rate is still recoverable. A 5% drawdown followed by a 3% chase trade that fails leaves you with only 2% before the maximum drawdown is hit.

## End-of-Day Review (15–20 minutes after session)

Every trading day during an evaluation:

1. Screenshot the chart showing every entry and exit from today's session
2. Open the journal and write 3–5 sentences about each trade: what the setup was, whether it was valid, and what the outcome was
3. Rate your execution 1–5 (separate from the trade outcome; a valid trade that lost can still get 5/5 for execution)
4. Note one thing to watch for in tomorrow's session

This review practice, done daily, compounds your learning faster than any single lesson. By day 30, you will have a detailed record of your 30-day process. Whether you pass or fail, this record is your most valuable asset.

## Key takeaways
- The 45-minute pre-session routine is the most valuable time spent during an evaluation. Do not skip it
- During the session: execute the pre-defined setup and then do not interfere with the trade
- Drawdown recovery through consistent execution beats recovery through increased risk every time
- The end-of-day review is your compounding tool: 30 days of reviews equals 30 trading lessons`,
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

Passing the evaluation is a milestone, but it is the beginning, not the end. Most traders are surprised to find that their psychology changes again once they are trading real firm money. The first 30 days funded require the same discipline as the evaluation, often more, because the payouts are real.

**Continue the same system**: Do not change anything. The same risk, the same pairs, the same sessions, the same Validator criteria. The most common error after passing is "celebrating" by taking larger risks or exploring new setups. This is the fastest path to a drawdown that triggers a reset or termination.

**Treat payout as the goal, not profit**: Your first payout confirmation that the system works. Aim to qualify for your first payout (typically after 30 days and reaching the firm's threshold) before thinking about scaling.

## How Payouts Work

Most firms pay out 80–90% of profits. At a $50,000 funded account and 8% profit, your payout would be:
- $50,000 × 8% = $4,000 total profit
- 80% profit split = **$3,200 payout**

Payout timelines: typically 5–14 business days after request. Keep a record of all trade history screenshots before requesting. This prevents disputes.

## Scaling Plans

Once you have proven consistent performance (typically 3–6 months of profitable trading), most firms offer scale-up programs. Common structure:
- Pass 3–6 months with no drawdown violations and consistent profitability
- Account doubles (e.g. $50,000 → $100,000) or increases by 25–50%

Some firms scale aggressively (doubling every 3 months). Others are conservative. Choose based on what matches your proven performance. Do not accept a scale-up to $200,000 if you have only 60 days of trading history. The psychological pressure at larger account sizes is real and requires time to adapt to.

## The Mindset Shift at Larger Sizes

At $50,000 with 1% risk, a loss is $500. At $200,000 with 1% risk, a loss is $2,000. The market behaviour is identical. The mathematics are identical. But your brain will not treat them the same.

Prepare by gradually scaling your mental model:
- When you first get the funded account, remind yourself frequently that you are managing the firm's capital, not yours. It removes personal emotional attachment
- When the account grows, review the journal to confirm your win rate and R:R are consistent before the scale-up
- If you notice your decision-making changing at larger sizes (more hesitation, different holding periods, earlier exits), scale back down temporarily and re-stabilise

## Running Multiple Funded Accounts

Some traders with a proven system eventually manage 2–4 funded accounts simultaneously across different firms. This diversifies the risk of a single firm's rules or policies affecting your income.

The criteria before attempting multiple accounts:
- Minimum 6 months of consistent profitable trading at one firm
- A track record in your journal that proves repeatability
- Kondwani's system is well-suited to this approach: the same Sunday analysis and killzone execution works identically across all accounts

## Key takeaways
- The first 30 funded days require the same discipline as the evaluation. No system changes
- First payout is the goal before thinking about scaling
- Psychological pressure increases with account size. Allow time to adapt before accepting large scale-ups
- Multiple funded accounts are the end goal, but only after 6+ months of proven single-account performance`,
      },
    ],
  },
  {
    slug:        "macroeconomics-for-forex-traders",
    title:       "Macroeconomics for Forex Traders",
    description: "Understand the economic forces that move currency prices. Interest rates, inflation, employment, central banks, and how to build a weekly macro bias before you touch a chart.",
    tier:        "pro",
    icon:        "public",
    color:       "var(--gold)",
    order:       7,
    published:   true,
    lessons: [
      {
        slug:     "why-macroeconomics-drives-forex",
        title:    "Why macroeconomics drives forex: the big picture explained",
        duration: "15 min",
        order:    1,
        published: true,
        level:    2,
        summary:  "The connection between economic fundamentals and currency prices.",
        points:   ["Why currencies have value", "The macro-technical link", "How this course fits your trading"],
        body: `# Why Macroeconomics Drives Forex: The Big Picture Explained

## What you'll learn
- What gives a currency its value and why that value changes
- How macroeconomic forces connect to the price action you see on charts
- Where macro analysis fits in your trading process alongside SMC

## What Gives a Currency Its Value?

A currency is not just a medium of exchange. It is a claim on an economy. When you hold US dollars, you hold a piece of the US economy, its growth, its interest rates, its institutions, and its geopolitical stability. When the US economy is strong, demand for dollars rises globally. When it weakens, that demand falls.

Forex prices reflect the relative value of two economies at any point in time. EURUSD is not just "euros vs dollars." It is the Eurozone economy versus the US economy expressed as a single number. Every candle on that chart is a continuous auction between market participants updating their view of which economy is stronger.

This is why economic data moves price. When the US releases stronger-than-expected employment numbers, traders around the world immediately revise their view of the US economy upward. They buy dollars. EURUSD falls. GBPUSD falls. XAUUSD (which is priced in dollars) often falls. All of this happens in seconds.

## The Macro-Technical Link

Technical analysis (your SMC framework) maps how price delivers. Macroeconomics explains why price is delivering in a given direction. Both are essential.

A perfect OB + BOS long setup on EURUSD H1 means less when the macro backdrop is strongly bearish. The setup may still work (technicals capture local order flow), but the probability is lower and the potential move is smaller. The same setup with a bullish macro backdrop behind it has institutional flow as a tailwind.

This is why the analysis hierarchy in the Smile FX system puts COT and macro at the top, before daily structure, before H4, before H1 entry. The widest lens should filter everything below it.

Think of it this way:
- **Macro** tells you the direction the river is flowing
- **Daily structure** shows you which channel the river is in
- **SMC entry models** show you exactly where to step in

Swimming with the river is easier than against it.

## The Three Layers of Macro Analysis

Macro is not one thing. It has layers:

**Layer 1 — Interest rate environment**: The dominant driver in forex over weeks and months. Where is each central bank in its rate cycle? Are they hiking, holding, or cutting? This single factor explains the majority of long-term currency trends.

**Layer 2 — Economic data**: The monthly and quarterly data releases (CPI, NFP, GDP, PMI) that update the market's view of where interest rates are heading. Strong data → rates stay high or rise → currency strengthens. Weak data → rates may fall → currency weakens.

**Layer 3 — Risk sentiment**: The global mood toward risk. During periods of fear (geopolitical crisis, market crash), capital flows to safe-haven currencies: USD, JPY, CHF. During periods of optimism, capital flows to higher-yielding, higher-risk currencies: AUD, NZD, EM currencies.

This course covers all three layers and shows you how to synthesise them into a weekly bias you can act on.

## How This Fits Your Trading Process

You do not need to become an economist. You need to understand enough macro to:

1. Know which direction is aligned with the fundamental backdrop for each pair you trade
2. Understand why specific data releases matter and what they mean for your pairs
3. Build a simple weekly bias that confirms or warns against your technical setups

The goal is not to predict GDP to three decimal places. The goal is to know: is the USD fundamentally strong or weak right now, and is that changing? Everything else follows from that.

## Key takeaways
- Currencies represent the relative strength of two economies. Economic data continuously updates this comparison
- Macro is the widest lens in your analysis hierarchy: it filters your technical setups, not the other way around
- Interest rates, economic data, and risk sentiment are the three pillars of macro analysis
- You do not need deep economics knowledge, you need the key indicators, what they mean, and how to build a weekly bias from them`,
      },
      {
        slug:     "interest-rates-the-master-driver",
        title:    "Interest rates: the most powerful driver in forex",
        duration: "25 min",
        order:    2,
        published: true,
        level:    2,
        summary:  "How central bank interest rates drive currency direction over weeks and months.",
        points:   ["Why rates move currencies", "Rate differentials between pairs", "Hawkish vs dovish signals"],
        body: `# Interest Rates: The Most Powerful Driver in Forex

## What you'll learn
- Why interest rates are the dominant force in forex markets over medium and long timeframes
- How the rate differential between two countries drives a currency pair's direction
- How to read central bank language to anticipate rate changes before they happen

## Why Interest Rates Move Currencies

When a central bank raises interest rates, it makes holding that country's currency more profitable. Here is why: banks in that country now pay higher interest on deposits denominated in that currency. Global institutional investors (pension funds, hedge funds, sovereign wealth funds) respond by moving capital into that currency to earn the higher yield.

This capital flow is massive. A single percentage point difference in interest rates between the US and Japan can trigger hundreds of billions of dollars in capital reallocation globally. That capital flow is what drives sustained forex trends, not technical setups, not retail sentiment.

The reverse is equally true. When a central bank cuts rates, the yield advantage decreases. Capital flows out. The currency weakens.

This mechanism explains why major forex trends often last months or years: interest rate cycles are slow to change. Once the Fed begins hiking, it typically continues for 12–24 months. Once the ECB begins cutting, it typically continues for multiple meetings. The trend is the cycle.

## Rate Differentials: The Key Number

The most important number in forex macro analysis is not the absolute interest rate of either country. It is the **differential** between the two rates.

EURUSD example:
- US Federal Funds Rate: 5.25%
- ECB Deposit Facility Rate: 3.75%
- Differential: +1.50% in favour of USD

This differential tells you that holding dollars earns 1.50% more per year than holding euros. For institutional capital managing billions, this is significant. It creates consistent demand for USD over EUR and is the foundational reason for a bearish EURUSD trend.

When the differential is narrowing (the ECB is hiking while the Fed holds), EURUSD tends to rally as the gap closes. When the differential is widening (the Fed hikes faster than the ECB), EURUSD falls.

Tracking which direction the differential is moving is more important than the absolute level.

## Hawkish vs Dovish: The Language of Central Banks

Central banks communicate future rate intentions through language before they act. Learning to read this language gives you advance warning of rate changes.

**Hawkish language** signals higher rates ahead:
- "Inflation remains elevated and above our target"
- "The labour market remains tight"
- "We are prepared to do what is necessary"
- "We are not yet confident inflation is on a sustainable path to target"

**Dovish language** signals lower rates ahead or rate cuts:
- "Inflation is making progress toward our target"
- "Economic conditions are softening"
- "We see risks becoming more balanced"
- "We are increasingly confident inflation is returning to target"

The market prices rate expectations months in advance. By the time the central bank actually cuts rates, the currency move has already largely happened. The edge is in reading the language shift early, before the market has fully repriced.

## The Rate Cycle and Currency Trends

Central bank rate cycles follow a predictable structure:

**Hiking cycle**: Inflation rises above target → central bank begins raising rates → currency strengthens as capital inflows → cycle lasts 12–24 months typical

**Peak rates**: Central bank pauses after hiking → uncertainty about when cuts begin → currency often volatile, ranging

**Cutting cycle**: Economy slows, unemployment rises, inflation falls below target → central bank begins cutting → currency weakens → cycle lasts 12–24 months typical

Knowing where each major central bank sits in its cycle tells you the medium-term direction for that currency. In 2022–2023, the Fed hiked aggressively while other central banks were slower. USD was the dominant long. In 2024–2025, as the Fed began signalling cuts while some other banks held higher, the cycle shifted.

## Applying This to Your Pairs

**Before trading any pair this week, ask these questions:**
1. What is the current interest rate for each currency in the pair?
2. What is the rate differential, and in whose favour?
3. Is the differential widening or narrowing?
4. What is the next central bank meeting for each currency, and what is the market expecting?

When both the rate differential AND the technical structure point in the same direction, you have a high-conviction setup.

## Key takeaways
- Interest rates drive capital flows, and capital flows drive forex trends. This is the most powerful macro force
- The rate differential between two countries is the key number, not the absolute rate of either country alone
- Hawkish language signals higher rates ahead; dovish language signals cuts. The market moves before the actual decision
- Identify where each central bank sits in its cycle. The rate cycle is the macro trend. Trade with it`,
      },
      {
        slug:     "inflation-reading-cpi",
        title:    "Inflation: reading CPI and understanding its forex impact",
        duration: "22 min",
        order:    3,
        published: true,
        level:    2,
        summary:  "How to interpret CPI data and what it means for central bank decisions and currencies.",
        points:   ["CPI vs core CPI", "Why CPI is the Fed's primary focus", "What above/below forecast CPI means for your trade"],
        body: `# Inflation: Reading CPI and Understanding Its Forex Impact

## What you'll learn
- The difference between headline CPI and core CPI and why traders focus on core
- How inflation data directly influences central bank rate decisions and therefore currencies
- How to interpret a CPI release in the moment: above forecast, below forecast, and in-line

## What is CPI?

The Consumer Price Index (CPI) measures the average change in prices paid by consumers for a basket of goods and services over time. It is the most widely watched inflation measure in the world and the primary data point that central banks use to calibrate interest rate policy.

In the US, CPI is released monthly by the Bureau of Labor Statistics. Similar measures exist for every major economy: HICP (Harmonised Index of Consumer Prices) in the Eurozone, CPI in the UK (released by the ONS), CPI-U in Canada, and so on.

The CPI number you see quoted (e.g. "US CPI 3.2% YoY") is the year-over-year percentage change: prices are 3.2% higher than they were 12 months ago. Monthly figures (MoM) are also reported and show the change from the prior month.

## Headline vs Core CPI

**Headline CPI** includes all items in the basket, including food and energy. It is the number reported in the media and what most retail traders watch.

**Core CPI** excludes food and energy prices. Central banks focus on core because food and energy prices are highly volatile and often driven by factors outside monetary policy's control (weather, geopolitics, oil supply). Core CPI gives a cleaner signal of underlying inflationary pressure.

As a trader, watch both but prioritise core. The Fed explicitly targets core PCE (Personal Consumption Expenditures, a related measure), not headline CPI.

**Example**: If headline CPI spikes from 3.0% to 4.2% but core CPI only moves from 3.1% to 3.2%, the market will not interpret this as a major hawkish signal. The spike is likely from oil prices and the Fed will look through it. If core CPI jumped from 3.1% to 3.9%, that is significant and markets will reprice rate expectations sharply.

## The CPI–Rates–Currency Chain

The logic chain works like this:

Higher-than-expected CPI → inflation above target → Fed more likely to keep rates high or hike further → USD strengthens (capital inflows for yield) → EURUSD falls, GBPUSD falls, XAUUSD falls (gold priced in USD)

Lower-than-expected CPI → inflation cooling → Fed more likely to cut rates sooner → USD weakens → EURUSD rises, GBPUSD rises, XAUUSD rises

This is why CPI is a Tier 1 high-impact event on the economic calendar. It directly updates the market's probability of the next rate decision.

## Reading the Release: What the Numbers Mean

When CPI is released, there are three numbers to compare:

1. **Previous**: last month's reading
2. **Forecast (Consensus)**: what economists expected
3. **Actual**: the released figure

The market reacts to the **deviation from forecast**, not the absolute number.

**Scenario A: Actual 3.8%, Forecast 3.5%, Previous 3.3%**
→ Inflation came in above expectations AND is accelerating. Very hawkish for USD. Expect USD strength immediately.

**Scenario B: Actual 3.2%, Forecast 3.5%, Previous 3.6%**
→ Inflation came in below expectations AND is decelerating. Dovish for USD. Expect USD weakness, EURUSD and XAUUSD to rally.

**Scenario C: Actual 3.5%, Forecast 3.5%, Previous 3.5%**
→ In-line with expectations. Limited immediate reaction. Focus returns to the next data point.

## The "Buy the Rumour, Sell the Fact" Phenomenon

Sometimes USD strengthens in the days leading into a CPI release (the market prices in a high reading), and then sells off after the actual CPI is released even if it comes in high. This is the "buy the rumour, sell the fact" dynamic.

This is why you should not blindly trade the direction implied by the number. The market's pre-positioning matters. Check where DXY was trading in the 24–48 hours before the release. If it rallied significantly into CPI, even a strong CPI number may cause a brief reversal as the trade is unwound.

## CPI and Your Weekly Analysis

Every Sunday, check when the next CPI release is for any currency in your target pairs. If EURUSD CPI is releasing on Tuesday during London, you have two considerations:

1. Do not enter new positions in the 30 minutes before or after the release
2. Factor the CPI expectation into your macro bias: is the market expecting high or low inflation this month? What does that mean for the rate outlook?

## Key takeaways
- CPI is the primary inflation measure watched by central banks and forex markets
- Focus on core CPI (excluding food and energy) for the most reliable signal of underlying inflation
- The market reacts to the deviation from forecast. Above = hawkish, Below = dovish
- Pre-release positioning matters. "Buy the rumour, sell the fact" can reverse the logical trade direction after the release`,
      },
      {
        slug:     "employment-data-nfp",
        title:    "Employment data: NFP, ADP, and what the labour market tells you",
        duration: "20 min",
        order:    4,
        published: true,
        level:    2,
        summary:  "How to read employment reports and why they matter for USD and your pairs.",
        points:   ["What NFP measures and why it matters", "ADP as a leading indicator", "Unemployment rate nuances"],
        body: `# Employment Data: NFP, ADP, and What the Labour Market Tells You

## What you'll learn
- What the Non-Farm Payrolls report measures and why it moves markets more than almost any other release
- How to use the ADP report as a leading indicator before NFP
- The nuances in the unemployment rate that the headline number misses

## Non-Farm Payrolls: The Most Watched Number in Forex

The Non-Farm Payrolls (NFP) report, released on the first Friday of every month by the US Bureau of Labor Statistics, is the most anticipated economic release in forex markets. It measures the net change in paid employment in the US, excluding farm workers, government employees, and non-profit sector employees. The exclusions leave approximately 80% of the workforce that drives private-sector economic activity.

Why does it move markets so dramatically? Because employment is the most direct indicator of economic health, and the Federal Reserve's dual mandate includes "maximum employment" alongside price stability. When employment is strong, the Fed can maintain or raise rates. When employment weakens, rate cuts become more likely. This direct link to rate expectations makes NFP a Tier 1 market-moving event without comparison.

Typical NFP impact: EURUSD moves 50–150 pips in the first 30 minutes after the release. XAUUSD frequently moves $15–$40 per ounce. These are some of the largest intraday moves of the month.

## Reading the NFP Release

The NFP report contains several figures. The key ones:

**Non-Farm Payrolls (headline)**: the net new jobs created. A reading above 200,000 is generally considered strong; below 100,000 is weak. The consensus forecast matters most.

**Unemployment Rate**: the percentage of the labour force that is unemployed and actively seeking work. The Fed targets approximately 4–4.5% as "full employment" without being inflationary.

**Average Hourly Earnings (AHE)**: wage growth. This is the inflation sub-component of the labour market. High wage growth means workers have more purchasing power, which can drive inflation even if job creation is slowing.

The full picture is often more nuanced than the headline number:

**Strong NFP but rising unemployment**: Sounds contradictory, but happens when more people enter the workforce. Net positive.

**Weak NFP but falling wages**: Could signal labour market cooling and less inflation risk. Mildly dovish but not alarming.

**Strong NFP + strong wages**: Maximum hawkish signal. Both employment and inflation-driving factors are hot. USD strongest outcome.

**Weak NFP + falling unemployment + falling wages**: Neutral-to-dovish. The labour market is cooling broadly.

## ADP Employment Report: The Early Warning

The ADP National Employment Report is released on the Wednesday before NFP. It measures private-sector employment changes for the same month and serves as a leading indicator.

ADP is not perfectly correlated with NFP (they use different methodologies and data sources), but significant deviations from expectations in ADP will often shift expectations for NFP and cause pre-NFP USD positioning changes.

Rule of thumb: if ADP misses forecast significantly, expect more volatility around NFP regardless of which way it prints. If ADP beats significantly, NFP expectations are raised, and a miss becomes more painful for USD.

## The Unemployment Rate Nuance

The headline unemployment rate (currently around 4%) seems simple but hides important details.

**The participation rate**: The unemployment rate only counts people actively looking for work. If discouraged workers stop looking, they leave the labour force and the unemployment rate can fall even though conditions are worsening. A falling unemployment rate accompanied by a falling participation rate is not a genuine improvement.

**U-6 (broader unemployment)**: The U-6 measure includes part-time workers who want full-time work and marginally attached workers. It runs 2–4 percentage points above the headline U-3 rate and provides a more complete picture of labour market slack.

The Fed watches the participation rate and U-6 alongside the headline. As a trader, be aware that a headline unemployment rate drop is not automatically bullish if the participation rate is also dropping.

## NFP and Your Trading Week

NFP Friday has specific rules:

1. **No new positions 30 minutes before the release**: the spread widens, volatility is extreme, and price can spike 50+ pips in either direction before finding direction
2. **Wait for the initial spike to settle (10–15 minutes after release)**: the first candle after NFP is often noise. The sustained direction that follows is more tradeable
3. **Check wages and participation rate, not just the headline**: a NFP beat with weak wages may not be as bullish as the headline suggests
4. **By 15:00–16:00 UTC, the NFP reaction is often fading**: position for the following week's technical setup, not the NFP reaction trade

## Key takeaways
- NFP is the single most market-moving monthly release for USD and all USD pairs
- Read the full report: headline jobs + unemployment rate + average hourly earnings together tell the complete story
- ADP on Wednesday is the early warning: significant ADP deviations shift NFP expectations before Friday
- The unemployment rate headline can mislead if the participation rate is moving in the same direction`,
      },
      {
        slug:     "gdp-economic-growth",
        title:    "GDP: economic growth and what it means for currency strength",
        duration: "18 min",
        order:    5,
        published: true,
        level:    2,
        summary:  "How GDP data reflects economic health and feeds into currency trends.",
        points:   ["What GDP measures", "Flash vs revised GDP releases", "How GDP fits into the macro picture"],
        body: `# GDP: Economic Growth and What It Means for Currency Strength

## What you'll learn
- What GDP measures and why growth matters for currency valuation
- The difference between flash, preliminary, and revised GDP releases and which to trade
- How to integrate GDP into your overall macro picture alongside rates and employment

## What is GDP and Why Does It Matter for Forex?

Gross Domestic Product (GDP) is the total monetary value of all goods and services produced within a country in a given period. It is the broadest measure of economic activity and the primary indicator used to assess whether an economy is growing, stagnating, or contracting.

GDP matters for forex because stronger economic growth:
- Supports higher employment (fewer rate cuts needed)
- Often accompanies higher inflation (more pressure for rate hikes or holds)
- Attracts foreign investment (capital inflows, currency demand)
- Signals confidence in the economy (supports the currency)

A contracting economy (two consecutive quarters of negative GDP growth = technical recession) has the opposite effects: rate cut expectations rise, investment flows decrease, and the currency weakens.

The relationship is not always linear. High GDP growth accompanied by high inflation can be bearish for a currency if the market believes the central bank will need to damage growth to control inflation. Context always matters.

## GDP Release Structure: Flash, Preliminary, and Final

GDP is released in multiple revisions over several weeks, not as a single definitive number:

**Flash GDP (Advance Estimate)**: The first estimate, released approximately 30 days after the quarter ends. Based on incomplete data (approximately 65–70% of full data). This is the market-moving release because it is the first reading.

**Preliminary (Second Estimate)**: Released approximately 60 days after quarter end. More data included. Often modest revisions, lower market impact unless revision is significant.

**Final (Third Estimate)**: Released approximately 90 days after quarter end. Comprehensive data. Rarely surprises; minimum market impact.

**Trade the flash GDP release.** The others are noise unless they revise the flash significantly.

## Quarter-over-Quarter vs Year-over-Year

GDP is reported two ways:

**QoQ (Quarter-over-Quarter)**: Growth compared to the previous quarter, annualised. This is the number markets focus on in the US (e.g. "US GDP Q1 2026: +2.8% annualised").

**YoY (Year-over-Year)**: Growth compared to the same quarter last year. More commonly used in Europe and emerging markets. Less volatile than QoQ.

When comparing US and Eurozone GDP, make sure you are comparing like-for-like. A 2.8% annualised US QoQ rate is roughly equivalent to a 0.7% European quarterly rate (which becomes 2.8% annualised).

## GDP vs the Market Expectation

Like all macro releases, the market reaction is driven by the deviation from consensus forecast, not the absolute number.

**GDP beats forecast**: Economy is stronger than expected → fewer rate cuts needed → currency bullish
**GDP misses forecast**: Economy weaker → more rate cuts likely → currency bearish
**GDP confirms forecast**: No surprise → limited immediate reaction

A common scenario: GDP comes in at 2.8% when forecast was 2.5%, but this follows a quarter where GDP was 3.6%. The headline beat looks bullish, but the trend is decelerating. The market may sell the currency despite the beat if deceleration is the dominant narrative.

Always compare against both the forecast AND the previous reading.

## GDP and the Rate Outlook: The Connection

The reason GDP matters for forex is primarily through its influence on the interest rate outlook:

Strong GDP + high inflation → central bank holds rates high or hikes → currency bullish
Weak GDP + falling inflation → central bank cuts rates → currency bearish
Strong GDP + low inflation → ideal environment; central bank can be patient → moderately bullish
Weak GDP + high inflation (stagflation) → central bank in a bind; highly uncertain → currency volatile

The stagflation scenario is the most difficult for central banks and the most unpredictable for traders. When growth is weak but inflation is persistent, the central bank cannot easily cut rates (which would worsen inflation) nor keep them high (which worsens the economy). USD in 2022 was an example: the Fed raised rates aggressively despite growth concerns, keeping USD strong but creating economic stress.

## GDP in the Context of Your Weekly Analysis

GDP is a quarterly release, so it does not affect your weekly routine as frequently as CPI or NFP. But when GDP week arrives:

1. Check whether the flash estimate is above or below consensus
2. Consider how the print changes the rate outlook narrative
3. Watch for revisions in the preliminary and final estimates if they are material (more than 0.3–0.5 percentage points)

For EURUSD: compare US GDP trajectory vs Eurozone GDP trajectory. The pair that is growing faster has a currency that should be stronger, all else equal.

## Key takeaways
- GDP measures total economic output. Stronger growth generally supports higher rates and a stronger currency
- Trade the flash GDP release. Preliminary and final revisions rarely move markets unless the revision is large
- The deviation from forecast drives the immediate reaction, but the trend (accelerating vs decelerating) drives the follow-through
- GDP feeds the rate outlook: the mechanism is Growth → Employment → Inflation → Interest Rate → Currency`,
      },
      {
        slug:     "central-banks-fed-ecb-boe-boj",
        title:    "Central banks: the Fed, ECB, BOE, BOJ, and RBNZ explained",
        duration: "28 min",
        order:    6,
        published: true,
        level:    2,
        summary:  "The mandate, tools, and communication style of the five central banks you trade.",
        points:   ["Each bank's mandate and tools", "How to read meeting statements", "The banks most relevant to your pairs"],
        body: `# Central Banks: The Fed, ECB, BOE, BOJ, and RBNZ Explained

## What you'll learn
- The mandate, policy tools, and communication style of each central bank relevant to your pairs
- How to read central bank meeting statements and press conferences for trading signals
- The specific banks that matter most for EURUSD, GBPUSD, NZDUSD, XAUUSD, and NAS100

## Why Central Banks Are the Most Important Institutions in Forex

Central banks set the price of money. Every forex trend of more than a few days duration is ultimately rooted in the policy stance or policy expectations of one or more central banks. Understanding who they are, what they care about, and how they communicate is not optional for a fundamental trader. It is foundational.

There are five central banks that directly affect your instruments:

---

## Federal Reserve (The Fed) — USD

**Mandate**: Dual mandate — maximum employment AND price stability (2% inflation target). This is unique among major central banks; most others have a single inflation mandate.

**Policy tool**: The Federal Funds Rate — the target rate at which banks lend to each other overnight. Everything else (mortgage rates, corporate borrowing, emerging market capital flows) follows from this rate.

**Meeting schedule**: Eight times per year (roughly every six weeks). Every meeting includes a statement; four meetings per year include updated projections (the dot plot) and a press conference with the Chair.

**The dot plot**: A quarterly chart showing where each Fed official expects rates to be over the next several years. It is one of the most market-moving documents in global finance. A shift in the median dot (even 25 basis points) can move EURUSD 50–100 pips.

**Communication style**: The Fed uses careful, measured language. Every word in the statement is deliberate. Changes in phrasing (e.g. adding "patient" or removing "additional firming may be appropriate") are significant signals.

**Relevance**: Affects every USD pair and indirectly affects all other central banks through global capital flows. The Fed is the most important central bank in the world for forex.

---

## European Central Bank (ECB) — EUR

**Mandate**: Single mandate — price stability (2% inflation target). Unlike the Fed, employment is not an explicit mandate, though it is monitored.

**Policy tool**: The Deposit Facility Rate — the rate commercial banks receive on overnight deposits at the ECB. This is the primary rate affecting Eurozone monetary conditions.

**Meeting schedule**: Eight times per year, alternating between Frankfurt and other Eurozone cities.

**Key characteristic**: The ECB must manage monetary policy for 20 different economies with different growth rates, inflation profiles, and debt levels. This creates complexity. Peripheral countries (Italy, Spain, Greece) often have different needs than core countries (Germany, France, Netherlands). This internal tension sometimes creates uncertainty.

**Relevance**: Primary driver of EUR, which means EURUSD is the most directly ECB-influenced pair in your portfolio.

---

## Bank of England (BOE) — GBP

**Mandate**: Price stability (2% CPI target), with secondary support for government economic objectives including growth and employment.

**Policy tool**: The Bank Rate.

**Meeting schedule**: Eight times per year. Each meeting is accompanied by minutes and a vote breakdown (showing which members voted for what rate action).

**Key characteristic**: The BOE's vote breakdown is uniquely valuable. Knowing that 7-2 voted to hold, with 2 dissenting in favour of a cut, tells you that two members are already dovish, which increases the probability of a cut at the next meeting. No other major central bank provides this transparency so directly.

**Relevance**: Primary driver of GBP, affecting GBPUSD directly.

---

## Bank of Japan (BOJ) — JPY

**Mandate**: Price stability (2% inflation target, but historically undershooting).

**Policy tool**: Policy interest rate and Yield Curve Control (YCC) — a unique tool that targets the yield on 10-year Japanese government bonds within a specific band.

**Key characteristic**: The BOJ spent decades in ultra-loose policy territory (near-zero or negative rates). This makes JPY the world's primary funding currency for carry trades: traders borrow cheaply in JPY and invest in higher-yielding currencies. When the BOJ signals rate hikes (as it began doing in 2024), JPY strengthens dramatically as carry trades unwind.

**Warning**: BOJ meetings are the most unpredictable of any major central bank. Policy shifts often come without clear forward guidance. NAS100 and XAUUSD react sharply when JPY moves violently.

**Relevance**: JPY does not appear directly in your traded pairs (EURUSD, GBPUSD, NZDUSD, XAUUSD, NAS100), but JPY movements via USDJPY affect DXY, which affects all your USD pairs and gold.

---

## Reserve Bank of New Zealand (RBNZ) — NZD

**Mandate**: Price stability (1–3% inflation target band, with 2% midpoint) and support for maximum sustainable employment.

**Meeting schedule**: Seven times per year.

**Key characteristic**: The RBNZ is one of the most transparent and direct central banks. It publishes an OCR (Official Cash Rate) track — a projected path for interest rates — at each Monetary Policy Statement meeting. This gives traders unusually clear forward guidance.

**Relevance**: Primary driver of NZDUSD. NZD is a commodity-linked, higher-beta currency: it tends to strengthen in risk-on environments and weaken in risk-off conditions, in addition to responding to RBNZ policy.

---

## Reading Central Bank Statements: A Practical Guide

Every central bank statement follows a structure:

1. **The decision**: Rate held/raised/cut by X basis points
2. **The inflation assessment**: Is inflation above target, at target, or below?
3. **The growth assessment**: Is the economy growing, slowing, or contracting?
4. **The forward guidance**: What comes next? This is the most market-moving section.

For forward guidance, compare this meeting's language to the previous meeting's language word-for-word. Changes in phrasing are the signal.

Previous: *"Further rate increases may be appropriate"*
Current: *"The committee will assess incoming data before determining whether further policy firming is necessary"*

This shift from "may be appropriate" to "will assess" is dovish. The market will reprice lower rates. USD weakens.

## Key takeaways
- The Fed is the most important central bank for global forex. Its dual mandate (employment + inflation) means both data sets matter
- The ECB's single inflation mandate and multi-country complexity creates additional uncertainty for EUR
- The BOE's vote breakdown is uniquely transparent — 7-2 splits tell you where the next move is likely going
- The BOJ's ultra-loose policy history makes JPY the global carry trade funding currency. BOJ shifts are violent and unpredictable
- The RBNZ's published OCR track gives unusually clear forward guidance for NZD traders`,
      },
      {
        slug:     "bond-yields-carry-trade",
        title:    "Bond yields and the carry trade: the institutional money flow",
        duration: "24 min",
        order:    7,
        published: true,
        level:    2,
        summary:  "How government bond yields drive forex and how the carry trade creates sustained currency trends.",
        points:   ["Why bond yields and forex are linked", "The yield curve and what it signals", "The carry trade explained"],
        body: `# Bond Yields and the Carry Trade: The Institutional Money Flow

## What you'll learn
- Why government bond yields are a real-time indicator of interest rate expectations and why they drive forex
- How to read the yield curve for economic signals
- What the carry trade is, why it creates sustained forex trends, and when it unwinds violently

## Why Bond Yields Move Currencies

Government bonds are the safest fixed-income assets in the world. When you buy a US 10-year Treasury bond, you lend money to the US government for 10 years and receive a fixed interest payment (the yield). The yield fluctuates in the secondary market based on supply and demand.

Here is the critical link to forex: **bond yields reflect the market's expectation for future interest rates**. When the market expects the Fed to raise rates, demand for bonds falls (because new bonds will pay higher rates), so existing bond prices fall and yields rise. When the market expects rate cuts, bond prices rise and yields fall.

This means bond yields move in real-time, before the central bank actually changes rates. Forex traders watch yields as a leading indicator of central bank direction.

**Practical rule**: When US 10-year Treasury yields rise, USD typically strengthens. When they fall, USD typically weakens. This relationship holds across 80% of market conditions and is one of the most reliable cross-asset correlations in forex.

## The DXY-Yield Relationship

The DXY (US Dollar Index) has a historically strong positive correlation with the US 10-year Treasury yield. When the yield makes new highs, watch for DXY to follow. When yields peak and begin falling, DXY often follows with a 1–3 week lag.

Monitoring the 10Y yield alongside DXY gives you a macro confirmation signal for USD direction. If EURUSD is setting up for a long trade but the 10Y yield is making new highs, be cautious. The yield is telling you USD strength is likely to continue.

## The Yield Spread: Comparing Two Countries

Just as the interest rate differential matters for currency direction, the **yield spread** between two countries' 10-year bonds tells you where smart money is flowing.

EURUSD example: US 10Y yield − Germany 10Y yield (Bund) = the spread. When this spread widens (US yields rise faster than German yields), USD is more attractive for fixed income investors globally. Capital flows to the US, buying USD, and EURUSD falls. When the spread narrows, EUR becomes relatively more attractive.

You can track this spread on financial data platforms. It moves in real-time and often leads the forex pair by a day or two.

## The Yield Curve

The yield curve plots the yields of government bonds at different maturities (2-year, 5-year, 10-year, 30-year). Its shape tells you about economic expectations.

**Normal (upward sloping)**: Short-term yields are lower than long-term yields. This is the healthy default. Growth is expected.

**Flat**: Short and long-term yields are similar. Uncertainty about the future.

**Inverted**: Short-term yields are HIGHER than long-term yields. This happens when the central bank has raised short-term rates aggressively while long-term investors expect future rate cuts (due to expected recession). An inverted yield curve (specifically the 2Y/10Y spread going negative) is one of the most reliable recession predictors in history — and recession expectations are bearish for currencies.

The 2Y/10Y inversion in 2022–2023 preceded significant economic concerns and was a key driver of the rate cut expectations that followed.

## The Carry Trade: Why Yield Differentials Create Trends

The carry trade is one of the most powerful forces in forex. It works as follows:

1. A hedge fund borrows money in a low-interest-rate currency (e.g. JPY at 0.1%)
2. Converts that money into a high-interest-rate currency (e.g. NZD at 5.5%)
3. Invests in NZD-denominated assets earning 5.5%
4. Profits from the 5.4% rate differential (the "carry")

Multiply this by billions of dollars and you have sustained, structural demand for NZD (the "carry" currency) and sustained selling pressure on JPY (the "funding" currency). This is why NZDJPY tends to have strong trending behaviour — carry trade flows push it in one direction for extended periods.

The same logic applies to AUDJPY, GBPJPY, and any high-yield vs low-yield currency pair.

## When the Carry Trade Unwinds: The Risk

The carry trade is the most dangerous trade in the world to be short when it unwinds. When risk appetite collapses (a financial crisis, geopolitical shock, extreme market panic), hedge funds simultaneously close carry positions:
- They sell NZD, AUD, GBP (the carry currencies)
- They buy JPY, CHF, USD (the funding/safe-haven currencies)

This creates violent, one-directional moves. NZDJPY can fall 1,000–3,000 pips in days during a carry unwind. For retail traders, being long NZD or AUD against JPY without understanding carry risk is dangerous.

Signal to watch: when VIX (volatility index) spikes above 25–30, carry trades are unwinding. Reduce or close positions in carry currency longs (NZD, AUD, high-yield EM currencies).

## How to Use This Weekly

Every Sunday:
1. Check the US 10Y Treasury yield vs last week. Rising or falling?
2. Check the yield spread for your target pairs (US 10Y vs Germany 10Y for EURUSD, US 10Y vs UK Gilts 10Y for GBPUSD)
3. Is the spread widening (bearish EURUSD/GBPUSD) or narrowing (bullish EURUSD/GBPUSD)?
4. Is there any carry trade concern this week (elevated VIX, geopolitical news, FOMC)?

This takes five minutes and provides a cross-asset confirmation of your technical bias.

## Key takeaways
- Bond yields reflect real-time market expectations for interest rates. Rising yields = rate hike expectations = currency bullish
- DXY and US 10Y yield are strongly correlated. Divergence between them is worth noting as a potential signal
- The yield spread between two countries (not just the absolute yields) drives the capital flow between their currencies
- The carry trade creates sustained trends in high-yield vs low-yield pairs. But it unwinds violently during risk-off events`,
      },
      {
        slug:     "risk-on-risk-off-safe-havens",
        title:    "Risk-on vs risk-off: safe havens and what they mean for your trades",
        duration: "20 min",
        order:    8,
        published: true,
        level:    2,
        summary:  "How global risk appetite affects currency flows and which currencies benefit.",
        points:   ["What risk-on and risk-off mean", "Safe-haven currencies: USD, JPY, CHF, XAU", "How to read risk sentiment weekly"],
        body: `# Risk-On vs Risk-Off: Safe Havens and What They Mean for Your Trades

## What you'll learn
- What "risk-on" and "risk-off" mean in the context of global capital flows
- Which currencies are safe havens and which are risk currencies, and why
- How to assess the current risk environment before building your weekly bias

## What is Risk Sentiment?

Risk sentiment describes the collective appetite of global investors for taking risk. It oscillates between two poles:

**Risk-on**: Investors are optimistic about the economic outlook and willing to take risk for higher returns. Capital flows away from safe assets (government bonds, safe-haven currencies) toward higher-returning assets (equities, emerging market currencies, commodities, high-yield currencies).

**Risk-off**: Investors are fearful or uncertain. Capital flows away from risky assets and into the safest, most liquid assets in the world, regardless of yield. Preservation of capital trumps return.

The shift between risk-on and risk-off can happen in hours when a major shock occurs (a banking crisis, geopolitical escalation, pandemic announcement), or it can develop gradually over weeks as economic data deteriorates.

## The Safe-Haven Hierarchy

Not all safe havens are equal. Here is the hierarchy in order of "safety premium" during extreme risk-off:

**1. USD (US Dollar)**: The world's reserve currency. In genuine global crises, capital flows to USD because it is the most liquid currency on Earth and the denomination of the majority of global trade and debt. Even if the crisis originates in the US, USD initially strengthens as global dollar-denominated debt is repaid.

**2. JPY (Japanese Yen)**: Safe-haven status comes from Japan's status as the world's largest creditor nation and the carry trade unwind dynamic described in the bond yields lesson. When risk-off hits, JPY strengthens dramatically and rapidly.

**3. CHF (Swiss Franc)**: Switzerland's political neutrality, sound banking system, and current account surplus make CHF a refuge. Smaller flows than USD or JPY but consistent.

**4. XAU (Gold)**: Gold is not a currency but behaves as one in risk-off. It is the ultimate store of value with no counterparty risk. During systemic risk events (banking crises, currency crises), gold often rallies strongly.

## The Risk Currencies

These currencies weaken in risk-off and strengthen in risk-on:

**AUD (Australian Dollar)**: Commodity currency (iron ore, coal). Closely linked to Chinese economic activity. High beta to global growth.

**NZD (New Zealand Dollar)**: Similar to AUD. Risk currency and carry trade destination.

**GBP (British Pound)**: Historically a risk currency. Reacts to both UK fundamentals and global risk sentiment.

**EM currencies**: South African Rand, Mexican Peso, Turkish Lira, and others. Extremely sensitive to risk sentiment. Capital flows out rapidly in risk-off.

## How to Read Risk Sentiment

**VIX (CBOE Volatility Index)**: The most commonly used fear gauge. Measures implied volatility in the S&P 500 options market. A VIX below 15 = complacent (risk-on). VIX 20–25 = elevated concern. VIX above 30 = fear. VIX above 40 = extreme fear (2008, 2020 levels).

**DXY direction**: In risk-off, DXY typically rises as capital floods to USD. A rising DXY with rising VIX = risk-off environment.

**S&P 500 / NAS100 direction**: Equity markets are the most visible risk asset. Sharp equity declines (more than 2% in a day) often trigger currency risk-off flows.

**Gold and Treasuries**: Rising gold prices and falling Treasury yields (as investors buy bonds for safety) confirm risk-off. If gold and equities are both rising, that is risk-on (growth is strong and the dollar is not being favoured).

## Risk Sentiment and Your Specific Instruments

**EURUSD**: In extreme risk-off, EUR often weakens vs USD (capital flows to USD). But in moderate risk-off where European stability is not in question, EUR can hold relatively well.

**GBPUSD**: GBP is a risk currency. It weakens in risk-off more reliably than EUR.

**NZDUSD**: High beta to risk. Strong risk-off = NZD weakness. Risk-on = NZD strength.

**XAUUSD**: Safe-haven status means gold benefits in risk-off. However, in extreme dollar-demand scenarios, gold can briefly fall as investors liquidate everything for dollars (as in March 2020). Medium-risk-off is typically bullish gold.

**NAS100**: Risk asset. Falls in risk-off, rises in risk-on. Tech sector is particularly sensitive to yield movements (rising yields = discounted future cash flows = lower tech valuations).

## Assessing Risk Sentiment Weekly

Every Sunday, spend five minutes assessing:

1. **VIX**: Where did it close on Friday? Rising or falling from last week?
2. **S&P 500**: Are equities in an uptrend or downtrend? Were there significant weekly moves?
3. **DXY**: Risk-off support or risk-on weakness?
4. **Gold**: Rising (risk concern) or falling (risk appetite)?
5. **Any geopolitical news over the weekend**: Escalations in geopolitical tensions can open Sunday forex markets with a gap.

This five-minute check tells you whether you should be biased toward safe-haven (USD, JPY, CHF, Gold) or risk (NZD, GBP, equities) this week.

## Key takeaways
- Risk-on = capital flows to higher-yielding, higher-risk assets (NZD, AUD, equities)
- Risk-off = capital flows to safety (USD, JPY, CHF, gold)
- VIX is the quickest risk barometer. Below 15 = complacent, above 30 = fearful
- Align your pairs with the risk environment. Trading NZDUSD long in a risk-off week is fighting the macro tide`,
      },
      {
        slug:     "economic-calendar-events",
        title:    "The economic calendar: high-impact events and how to trade around them",
        duration: "16 min",
        order:    9,
        published: true,
        level:    2,
        summary:  "How to use the economic calendar to prepare for, avoid, and capitalise on major data releases.",
        points:   ["Tier 1 vs Tier 2 vs Tier 3 events", "How to trade before and after releases", "Events specific to your pairs"],
        body: `# The Economic Calendar: High-Impact Events and How to Trade Around Them

## What you'll learn
- How to categorise calendar events by their likely market impact
- The specific rules for how to position before, during, and after major releases
- The key events for each currency in your traded pairs

## Event Impact Tiers

Not all calendar events are equal. The economic calendar grades events by expected impact, but understanding why each tier matters helps you make better decisions.

**Tier 1 (Red/High Impact)**: These events move markets significantly and unpredictably. They include:
- US NFP (first Friday each month)
- FOMC Rate Decision and Press Conference
- US CPI
- US Core PCE
- FOMC Meeting Minutes
- Major GDP releases (US, Eurozone, UK)
- ECB Rate Decision and Press Conference
- BOE Rate Decision
- RBNZ Rate Decision and Policy Statement

During Tier 1 events, spreads widen significantly, price can move 50–200+ pips in seconds, and stop orders may be executed at prices far from where they were set. These events require specific management.

**Tier 2 (Orange/Medium Impact)**: Noteworthy but rarely the primary driver on their own. They include:
- US Retail Sales
- US ISM Manufacturing and Services PMI
- US JOLTS Job Openings
- US ADP Employment Report
- Eurozone CPI
- UK CPI
- Unemployment claims (US weekly)

Tier 2 events can move markets 20–60 pips but rarely cause sustained trend changes on their own. They are most significant when they confirm or contradict a Tier 1 narrative.

**Tier 3 (Yellow/Low Impact)**: Routine releases that rarely cause meaningful market movement unless combined with other factors. Building permits, housing starts, minor PMI readings.

## Rules for Trading Around Tier 1 Events

**Before the event (30–60 minutes prior)**:
- Close any positions you are not comfortable holding through the release
- Do not enter new positions. Pre-event positioning often reverses violently
- Mark the release time on your chart as a vertical line so you can see what happened when you review the trade later

**During the release (first 15 minutes)**:
- Do not trade. Spreads are wide, price is whipsawing, and the real direction has not been established. The first candle is almost always noise.
- Watch and note the reaction, but do not enter

**After the initial spike (15–30 minutes post-release)**:
- The sustained direction (if any) is beginning to establish
- If the reaction is strong and directional, look for a pullback to the first FVG created by the initial move for an entry
- If the reaction is mixed or quickly reverses, there is no clean post-news trade. Skip it.

**Resuming normal analysis (1–2 hours post-release)**:
- The event is priced in. Return to your regular technical analysis with the updated macro backdrop

## Key Events by Currency

**USD (affects EURUSD, GBPUSD, NZDUSD, XAUUSD, NAS100)**:
- NFP (first Friday): highest impact
- FOMC (every six weeks): second highest
- CPI (monthly, mid-month): third highest
- Core PCE (monthly, end of month)
- GDP Flash (quarterly)

**EUR (affects EURUSD)**:
- ECB Rate Decision (every six weeks)
- Eurozone CPI (monthly)
- German CPI (day before Eurozone CPI, can preview the reading)
- Eurozone GDP Flash (quarterly)
- German IFO Business Climate (monthly confidence indicator)

**GBP (affects GBPUSD)**:
- BOE Rate Decision and Monetary Policy Report (eight times per year)
- UK CPI (monthly)
- UK GDP (monthly estimate plus quarterly detailed)
- UK Employment and Wage Data

**NZD (affects NZDUSD)**:
- RBNZ Rate Decision and Policy Statement (seven times per year)
- New Zealand CPI (quarterly)
- New Zealand employment data (quarterly)

**XAU (Gold)**:
- Responds primarily to USD data (NFP, FOMC, CPI)
- Also responds to risk sentiment events (geopolitical, financial stability)

## The Calendar as a Weekly Preparation Tool

Every Sunday, build a calendar for the coming week:

1. List all Tier 1 events and their day and time (UTC)
2. Note which pairs are most affected
3. Mark the killzones that coincide with major releases (if NFP lands at 13:30 UTC, it overlaps the NY open killzone entirely)
4. Decide in advance: will you avoid trading that pair entirely on the release day, or will you manage a position through it?

Pre-deciding your rules for news events removes the emotional decision-making in the moment.

## Key takeaways
- Tier 1 events (NFP, FOMC, CPI) require specific management: no new positions 30 minutes before, no trades during the initial spike
- The post-release FVG created by the initial spike often provides the best risk-defined entry if the direction is clear
- Know which events matter for each currency you trade. USD events dominate because they affect everything
- Build your weekly calendar every Sunday. Knowing when events land prevents being caught off-guard during a live session`,
      },
      {
        slug:     "building-weekly-macro-bias",
        title:    "Building your weekly macro bias: the Sunday analysis process",
        duration: "22 min",
        order:    10,
        published: true,
        level:    2,
        summary:  "A step-by-step process to synthesise all macro factors into a weekly directional bias before trading.",
        points:   ["The five-step Sunday process", "Combining macro with the TrendMatrix", "What to do when macro and technical conflict"],
        body: `# Building Your Weekly Macro Bias: The Sunday Analysis Process

## What you'll learn
- The complete five-step Sunday process to build your macro bias for the week
- How to combine your macro analysis with the TrendMatrix for a complete weekly view
- How to handle conflicts between macro and technical analysis

## Why Sunday Is the Most Important Trading Day

Sunday is the only day where you have time to think without the pressure of an open market. During the week, sessions move fast: London opens, sweeps happen, FVGs fill, trades are entered or missed. There is no time to step back and assess the macro picture.

Sunday analysis is what separates traders who are always reacting from those who are always executing a plan. Kondwani does his full analysis every Sunday before the new week opens. The Trend Matrix is updated on Sundays. This is not a coincidence. It is the process.

Everything in this course (interest rates, inflation, employment, central banks, bond yields, risk sentiment, the economic calendar) comes together in one 30–45 minute Sunday session.

## Step 1: Review the Rate Environment (5 minutes)

For each currency in your traded pairs (USD, EUR, GBP, NZD), note:
- Current interest rate
- Rate differential vs each pair you trade
- Direction the differential is moving: widening or narrowing?

Write one sentence per currency:
*"USD: Fed funds rate 5.25%, holding. ECB cut to 3.75% last meeting. Differential widening in USD's favour. USD macro bias: bullish."*

This takes five minutes and immediately tells you the foundational direction.

## Step 2: Check Last Week's Key Data (5 minutes)

What major data released last week? How did it compare to expectations?

- Did US CPI beat or miss?
- Was NFP above or below forecast?
- Did any central bank meet, and what was the outcome?

Summarise the net effect: did last week's data confirm or challenge the rate environment bias from Step 1? If NFP was strong and CPI was elevated, it confirms the bullish USD bias. If NFP was weak, it creates uncertainty.

## Step 3: Check the Economic Calendar for This Week (5 minutes)

What is releasing this week that could change the picture?

- List all Tier 1 events by day and time
- Note which pairs are directly affected
- Flag any pairs where a major release makes the technical analysis uncertain (you may want to wait until after the release before entering)

If FOMC meets on Wednesday, you might avoid entering EURUSD positions on Monday and Tuesday that you would need to hold through the decision.

## Step 4: Assess Risk Sentiment (5 minutes)

Check:
- VIX: Where did it close Friday? Is it elevated?
- DXY: Which direction did it close Friday? Making new highs or new lows?
- S&P 500 / NAS100: Is the equity market in a weekly uptrend or downtrend?
- Gold: Rising (concern) or falling (appetite for risk)?

Write one sentence: *"Risk environment: moderately risk-on. VIX at 14.2, S&P making new highs, DXY slightly bid. Neutral for gold."*

## Step 5: Write Your Weekly Bias Per Pair (10 minutes)

Now combine everything into a plain-English bias for each pair you plan to trade:

**EURUSD**: *"Macro: bearish. Rate differential favours USD. Last week's CPI confirmed inflation remains sticky. No FOMC this week. Technical (TrendMatrix): bearish daily structure, lower highs, lower lows. Bias: SHORT. Look for sell setups on London open this week."*

**GBPUSD**: *"Macro: mildly bearish. BOE meeting Thursday — market expects hold. UK CPI released Tuesday, expected to show cooling. If CPI misses (softer than expected), dovish BOE expectations increase. Bearish bias but cautious until Tuesday's CPI."*

**NZDUSD**: *"Macro: bearish. RBNZ signalled potential cut next meeting. NZD is a risk currency; risk-on environment this week is a mild offset. TrendMatrix: bearish. Bias: SHORT with caution around any NZ data midweek."*

**XAUUSD**: *"Macro: mixed. USD bullish macro = bearish gold. But risk sentiment is moderately risk-on, not strongly risk-off. COT: Large Specs moderately long gold. Bias: wait for clear price action signal. Technical: watch for sweep of equal lows before considering a long."*

## Combining Macro Bias with the TrendMatrix

Your TrendMatrix shows weekly SMC-based bias per pair. The macro bias should confirm it. When both agree, you have the highest-conviction week.

When they disagree — macro says bearish EURUSD but TrendMatrix shows bullish — you have three options:

1. **Skip the pair this week**: No certainty means no edge. Trade the pairs where macro and technical agree.
2. **Reduce size significantly**: If you choose to trade, risk 0.25% instead of 0.5%. Acknowledge the uncertainty.
3. **Wait for resolution**: Sometimes a Tier 1 event during the week will resolve the conflict. Wait for it.

Never fight the macro with full-size technical trades. The macro river is stronger than any single SMC setup.

## The Written Bias: Why It Must Be Written

Write it down. Not mentally noted — written. In your trading journal, in a notes app, anywhere. Two reasons:

**It forces precision**: Vague thoughts like "I think USD is probably strong this week" do not help you make decisions under pressure. "USD macro bias bullish: rate differential +1.5%, CPI beat, no FOMC" helps you stay anchored when London opens and a setup appears.

**It creates accountability**: When you review your trades on Sunday night, having last Sunday's written bias lets you see whether you followed your analysis or abandoned it during the week. This is how you identify your psychological leaks in real time.

## A Template for Your Weekly Macro Bias

    WEEKLY MACRO BIAS — Week of [date]

    RATE ENVIRONMENT:
    USD: [rate] [holding/hiking/cutting] [bias]
    EUR: [rate] [holding/hiking/cutting] [bias]
    GBP: [rate] [holding/hiking/cutting] [bias]
    NZD: [rate] [holding/hiking/cutting] [bias]

    LAST WEEK DATA SUMMARY:
    [Key releases and their impact]

    THIS WEEK CALENDAR:
    [Tier 1 events with day, time, and affected pairs]

    RISK SENTIMENT:
    VIX: [level] [rising/falling]
    DXY: [level] [direction]
    Equities: [risk-on/risk-off/neutral]

    PAIR BIASES:
    EURUSD: [LONG/SHORT/NEUTRAL] — [one-sentence reason]
    GBPUSD: [LONG/SHORT/NEUTRAL] — [one-sentence reason]
    NZDUSD: [LONG/SHORT/NEUTRAL] — [one-sentence reason]
    XAUUSD: [LONG/SHORT/NEUTRAL] — [one-sentence reason]
    NAS100: [LONG/SHORT/NEUTRAL] — [one-sentence reason]

This template takes 30–45 minutes the first time. After three weeks it takes 20 minutes. After three months it becomes automatic.

## Key takeaways
- Sunday analysis is the highest-value 30 minutes of your trading week. Treat it as non-negotiable
- The five steps: Rate environment → Last week data → This week calendar → Risk sentiment → Written pair biases
- When macro and TrendMatrix agree, you have maximum conviction. Trade full size
- When they conflict, skip, reduce size, or wait for the Tier 1 event that will resolve the disagreement
- Write your bias down. Written analysis creates accountability and prevents in-the-moment drift`,
      },
    ],
  },
] as const;

// ── Instrument seed data ──────────────────────────────────────────────────────

const INSTRUMENTS = [
  {
    symbol: "EURUSD", label: "EUR/USD", category: "forex",
    pipSize: 0.0001, pipValue: 10, tdSymbol: "EUR/USD",
    cotContract: "EURUSD", cotCode: "099741", cotMin52w: -98400, cotMax52w: 224600, cotMinC52w: -252400, cotMaxC52w: 98800,
    cotInverted: false, fxoTracked: true, displayOrder: 1,
  },
  {
    symbol: "GBPUSD", label: "GBP/USD", category: "forex",
    pipSize: 0.0001, pipValue: 10, tdSymbol: "GBP/USD",
    cotContract: "GBPUSD", cotCode: "096742", cotMin52w: -74200, cotMax52w: 58600, cotMinC52w: -68400, cotMaxC52w: 82400,
    cotInverted: false, fxoTracked: true, displayOrder: 2,
  },
  {
    symbol: "USDJPY", label: "USD/JPY", category: "forex",
    pipSize: 0.01, pipValue: 9.1, tdSymbol: "USD/JPY",
    cotContract: "USDJPY", cotCode: "097741", cotMin52w: -86400, cotMax52w: 76200, cotMinC52w: -78200, cotMaxC52w: 88400,
    cotInverted: true, fxoTracked: true, displayOrder: 3,
  },
  {
    symbol: "USDCHF", label: "USD/CHF", category: "forex",
    pipSize: 0.0001, pipValue: 11.1, tdSymbol: "USD/CHF",
    cotContract: "USDCHF", cotCode: "092741", cotMin52w: -42600, cotMax52w: 38400, cotMinC52w: -36400, cotMaxC52w: 44200,
    cotInverted: true, fxoTracked: false, displayOrder: 4,
  },
  {
    symbol: "AUDUSD", label: "AUD/USD", category: "forex",
    pipSize: 0.0001, pipValue: 10, tdSymbol: "AUD/USD",
    cotContract: "AUDUSD", cotCode: "232741", cotMin52w: -88400, cotMax52w: 72600, cotMinC52w: -84200, cotMaxC52w: 96400,
    cotInverted: false, fxoTracked: true, displayOrder: 5,
  },
  {
    symbol: "NZDUSD", label: "NZD/USD", category: "forex",
    pipSize: 0.0001, pipValue: 10, tdSymbol: "NZD/USD",
    cotContract: "NZDUSD", cotCode: "112741", cotMin52w: -32800, cotMax52w: 28400, cotMinC52w: -28600, cotMaxC52w: 36200,
    cotInverted: false, fxoTracked: true, displayOrder: 6,
  },
  {
    symbol: "USDCAD", label: "USD/CAD", category: "forex",
    pipSize: 0.0001, pipValue: 7.5, tdSymbol: "USD/CAD",
    cotContract: "USDCAD", cotCode: "090741", cotMin52w: -62800, cotMax52w: 56200, cotMinC52w: -58400, cotMaxC52w: 66400,
    cotInverted: true, fxoTracked: false, displayOrder: 7,
  },
  {
    symbol: "XAUUSD", label: "XAU/USD", category: "commodity",
    pipSize: 0.01, pipValue: 1, tdSymbol: "XAU/USD",
    cotContract: "XAUUSD", cotCode: "088691", cotMin52w: 68400, cotMax52w: 198200, cotMinC52w: -242600, cotMaxC52w: -82400,
    cotInverted: false, fxoTracked: false, displayOrder: 8,
  },
  {
    symbol: "NAS100", label: "NAS100", category: "index",
    pipSize: 1, pipValue: 20, tdSymbol: "IXIC",
    cotContract: "NAS100", cotCode: "209742", cotMin52w: -48600, cotMax52w: 82400, cotMinC52w: -58400, cotMaxC52w: 42600,
    cotInverted: false, fxoTracked: false, displayOrder: 9,
  },
  {
    symbol: "DXY", label: "DXY", category: "index",
    pipSize: 0.001, pipValue: 10, tdSymbol: "DXY",
    cotContract: "DXY", cotCode: "098662", cotMin52w: -62400, cotMax52w: 48200, cotMinC52w: -52800, cotMaxC52w: 64600,
    cotInverted: false, fxoTracked: false, displayOrder: 10,
  },
];

// ── Main seed function ────────────────────────────────────────────────────────

async function main() {
  console.log("Seeding instruments...");
  for (const inst of INSTRUMENTS) {
    await prisma.instrument.upsert({
      where:  { symbol: inst.symbol },
      update: inst,
      create: inst,
    });
    console.log(`  Instrument: ${inst.symbol}`);
  }

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
