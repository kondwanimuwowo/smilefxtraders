import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthState } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getCandles } from "@/lib/spotware/candles";
import { buildPriceContext, formatPriceContext, entryPeriodFor } from "@/lib/gavo/price-context";
import { AuthUnavailableError } from "@/lib/api-error";
// The rulebook these prompts carry is the same object /rulebook renders, so
// the standard members read is provably the standard Gavo grades against.
import { buildRulebookPrompt } from "@/lib/rulebook";

const client = new Anthropic();

// ── System prompt (cached) ────────────────────────────────────────────────────
// This prefix is identical for every review request so it is sent with
// cache_control: ephemeral. After the first request it is read from the
// 5-minute prompt cache at 10% of normal input-token cost.

const SMC_SYSTEM_PROMPT = `You are Gavo, an AI trading coach built for the Smile FX Traders community. You specialise in Smart Money Concepts (ICT) and Supply & Demand, and your role is to review a student's trade journal entry and grade it honestly but encouragingly against the SMC rulebook.

## Your coaching philosophy
- Be direct and specific. Vague feedback does not help traders improve
- Recognise good execution as clearly as you call out mistakes
- Always tie feedback to SMC concepts (FVG, OB, liquidity, BOS, CHoCH, premium/discount)
- A disciplined loss is better than an undisciplined win. Reflect this in your grades
- The goal is to build consistent, rule-based traders, not gamblers who got lucky
- Write in plain punctuation: never use em dashes in your verdict, feedback, or tip. Use commas, colons, or separate sentences instead
- Write like a coach talking to a student, not a language model. Avoid: "it's not just X, it's Y" constructions, forced groups of three, staccato fragment chains ("No plan. No patience. No trade."), and aphorisms ("discipline is the currency of consistency"). Say the concrete thing plainly
- NEVER cite a rule by number. The trader cannot see this rulebook, so "you broke rule 7" tells them nothing. Name the thing that went wrong in plain words: "you entered mid-move instead of waiting for the retrace into the POI". The rule numbers are for your reasoning only, never for your output

## The Smile FX Traders SMC Rulebook

${buildRulebookPrompt("SMC")}

## Response format
Respond ONLY with minified JSON, no markdown fences, no extra text. Shape:
{"grade":"A+|A|B|C|D","verdict":"one punchy sentence (max 20 words)","good":["2–3 specific things the trader did well, referencing SMC concepts"],"improve":["2–3 specific things to improve, referencing exact rules broken"],"tip":"one actionable ICT-specific tip the trader should apply on their next setup"}

Grade scale:
- A+ : All 13 rules satisfied, clean execution, excellent R:R
- A  : 11–12 rules satisfied, minor friction but solid process
- B  : 8–10 rules satisfied, identifiable gaps but fundamentally sound
- C  : 5–7 rules satisfied, significant rule breaks, lucky outcome or unclear bias
- D  : Fewer than 5 rules satisfied, undisciplined, random entry with no SMC basis`;

const SND_SYSTEM_PROMPT = `You are Gavo, an AI trading coach built for the Smile FX Traders community. You specialise in Supply & Demand (S&D) trading, and your role is to review a student's trade journal entry and grade it honestly but encouragingly against the Supply & Demand rulebook.

## Your coaching philosophy
- Be direct and specific. Vague feedback does not help traders improve
- Recognise good execution as clearly as you call out mistakes
- Always tie feedback to S&D concepts (zone freshness, impulsive origin, premium/discount, correct side approach)
- A disciplined loss is better than an undisciplined win. Reflect this in your grades
- The goal is to build consistent, rule-based traders, not gamblers who got lucky
- Write in plain punctuation: never use em dashes in your verdict, feedback, or tip. Use commas, colons, or separate sentences instead
- Write like a coach talking to a student, not a language model. Avoid: "it's not just X, it's Y" constructions, forced groups of three, staccato fragment chains ("No plan. No patience. No trade."), and aphorisms ("discipline is the currency of consistency"). Say the concrete thing plainly
- NEVER cite a rule by number. The trader cannot see this rulebook, so "you broke rule 7" tells them nothing. Name the thing that went wrong in plain words: "you entered mid-move instead of waiting for the retrace into the POI". The rule numbers are for your reasoning only, never for your output

## The Smile FX Traders Supply & Demand Rulebook

${buildRulebookPrompt("SnD")}

## Response format
Respond ONLY with minified JSON, no markdown fences, no extra text. Shape:
{"grade":"A+|A|B|C|D","verdict":"one punchy sentence (max 20 words)","good":["2–3 specific things the trader did well, referencing S&D concepts"],"improve":["2–3 specific things to improve, referencing exact rules broken"],"tip":"one actionable S&D-specific tip the trader should apply on their next setup"}

Grade scale:
- A+ : All 13 rules satisfied, clean execution, fresh zone, excellent R:R
- A  : 11–12 rules satisfied, minor friction but solid S&D process
- B  : 8–10 rules satisfied, identifiable gaps but fundamentally sound
- C  : 5–7 rules satisfied, significant rule breaks such as a stale zone or wrong-side approach
- D  : Fewer than 5 rules satisfied, random entry with no S&D basis`;

