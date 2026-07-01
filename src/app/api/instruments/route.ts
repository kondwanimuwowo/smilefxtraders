import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600;

export async function GET() {
  const instruments = await prisma.instrument.findMany({
    where:   { active: true },
    orderBy: { displayOrder: "asc" },
  });
  return NextResponse.json(instruments);
}
