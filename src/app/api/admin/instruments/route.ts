import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/admin-guard";

export async function GET() {
  await requireInstructor();
  const instruments = await prisma.instrument.findMany({ orderBy: { displayOrder: "asc" } });
  return NextResponse.json(instruments);
}

export async function POST(req: NextRequest) {
  await requireInstructor();
  const body = await req.json();
  const { symbol, label, category, pipSize, pipValue, tdSymbol, cotCode, cotInverted, fxoTracked, active } = body;
  if (!symbol || !label || !category) {
    return NextResponse.json({ error: "symbol, label, and category are required" }, { status: 400 });
  }
  const maxOrder = await prisma.instrument.aggregate({ _max: { displayOrder: true } });
  const instrument = await prisma.instrument.create({
    data: {
      symbol:       symbol.toUpperCase().trim(),
      label:        label.trim(),
      category,
      pipSize:      pipSize     ? Number(pipSize)     : 0.0001,
      pipValue:     pipValue    ? Number(pipValue)    : 10,
      tdSymbol:     tdSymbol    || null,
      cotCode:      cotCode     || null,
      cotInverted:  cotInverted ?? false,
      fxoTracked:   fxoTracked  ?? false,
      active:       active      ?? true,
      displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
    },
  });
  return NextResponse.json(instrument, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  await requireInstructor();
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Coerce numeric fields
  if (updates.pipSize  !== undefined) updates.pipSize  = Number(updates.pipSize);
  if (updates.pipValue !== undefined) updates.pipValue = Number(updates.pipValue);
  if (updates.displayOrder !== undefined) updates.displayOrder = Number(updates.displayOrder);

  const instrument = await prisma.instrument.update({ where: { id }, data: updates });
  return NextResponse.json(instrument);
}

export async function DELETE(req: NextRequest) {
  await requireInstructor();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.instrument.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
