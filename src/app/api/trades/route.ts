import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fmtDayMonth } from "@/lib/date";
import { Prisma } from "@prisma/client";
import type { Trade, AIReviewResult } from "@/lib/store";
import type { Trade as PrismaTrade } from "@prisma/client";

// ── Mapping helpers ──────────────────────────────────────────────────────────

const SESSION_TO_STORE: Record<string, string> = {
  LONDON: "London", NEW_YORK: "New York", ASIA: "Asia",
};
const SESSION_TO_DB: Record<string, "LONDON" | "NEW_YORK" | "ASIA"> = {
  London: "LONDON", "New York": "NEW_YORK", Asia: "ASIA",
};

function dbToStore(db: PrismaTrade): Trade {
  return {
    id:          db.id,
    date:        fmtDayMonth(db.date),
    openedAt:    db.date.toISOString(),
    closedAt:    db.closedAt?.toISOString() ?? undefined,
    pair:        db.pair,
    dir:         db.direction.toLowerCase() as "long" | "short",
    model:       db.model,
    framework:   db.framework,
    session:     db.session ? SESSION_TO_STORE[db.session] : undefined,
    entryPrice:  db.entryPrice ?? undefined,
    stopLoss:    db.stopLoss ?? undefined,
    takeProfit:  db.takeProfit ?? undefined,
    closePrice:  db.closePrice ?? undefined,
    rr:          db.rr ?? undefined,
    pnlR:        db.pnlR,
    riskPct:     db.riskPct,
    result:      db.result.toLowerCase() as "win" | "loss" | "open",
    rating:      db.rating,
    discipline:  db.discipline,
    tags:        db.tags,
    mistake:     db.mistake ?? undefined,
    note:        db.note ?? undefined,
    chartUrl:    db.chartUrl ?? undefined,
    fromAlert:   db.fromAlert ?? undefined,
    aiReview:    db.aiReview ? (db.aiReview as unknown as AIReviewResult) : null,
  };
}

// ── GET /api/trades ──────────────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return NextResponse.json([], { status: 200 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);
  if (!dbUser) return NextResponse.json([], { status: 200 });

  const trades = await prisma.trade.findMany({
    where: { userId: dbUser.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(trades.map(dbToStore));
}

// ── POST /api/trades ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } }).catch(() => null);
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // FREE plan: cap at 20 trades
  if (dbUser.plan === "FREE") {
    const count = await prisma.trade.count({ where: { userId: dbUser.id } });
    if (count >= 20) {
      return NextResponse.json(
        { error: "Free plan is limited to 20 trades. Upgrade to Pro for unlimited journaling.", upgrade: true },
        { status: 403 }
      );
    }
  }

  const body = await req.json() as Partial<Trade>;

  const trade = await prisma.trade.create({
    data: {
      userId:     dbUser.id,
      date:       body.openedAt ? new Date(body.openedAt) : new Date(),
      pair:       body.pair ?? "EURUSD",
      direction:  body.dir === "short" ? "SHORT" : "LONG",
      model:      body.model ?? "",
      framework:  body.framework ?? "SMC",
      session:    body.session ? (SESSION_TO_DB[body.session] ?? null) : null,
      entryPrice: body.entryPrice ?? null,
      stopLoss:   body.stopLoss ?? null,
      takeProfit: body.takeProfit ?? null,
      closePrice: body.closePrice ?? null,
      rr:         body.rr ?? null,
      pnlR:       body.pnlR ?? 0,
      riskPct:    body.riskPct ?? 0.5,
      closedAt:   body.closedAt ? new Date(body.closedAt) : null,
      result:     body.result === "win" ? "WIN" : body.result === "loss" ? "LOSS" : "OPEN",
      rating:     body.rating ?? 3,
      discipline: body.discipline ?? true,
      tags:       body.tags ?? [],
      mistake:    body.mistake ?? null,
      note:       body.note ?? null,
      chartUrl:   body.chartUrl ?? null,
      fromAlert:  body.fromAlert ?? null,
      aiReview:   body.aiReview ? (body.aiReview as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });

  return NextResponse.json(dbToStore(trade), { status: 201 });
}
