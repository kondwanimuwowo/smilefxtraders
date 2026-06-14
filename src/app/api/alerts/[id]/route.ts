import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const STATUS_TO_DB: Record<string, "ACTIVE" | "TP1" | "TP2" | "SL" | "CANCELLED" | "CLOSED"> = {
  active:    "ACTIVE",
  tp1:       "TP1",
  tp2:       "TP2",
  sl:        "SL",
  cancelled: "CANCELLED",
  closed:    "CLOSED",
};

const SESSION_TO_STORE: Record<string, string> = {
  LONDON: "London", NEW_YORK: "New York", ASIA: "Asia",
};

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 10)   return n.toFixed(2);
  return n.toFixed(4);
}

const STATUS_TO_APP: Record<string, string> = {
  ACTIVE: "active", TP1: "tp1", TP2: "tp2", SL: "sl", CANCELLED: "cancelled", CLOSED: "closed",
};

// ── PATCH /api/alerts/[id] ───────────────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Forbidden — instructor only" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json() as { status?: string; result?: string };

  const dbStatus = body.status ? STATUS_TO_DB[body.status] : undefined;
  if (body.status && !dbStatus) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await prisma.alert.update({
    where: { id },
    data: {
      ...(dbStatus    !== undefined && { status: dbStatus }),
      ...(body.result !== undefined && { result: body.result }),
    },
  });

  return NextResponse.json({
    id:         updated.id,
    pair:       updated.pair,
    dir:        updated.direction.toLowerCase(),
    model:      updated.model,
    session:    updated.session ? SESSION_TO_STORE[updated.session] : "London",
    rr:         updated.rr,
    entry:      formatPrice(updated.entryPrice),
    sl:         formatPrice(updated.stopLoss),
    tp1:        formatPrice(updated.tp1),
    tp2:        updated.tp2 != null ? formatPrice(updated.tp2) : undefined,
    tags:       updated.tags,
    note:       updated.note ?? "",
    status:     STATUS_TO_APP[updated.status],
    timePosted: updated.postedAt.toISOString(),
  });
}

// ── DELETE /api/alerts/[id] ──────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (dbUser.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Forbidden — instructor only" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.alert.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
