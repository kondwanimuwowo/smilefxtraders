import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { fanOutInstructorAlert } from "@/lib/notify-events";
import { handleApiError, readJsonBody, requireString } from "@/lib/api-error";
import { dbToApi, loadInstructorAlerts } from "@/lib/alerts";

// ── Mapping helpers ──────────────────────────────────────────────────────────
// The DB→app direction (dbToApi and friends) moved to lib/alerts.ts so the
// page's server prefetch and this route share one implementation. Only the
// app→DB direction, used by POST below, remains here.

const SESSION_TO_DB: Record<string, "LONDON" | "NEW_YORK" | "ASIA"> = {
  London: "LONDON", "New York": "NEW_YORK", Asia: "ASIA",
};

// ── GET /api/alerts ──────────────────────────────────────────────────────────

export async function GET() {
  try {
    return NextResponse.json(await loadInstructorAlerts());
  } catch (err) {
    // This exact query produced the only production exception in the 24h
    // before the 2026-08-14 audit (Prisma performIO failure on GET
    // /api/alerts) — it went out as a bare 500 because nothing caught it.
    return handleApiError("alerts:GET", err);
  }
}

// ── POST /api/alerts ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (dbUser.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden: instructor only" }, { status: 403 });
    }

    const body = await readJsonBody<{
      pair: string; dir: string; model: string; session?: string;
      entry: number; sl: number; tp1: number; tp2?: number;
      rr: string; tags?: string[]; note?: string; title?: string;
    }>(req);

    // `dir` was interpolated straight into the title via .toUpperCase() —
    // a missing field crashed the handler instead of returning a 400.
    const pair = requireString(body.pair, "pair");
    const dir  = requireString(body.dir, "dir");

    const alert = await prisma.alert.create({
      data: {
        authorId:   dbUser.id,
        pair,
        direction:  dir === "short" ? "SHORT" : "LONG",
        model:      requireString(body.model, "model"),
        session:    body.session ? SESSION_TO_DB[body.session] ?? null : null,
        entryPrice: body.entry,
        stopLoss:   body.sl,
        tp1:        body.tp1,
        tp2:        body.tp2 ?? null,
        rr:         body.rr,
        tags:       body.tags ?? [],
        note:       body.note ?? null,
        title:      body.title ?? `${pair} ${dir.toUpperCase()}`,
        status:     "ACTIVE",
      },
    });

    // Fan out in-app notifications + emails — don't block the 201
    void fanOutInstructorAlert(alert).catch((e) =>
      console.error("[alerts] fan-out failed:", e instanceof Error ? e.message : e)
    );

    return NextResponse.json(dbToApi(alert), { status: 201 });
  } catch (err) {
    return handleApiError("alerts:POST", err);
  }
}
