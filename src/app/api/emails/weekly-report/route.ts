/**
 * POST /api/emails/weekly-report
 *
 * Sends weekly performance summary emails to all eligible users.
 * Protected by CRON_SECRET — call from a weekly cron job (Sunday 08:00 UTC).
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { subDays } from "@/lib/date";
import { sendEmail } from "@/lib/email/send";
import { weeklyReportEmail } from "@/lib/email/templates/weekly-report";

export async function POST(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.smilefxtraders.com";
  const weekStart = subDays(new Date(), 7);

  // Fetch all Pro/Funded users with weeklyReport enabled
  const users = await prisma.user.findMany({
    where: {
      plan:      { in: ["PRO", "FUNDED"] },
      notifPrefs: { path: ["weeklyReport"], equals: true },
    },
    select: {
      id:         true,
      name:       true,
      email:      true,
      streak:     true,
      notifPrefs: true,
    },
  });

  const results: { email: string; status: string }[] = [];

  for (const u of users) {
    try {
      const trades = await prisma.trade.findMany({
        where:  { userId: u.id, date: { gte: weekStart } },
        select: { result: true, pnlR: true, model: true },
      });

      if (trades.length === 0) continue; // no trades this week — skip

      const wins    = trades.filter((t) => t.result === "WIN").length;
      const losses  = trades.filter((t) => t.result === "LOSS").length;
      const netR    = trades.reduce((s, t) => s + (t.pnlR ?? 0), 0);
      const winRate = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;

      // Best model by win rate (minimum 2 trades)
      const modelMap = new Map<string, { wins: number; total: number }>();
      for (const t of trades) {
        if (!t.model) continue;
        const m = modelMap.get(t.model) ?? { wins: 0, total: 0 };
        m.total++;
        if (t.result === "WIN") m.wins++;
        modelMap.set(t.model, m);
      }
      const bestModel = [...modelMap.entries()]
        .filter(([, m]) => m.total >= 2)
        .sort(([, a], [, b]) => (b.wins / b.total) - (a.wins / a.total))[0]?.[0] ?? null;

      const { subject, html } = weeklyReportEmail({
        name:         u.name,
        trades:       trades.length,
        wins,
        losses,
        winRate,
        netR:         netR.toFixed(1) + "R",
        streak:       u.streak,
        bestModel,
        dashboardUrl: `${appUrl}/dashboard`,
      });

      const ok = await sendEmail({ from: "hello", to: u.email, subject, html });
      results.push({ email: u.email, status: ok ? "sent" : "error: send failed" });
    } catch (e) {
      results.push({ email: u.email, status: `error: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  return NextResponse.json({ sent: results.filter((r) => r.status === "sent").length, total: users.length, results });
}
