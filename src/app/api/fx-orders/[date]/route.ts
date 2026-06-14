import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FxOrderRecord } from "@/types/fx-orders";
import type { FxLevel } from "@/types/fx-orders";

export const revalidate = 1800;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;

  // Validate YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid date format, use YYYY-MM-DD" }, { status: 400 });
  }

  try {
    const expiryDate = new Date(`${date}T00:00:00.000Z`);

    const records = await prisma.fxOptionExpiry.findMany({
      where:   { expiryDate },
      orderBy: { pair: "asc" },
    });

    if (!records.length) {
      return NextResponse.json({ error: "No data for this date" }, { status: 404 });
    }

    const response: FxOrderRecord[] = records.map((r) => ({
      id:         r.id,
      expiryDate: r.expiryDate.toISOString().slice(0, 10),
      pair:       r.pair,
      spotPrice:  r.spotPrice,
      levels:     r.levels as unknown as FxLevel[],
      imageUrl:   r.imageUrl,
      fetchedAt:  r.fetchedAt.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (err) {
    console.error("[fx-orders/date]", err);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

// Also expose a "by pair" helper used by the journal integration
// GET /api/fx-orders/[date]?pair=EURUSD
export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  const pair = new URL(req.url).searchParams.get("pair");
  if (!pair || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new NextResponse(null, { status: 400 });
  }
  const expiryDate = new Date(`${date}T00:00:00.000Z`);
  const rec = await prisma.fxOptionExpiry.findUnique({ where: { expiryDate_pair: { expiryDate, pair } } });
  return new NextResponse(null, { status: rec ? 200 : 404 });
}
