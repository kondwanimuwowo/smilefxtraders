import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { Trade, AIReviewResult } from "@/lib/store";

const SESSION_TO_STORE: Record<string, string> = {
  LONDON: "London", NEW_YORK: "New York", ASIA: "Asia",
};

function dbToStore(db: Awaited<ReturnType<typeof prisma.trade.update>>): Trade {
  return {
    id:          db.id,
    date:        db.date.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
    openedAt:    db.date.toISOString(),
    closedAt:    db.closedAt?.toISOString() ?? undefined,
    pair:        db.pair,
    dir:         db.direction.toLowerCase() as "long" | "short",
    model:       db.model,
    framework:   db.framework,
    session:     db.session ? SESSION_TO_STORE[db.session] : undefined,
    entryPrice:  db.entryPrice ?? undefined,
    stopLoss:    db.stopLoss   ?? undefined,
    takeProfit:  db.takeProfit ?? undefined,
    closePrice:  db.closePrice ?? undefined,
    rr:          db.rr        ?? undefined,
    pnlR:        db.pnlR,
    riskPct:     db.riskPct,
    result:      db.result.toLowerCase() as "win" | "loss" | "open",
    rating:      db.rating,
    discipline:  db.discipline,
    tags:        db.tags,
    mistake:     db.mistake  ?? undefined,
    note:        db.note     ?? undefined,
    chartUrl:    db.chartUrl ?? undefined,
    fromAlert:   db.fromAlert ?? undefined,
    aiReview:    db.aiReview ? (db.aiReview as unknown as AIReviewResult) : null,
  };
}

const SESSION_TO_DB: Record<string, "LONDON" | "NEW_YORK" | "ASIA"> = {
  London: "LONDON", "New York": "NEW_YORK", Asia: "ASIA",
};

type Params = { params: Promise<{ id: string }> };

// ── PATCH /api/trades/[id] ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id } = await params;
    const existing = await prisma.trade.findFirst({ where: { id, userId: dbUser.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json() as Partial<Trade>;

    const updated = await prisma.trade.update({
      where: { id },
      data: {
        ...(body.openedAt   !== undefined && { date:       new Date(body.openedAt) }),
        ...(body.closedAt   !== undefined && { closedAt:   body.closedAt ? new Date(body.closedAt) : null }),
        ...(body.pair       !== undefined && { pair:       body.pair }),
        ...(body.dir        !== undefined && { direction:  body.dir === "short" ? "SHORT" : "LONG" }),
        ...(body.model      !== undefined && { model:      body.model }),
        ...(body.framework  !== undefined && { framework:  body.framework }),
        ...(body.session    !== undefined && { session:    SESSION_TO_DB[body.session] ?? null }),
        ...(body.entryPrice !== undefined && { entryPrice: body.entryPrice }),
        ...(body.stopLoss   !== undefined && { stopLoss:   body.stopLoss }),
        ...(body.takeProfit !== undefined && { takeProfit: body.takeProfit }),
        ...(body.closePrice !== undefined && { closePrice: body.closePrice }),
        ...(body.rr         !== undefined && { rr:         body.rr }),
        ...(body.pnlR       !== undefined && { pnlR:       body.pnlR }),
        ...(body.riskPct    !== undefined && { riskPct:    body.riskPct }),
        ...(body.result     !== undefined && { result:     body.result === "win" ? "WIN" : body.result === "loss" ? "LOSS" : "OPEN" }),
        ...(body.rating     !== undefined && { rating:     body.rating }),
        ...(body.discipline !== undefined && { discipline: body.discipline }),
        ...(body.tags       !== undefined && { tags:       body.tags }),
        ...(body.mistake    !== undefined && { mistake:    body.mistake }),
        ...(body.note       !== undefined && { note:       body.note }),
        ...(body.chartUrl   !== undefined && { chartUrl:   body.chartUrl }),
        ...(body.aiReview   !== undefined && { aiReview:   body.aiReview ? (body.aiReview as unknown as Prisma.InputJsonValue) : Prisma.JsonNull }),
      },
    });

    return NextResponse.json(dbToStore(updated));
  } catch (err) {
    console.error("[PATCH /api/trades/[id]]", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── DELETE /api/trades/[id] ──────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { id } = await params;
  const existing = await prisma.trade.findFirst({ where: { id, userId: dbUser.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.trade.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
