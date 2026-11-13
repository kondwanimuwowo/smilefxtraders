import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { loadTrendMatrix, TREND_MATRIX_SINGLETON_ID } from "@/lib/trend-matrix";
import { OVERRIDE_TTL_MS, TREND_TFS, type TrendBias, type TrendTf } from "@/lib/trend/structure";

// ── GET /api/trend-matrix — public, the merged auto + instructor matrix ───────
// Query lives in lib/trend-matrix.ts so the dashboard's server prefetch and
// this route return an identical shape.

export async function GET() {
  try {
    return NextResponse.json(await loadTrendMatrix());
  } catch (err) {
    return handleApiError("trend-matrix", err);
  }
}

// ── POST /api/trend-matrix — instructor only ──────────────────────────────────
// Body: { overrides?: { pair, tf, bias: TrendBias | null }[], notes?: Record<pair, string> }
// A null bias clears that cell's override, handing it back to the auto read.

const BIASES: readonly TrendBias[] = ["bullish", "bearish", "ranging"];

interface OverrideInput { pair: string; tf: TrendTf; bias: TrendBias | null }

function parseOverrides(raw: unknown): OverrideInput[] | null {
  if (raw === undefined) return [];
  if (!Array.isArray(raw)) return null;
  const out: OverrideInput[] = [];
  for (const item of raw) {
    const { pair, tf, bias } = (item ?? {}) as Record<string, unknown>;
    if (typeof pair !== "string" || !/^[A-Z0-9]{3,10}$/.test(pair)) return null;
    if (!TREND_TFS.includes(tf as TrendTf)) return null;
    if (bias !== null && !BIASES.includes(bias as TrendBias)) return null;
    out.push({ pair, tf: tf as TrendTf, bias: bias as TrendBias | null });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
      where:  { supabaseId: user.id },
      select: { id: true, role: true },
    });
    if (!dbUser || dbUser.role !== "INSTRUCTOR") {
      return NextResponse.json({ error: "Forbidden: instructor only" }, { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { overrides?: unknown; notes?: unknown };
    const overrides = parseOverrides(body.overrides);
    if (!overrides) return NextResponse.json({ error: "Invalid overrides" }, { status: 400 });
    const notes = body.notes;
    if (notes !== undefined && (typeof notes !== "object" || notes === null || Array.isArray(notes))) {
      return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
    }

    const expiresAt = new Date(Date.now() + OVERRIDE_TTL_MS);
    await prisma.$transaction([
      ...overrides.map(({ pair, tf, bias }) =>
        bias === null
          ? prisma.trendOverride.deleteMany({ where: { pair, tf } })
          : prisma.trendOverride.upsert({
              where:  { pair_tf: { pair, tf } },
              create: { pair, tf, bias, setBy: dbUser.id, expiresAt },
              update: { bias, setBy: dbUser.id, setAt: new Date(), expiresAt },
            }),
      ),
      ...(notes === undefined ? [] : [
        prisma.trendMatrix.upsert({
          where:  { id: TREND_MATRIX_SINGLETON_ID },
          create: { id: TREND_MATRIX_SINGLETON_ID, matrix: {}, notes: notes as object, updatedBy: dbUser.id },
          update: { notes: notes as object, updatedBy: dbUser.id },
        }),
      ]),
    ]);

    return NextResponse.json(await loadTrendMatrix());
  } catch (err) {
    return handleApiError("trend-matrix", err);
  }
}
