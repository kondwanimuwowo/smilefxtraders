import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Alert } from "@prisma/client";

// ── Mapping helpers ──────────────────────────────────────────────────────────

const SESSION_TO_STORE: Record<string, string> = {
  LONDON: "London", NEW_YORK: "New York", ASIA: "Asia",
};
const SESSION_TO_DB: Record<string, "LONDON" | "NEW_YORK" | "ASIA"> = {
  London: "LONDON", "New York": "NEW_YORK", Asia: "ASIA",
};

type AlertStatusApp = "active" | "tp1" | "tp2" | "sl" | "cancelled" | "closed";

const STATUS_TO_APP: Record<string, AlertStatusApp> = {
  ACTIVE:    "active",
  TP1:       "tp1",
  TP2:       "tp2",
  SL:        "sl",
  CANCELLED: "cancelled",
  CLOSED:    "closed",
};
const STATUS_TO_DB: Record<string, "ACTIVE" | "TP1" | "TP2" | "SL" | "CANCELLED" | "CLOSED"> = {
  active:    "ACTIVE",
  tp1:       "TP1",
  tp2:       "TP2",
  sl:        "SL",
  cancelled: "CANCELLED",
  closed:    "CLOSED",
};

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 10)   return n.toFixed(2);
  return n.toFixed(4);
}

function dbToApi(a: Alert) {
  return {
    id:         a.id,
    pair:       a.pair,
    dir:        a.direction.toLowerCase() as "long" | "short",
    model:      a.model,
    session:    a.session ? SESSION_TO_STORE[a.session] : "London",
    rr:         a.rr,
    entry:      formatPrice(a.entryPrice),
    sl:         formatPrice(a.stopLoss),
    tp1:        formatPrice(a.tp1),
    tp2:        a.tp2 != null ? formatPrice(a.tp2) : undefined,
    tags:       a.tags,
    note:       a.note ?? "",
    status:     STATUS_TO_APP[a.status],
    timePosted: a.postedAt.toISOString(),
    authorId:   a.authorId,
    reactions:  a.reactions,
    taken:      a.taken,
  };
}

// ── GET /api/alerts ──────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Determine plan — FREE users see alerts with a 4-hour delay
  let isFreePlan = true;
  if (user) {
    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { plan: true, role: true } }).catch(() => null);
    if (dbUser && (dbUser.plan !== "FREE" || dbUser.role === "INSTRUCTOR")) {
      isFreePlan = false;
    }
  }

  const where = isFreePlan
    ? { postedAt: { lte: new Date(Date.now() - 4 * 60 * 60 * 1000) } }
    : undefined;

  const alerts = await prisma.alert.findMany({
    where,
    orderBy: { postedAt: "desc" },
  });
  return NextResponse.json(alerts.map(dbToApi));
}

// ── POST /api/alerts ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Forbidden — instructor only" }, { status: 403 });
  }

  const body = await req.json() as {
    pair: string; dir: string; model: string; session?: string;
    entry: number; sl: number; tp1: number; tp2?: number;
    rr: string; tags?: string[]; note?: string; title?: string;
  };

  const alert = await prisma.alert.create({
    data: {
      authorId:   dbUser.id,
      pair:       body.pair,
      direction:  body.dir === "short" ? "SHORT" : "LONG",
      model:      body.model,
      session:    body.session ? SESSION_TO_DB[body.session] ?? null : null,
      entryPrice: body.entry,
      stopLoss:   body.sl,
      tp1:        body.tp1,
      tp2:        body.tp2 ?? null,
      rr:         body.rr,
      tags:       body.tags ?? [],
      note:       body.note ?? null,
      title:      body.title ?? `${body.pair} ${body.dir.toUpperCase()}`,
      status:     "ACTIVE",
    },
  });

  return NextResponse.json(dbToApi(alert), { status: 201 });
}
