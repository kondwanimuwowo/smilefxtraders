import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 900;

function seedFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

interface LeaderEntry {
  name:       string;
  handle:     string;
  avatarSeed: number;
  avatarUrl:  string | null;
  winRate:    number;
  netR:       string;
}

export async function GET() {
  const now        = new Date();
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthEnd   = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);

  const trades = await prisma.trade.findMany({
    where: {
      result:   { in: ["WIN", "LOSS"] },
      closedAt: { gte: monthStart, lt: monthEnd },
    },
    select: {
      userId: true,
      result: true,
      pnlR:   true,
      user:   { select: { id: true, name: true, username: true, avatarUrl: true } },
    },
  });

  const byUser = new Map<string, {
    name: string; handle: string; avatarSeed: number; avatarUrl: string | null;
    wins: number; total: number; netR: number;
  }>();

  for (const t of trades) {
    if (!byUser.has(t.userId)) {
      byUser.set(t.userId, {
        name:       t.user.name,
        handle:     t.user.username,
        avatarSeed: seedFromId(t.user.id),
        avatarUrl:  t.user.avatarUrl,
        wins:       0,
        total:      0,
        netR:       0,
      });
    }
    const entry = byUser.get(t.userId)!;
    entry.total++;
    if (t.result === "WIN") entry.wins++;
    entry.netR += t.pnlR ?? 0;
  }

  const leaders: LeaderEntry[] = [...byUser.values()]
    .filter((u) => u.total >= 3)
    .sort((a, b) => b.netR - a.netR)
    .slice(0, 10)
    .map((u) => ({
      name:       u.name,
      handle:     u.handle,
      avatarSeed: u.avatarSeed,
      avatarUrl:  u.avatarUrl,
      winRate:    Math.round((u.wins / u.total) * 100),
      netR:       (u.netR >= 0 ? "+" : "") + u.netR.toFixed(1) + "R",
    }));

  return NextResponse.json(leaders);
}
