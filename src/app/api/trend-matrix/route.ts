import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { loadTrendMatrix, TREND_MATRIX_SINGLETON_ID } from "@/lib/trend-matrix";

const SINGLETON_ID = TREND_MATRIX_SINGLETON_ID;

// ── GET /api/trend-matrix — public, returns the shared instructor matrix ──────
// Query lives in lib/trend-matrix.ts so the dashboard's server prefetch and
// this route return an identical shape.

export async function GET() {
  try {
    return NextResponse.json(await loadTrendMatrix());
  } catch (err) {
    return handleApiError("trend-matrix", err);
  }
}

// ── POST /api/trend-matrix — instructor only, upserts the singleton ───────────

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

    const body = await req.json() as { matrix: unknown; notes: unknown };

    const row = await prisma.trendMatrix.upsert({
      where:  { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, matrix: body.matrix as object, notes: body.notes as object, updatedBy: dbUser.id },
      update: { matrix: body.matrix as object, notes: body.notes as object, updatedBy: dbUser.id },
    });

    return NextResponse.json({
      matrix:    row.matrix,
      notes:     row.notes,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (err) {
    return handleApiError("trend-matrix", err);
  }
}
