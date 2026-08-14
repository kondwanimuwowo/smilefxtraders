import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

export const revalidate = 3600;

export async function GET() {
  try {
    const instruments = await prisma.instrument.findMany({
      where:   { active: true },
      orderBy: { displayOrder: "asc" },
    });
    return NextResponse.json(instruments);
  } catch (err) {
    return handleApiError("instruments", err);
  }
}