// ── Trade-specific user message (NOT cached — changes every request) ──────────

function buildTradeMessage(ctx: {
  pair: string; dir: string; model: string; framework?: string; session?: string;
  rr?: number; riskPct?: number; result?: string; pnlR?: number;
  tags?: string[]; note?: string;
}): string {
  return [
    "Review this trade:",
    `Framework: ${ctx.framework ?? "SMC"} | Pair: ${ctx.pair} | Direction: ${ctx.dir} | Model: ${ctx.model} | Session: ${ctx.session ?? "—"}`,
    `Planned R:R: 1:${ctx.rr ?? "—"} | Risk: ${ctx.riskPct ?? "—"}% | Result: ${ctx.result ?? "—"}${ctx.pnlR ? ` (${ctx.pnlR}R)` : ""}`,
    `Tags: ${(ctx.tags ?? []).join(", ") || "none"}`,
    `Trader's note: ${ctx.note || "(none provided)"}`,
  ].join("\n");
}

/**
 * Broker candles around the trade, reduced to measurable facts.
 *
 * Scoped to the caller's own trades. Returns null on anything missing or
 * broken — a review without price context is the behaviour we already had, and
 * is far better than failing the review outright.
 */
async function loadPriceContext(tradeId: string, userId: string): Promise<string | null> {
  try {
    const trade = await prisma.trade.findFirst({
      where:  { id: tradeId, userId },
      select: {
        pair: true, direction: true, date: true, closedAt: true,
        entryPrice: true, stopLoss: true, takeProfit: true,
      },
    });
    if (!trade) return null;

    // Two timeframes, because the rulebook asks about two. Bias and
    // premium/discount are Daily questions; the sweep, the stop and the
    // excursion are entry-timeframe questions. Judging the first from H1 bars
    // gives the wrong answer outright — a trade can be in discount on H1 and
    // deep premium on the Daily.
    const entryPeriod = entryPeriodFor(trade.date, trade.closedAt);
    const entryBarMs = { M15: 900_000, H1: 3_600_000, H4: 14_400_000 }[entryPeriod];
    const entrySpan = entryBarMs * 60;

    const entryTo = new Date(Math.min((trade.closedAt ?? trade.date).getTime() + entrySpan, Date.now()));
    const entryFrom = new Date(entryTo.getTime() - entrySpan * 2);
    // 90 daily bars back from the entry: enough to establish the range the
    // trader should have been measuring premium/discount against.
    const htfTo = new Date(Math.min(trade.date.getTime() + 5 * 86_400_000, Date.now()));
    const htfFrom = new Date(htfTo.getTime() - 90 * 86_400_000);

    const [entryBars, htfBars] = await Promise.all([
      getCandles({ symbol: trade.pair, period: entryPeriod, from: entryFrom, to: entryTo }),
      getCandles({ symbol: trade.pair, period: "D1", from: htfFrom, to: htfTo }),
    ]);

    const ctx = buildPriceContext({
      entry: { period: entryPeriod, bars: entryBars.bars },
      htf:   { period: "D1", bars: htfBars.bars },
    }, {
      pair:     trade.pair,
      dir:      trade.direction === "LONG" ? "long" : "short",
      openedAt: trade.date,
      closedAt: trade.closedAt,
      entry:    trade.entryPrice,
      stop:     trade.stopLoss,
      target:   trade.takeProfit,
    });

    return ctx ? formatPriceContext(ctx) : null;
  } catch (e) {
    console.error("[review] price context unavailable:", e instanceof Error ? e.message : e);
    return null;
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // The gate used to run only `if (user)`, so an unauthenticated caller —
    // or one that lost the refresh-token race — skipped it entirely and got a
    // free Anthropic call. Deny by default instead.
    const supabase = await createClient();
    const auth = await getAuthState(supabase);
    if (auth.state === "unknown") throw new AuthUnavailableError();
    if (auth.state === "anonymous") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user
      .findUnique({ where: { supabaseId: auth.user.id }, select: { id: true, plan: true } })
      .catch(() => null);
    if (dbUser?.plan === "FREE") {
      return NextResponse.json({ error: "AI Review requires an Edge or Pro plan.", upgrade: true }, { status: 403 });
    }

    const body = await req.json();
    const systemPrompt = body.framework === "SnD" ? SND_SYSTEM_PROMPT : SMC_SYSTEM_PROMPT;

    // Load the trade server-side rather than trusting the posted fields: the
    // whole point is to check the trader's account against what price did, and
    // client-supplied timestamps would let the account define its own evidence.
    const priceContext = dbUser?.id && typeof body.tradeId === "string"
      ? await loadPriceContext(body.tradeId, dbUser.id)
      : null;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: systemPrompt,
          // The rulebook is identical for every review of the same framework — cache it.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{
        role: "user",
        content: priceContext
          ? `${buildTradeMessage(body)}\n\n${priceContext}`
          : buildTradeMessage(body),
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    const json = match ? JSON.parse(match[0]) : { grade: "—", verdict: text, good: [], improve: [], tip: "" };

    return NextResponse.json(json);
  } catch (err) {
    console.error("[review]", err);
    return NextResponse.json({ error: "Review failed" }, { status: 500 });
  }
}
