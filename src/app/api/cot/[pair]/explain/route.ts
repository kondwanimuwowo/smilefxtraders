import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePaidPlan } from "@/lib/plan-guard";
import { getInstruments } from "@/lib/server/getInstruments";
import { computeCotStats, INDEX_WEEKS, percentile } from "@/lib/cot/signal";
import { GAVO_COT_SYSTEM_PROMPT, buildCotExplainMessage } from "@/lib/cot/gavoPrompt";

const client = new Anthropic();

// Gavo COT Read (Layer 6). Cached per pair in GavoCotExplanation and only
// regenerated when inputHash changes — mirrors /api/macro/explain's
// idempotency idiom. Plan-gated like /api/cot itself (PRO/FUNDED only).

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pair: string }> },
) {
  const denied = await requirePaidPlan("Gavo COT Read");
  if (denied) return denied;

  const { pair } = await params;
  const upper = pair.toUpperCase();

  try {
    const instruments = await getInstruments();
    const inst = instruments.find((i) => i.symbol === upper && i.cotContract != null);
    if (!inst) {
      return NextResponse.json({ error: "Unknown pair" }, { status: 404 });
    }

    const [rows, allTimeRange] = await Promise.all([
      prisma.cotReport.findMany({
        where:   { pair: upper },
        orderBy: { reportDate: "desc" },
        take:    INDEX_WEEKS,
        select:  {
          reportDate:     true,
          largeSpecLong:  true, largeSpecShort:  true, largeSpecNet:  true,
          commercialLong: true, commercialShort: true, commercialNet: true,
          smallSpecLong:  true, smallSpecShort:  true, smallSpecNet:  true,
          openInterest:   true,
        },
      }),
      prisma.cotReport.aggregate({
        where: { pair: upper },
        _min:  { largeSpecNet: true },
        _max:  { largeSpecNet: true },
      }),
    ]);

    if (rows.length < 2) {
      return NextResponse.json({ error: `Not enough COT history for ${upper} yet` }, { status: 404 });
    }

    const window = rows.map((r) => ({
      date:           r.reportDate.toISOString().split("T")[0],
      largeSpecNet:   r.largeSpecNet,
      commercialNet:  r.commercialNet,
      smallSpecNet:   r.smallSpecNet,
    }));
    const stats = computeCotStats(window);
    const current = rows[0];

    const cotIndexAll =
      allTimeRange._min.largeSpecNet != null && allTimeRange._max.largeSpecNet != null
        ? percentile(current.largeSpecNet, allTimeRange._min.largeSpecNet, allTimeRange._max.largeSpecNet)
        : null;

    // Regenerate only when the latest report week or its net figures change.
    const inputHash = `${current.reportDate.toISOString()}:${current.largeSpecNet}:${current.commercialNet}:${current.smallSpecNet}`;

    const existing = await prisma.gavoCotExplanation.findUnique({ where: { pair: upper } });
    if (existing && existing.inputHash === inputHash) {
      return NextResponse.json({ explanation: existing.explanation, generatedAt: existing.generatedAt, cached: true });
    }

    const userMessage = buildCotExplainMessage({
      pair:           upper,
      label:          inst.label,
      usdBase:        inst.cotInverted,
      signal:         stats.signal,
      cotIndex:       stats.cotIndex,
      cotIndexC:      stats.cotIndexC,
      cotIndexAll,
      wowChange:      stats.wowChange,
      divergenceType: stats.divergenceType,
      largeSpecNet:   current.largeSpecNet,
      largeSpecLong:  current.largeSpecLong,
      largeSpecShort: current.largeSpecShort,
      commercialNet:  current.commercialNet,
      smallSpecNet:   current.smallSpecNet,
      openInterest:   current.openInterest,
      reportDate:     current.reportDate.toISOString().split("T")[0],
    });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: [{ type: "text", text: GAVO_COT_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
    });

    const explanation = message.content[0].type === "text" ? message.content[0].text : "";

    const saved = await prisma.gavoCotExplanation.upsert({
      where:  { pair: upper },
      create: { pair: upper, explanation, model: "claude-sonnet-4-6", inputHash },
      update: { explanation, model: "claude-sonnet-4-6", inputHash, generatedAt: new Date() },
    });

    return NextResponse.json({ explanation: saved.explanation, generatedAt: saved.generatedAt, cached: false });
  } catch (err) {
    console.error("[cot/explain]", err);
    return NextResponse.json({ error: "Explanation failed" }, { status: 500 });
  }
}
