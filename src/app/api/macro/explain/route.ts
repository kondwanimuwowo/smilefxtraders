import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { SubjectType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { fetchConfluence } from "@/lib/macro/confluence";
import { GAVO_MACRO_SYSTEM_PROMPT, buildCurrencyExplainMessage, buildPairExplainMessage } from "@/lib/macro/gavoPrompt";
import type { BreakdownEntry } from "@/lib/macro/scoring";

const client = new Anthropic();

// Gavo narration (Layer 6). Cached per (subjectType, subjectKey) in
// GavoMacroExplanation and only regenerated when inputHash changes — mirrors
// the idempotency idiom already used by fx-orders' "already synced, skip"
// check. Plan-gated like /api/review (PRO/FUNDED only), same convention.

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { plan: true } }).catch(() => null);
      if (dbUser && dbUser.plan === "FREE") {
        return NextResponse.json({ error: "MacroEdge AI narration requires an Edge or Pro plan.", upgrade: true }, { status: 403 });
      }
    }

    const body = await req.json();
    const subjectType: SubjectType = body.subjectType === "PAIR" ? SubjectType.PAIR : SubjectType.CURRENCY;
    const subjectKey: string | undefined = body.subjectKey?.toUpperCase();
    if (!subjectKey) {
      return NextResponse.json({ error: "subjectKey is required" }, { status: 400 });
    }

    let userMessage: string;
    let inputHash: string;

    if (subjectType === SubjectType.CURRENCY) {
      const score = await prisma.currentCurrencyScore.findUnique({ where: { currency: subjectKey } });
      if (!score) {
        return NextResponse.json({ error: `No score computed yet for ${subjectKey}` }, { status: 404 });
      }
      inputHash = score.inputHash;
      userMessage = buildCurrencyExplainMessage({
        currency: subjectKey,
        totalScore: score.totalScore,
        breakdown: score.breakdown as unknown as BreakdownEntry[],
      });
    } else {
      const bias = await prisma.currentPairBias.findUnique({ where: { pair: subjectKey } });
      if (!bias) {
        return NextResponse.json({ error: `No pair bias computed yet for ${subjectKey}` }, { status: 404 });
      }
      const [baseScoreRow, quoteScoreRow] = await Promise.all([
        prisma.currentCurrencyScore.findUnique({ where: { currency: bias.baseCurrency } }),
        prisma.currentCurrencyScore.findUnique({ where: { currency: bias.quoteCurrency } }),
      ]);
      const confluence = await fetchConfluence(req.nextUrl.origin, subjectKey);

      inputHash = bias.inputHash;
      userMessage = buildPairExplainMessage({
        pair: subjectKey,
        baseCurrency: bias.baseCurrency,
        quoteCurrency: bias.quoteCurrency,
        baseScore: bias.baseScore,
        quoteScore: bias.quoteScore,
        differential: bias.differential,
        biasLabel: bias.biasLabel,
        baseBreakdown: (baseScoreRow?.breakdown as unknown as BreakdownEntry[]) ?? [],
        quoteBreakdown: (quoteScoreRow?.breakdown as unknown as BreakdownEntry[]) ?? [],
        confluence,
      });
    }

    // Cache hit: return the stored explanation unless the underlying score/
    // bias has changed since it was generated.
    const existing = await prisma.gavoMacroExplanation.findUnique({
      where: { subjectType_subjectKey: { subjectType, subjectKey } },
    });
    if (existing && existing.inputHash === inputHash) {
      return NextResponse.json({ explanation: existing.explanation, generatedAt: existing.generatedAt, cached: true });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: [{ type: "text", text: GAVO_MACRO_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userMessage }],
    });

    const explanation = message.content[0].type === "text" ? message.content[0].text : "";

    const saved = await prisma.gavoMacroExplanation.upsert({
      where: { subjectType_subjectKey: { subjectType, subjectKey } },
      create: { subjectType, subjectKey, explanation, model: "claude-sonnet-4-6", inputHash },
      update: { explanation, model: "claude-sonnet-4-6", inputHash, generatedAt: new Date() },
    });

    return NextResponse.json({ explanation: saved.explanation, generatedAt: saved.generatedAt, cached: false });
  } catch (err) {
    console.error("[macro/explain]", err);
    return NextResponse.json({ error: "Explanation failed" }, { status: 500 });
  }
}
