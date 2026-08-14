import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

// GET recent MacroEdge news — optionally filtered by ?currency=USD.
export async function GET(req: NextRequest) {
  try {
    const currency = req.nextUrl.searchParams.get("currency")?.toUpperCase();

    const items = await prisma.newsItem.findMany({
      where: currency ? { currency } : undefined,
      orderBy: { publishedAt: "desc" },
      take: 20,
    });

    return NextResponse.json(items);
  } catch (err) {
    return handleApiError("macro/news", err);
  }
}
