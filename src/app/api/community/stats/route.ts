import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 900; // 15 minutes

export async function GET() {
  const [members, tradesLogged, winCount] = await Promise.all([
    prisma.user.count(),
    prisma.trade.count(),
    prisma.trade.count({ where: { result: "WIN" } }),
  ]);

  const closedTrades = await prisma.trade.count({ where: { result: { in: ["WIN", "LOSS"] } } });
  const avgWinRate = closedTrades > 0 ? Math.round((winCount / closedTrades) * 100) : 0;

  return NextResponse.json({ members, tradesLogged, countries: 12, avgWinRate });
}
