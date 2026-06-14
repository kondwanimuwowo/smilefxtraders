/**
 * POST /api/emails/weekly-report
 *
 * Sends weekly performance summary emails to all eligible users.
 * Protected by CRON_SECRET — call from a weekly cron job (Sunday 08:00 UTC).
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const FROM = "Smile FX Traders <noreply@smilefxtraders.com>";

interface NotifPrefs {
  weeklyReport?: boolean;
  emailAlerts?:  boolean;
}

function weeklyReportHtml(params: {
  name:         string;
  trades:       number;
  wins:         number;
  losses:       number;
  winRate:      number;
  netR:         string;
  streak:       number;
  bestModel:    string | null;
  dashboardUrl: string;
}) {
  const { name, trades, wins, losses, winRate, netR, streak, bestModel, dashboardUrl } = params;
  const isPositive = !netR.startsWith("-");
  const netRColor  = isPositive ? "#08AEAA" : "#EA523D";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Weekly Performance Report</title>
</head>
<body style="margin:0;padding:0;background:#0C1B27;font-family:'Inter',system-ui,sans-serif;color:#D1E5F0;">
  <div style="max-width:560px;margin:32px auto;padding:0 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#082A3B,#0B425D);border-radius:16px;padding:28px 32px;margin-bottom:20px;border:1px solid #1A4A65;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#08AEAA;margin-bottom:8px;">
        Smile FX Traders
      </div>
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#F0F8FF;">
        Your weekly report, ${name.split(" ")[0]}
      </h1>
      <p style="margin:0;font-size:13px;color:#7EB8D4;">
        Here's how your trading looked this week.
      </p>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
      ${[
        { label: "Trades",   value: String(trades),             color: "#D1E5F0" },
        { label: "Win rate", value: `${winRate}%`,              color: winRate >= 50 ? "#08AEAA" : "#EA523D" },
        { label: "Net R",    value: (isPositive ? "+" : "") + netR, color: netRColor },
        { label: "Streak",   value: `${streak} 🔥`,             color: "#F8B93D" },
      ].map((s) => `
      <div style="background:#0D2030;border:1px solid #1A4A65;border-radius:12px;padding:16px 18px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#4A8FAA;margin-bottom:6px;">${s.label}</div>
        <div style="font-size:24px;font-weight:700;color:${s.color};font-variant-numeric:tabular-nums;">${s.value}</div>
      </div>`).join("")}
    </div>

    <!-- Win / loss bar -->
    <div style="background:#0D2030;border:1px solid #1A4A65;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#7EB8D4;margin-bottom:10px;">
        <span>${wins} wins</span>
        <span>${losses} losses</span>
      </div>
      <div style="height:8px;border-radius:4px;background:#1A4A65;overflow:hidden;">
        <div style="height:100%;width:${trades > 0 ? Math.round((wins / trades) * 100) : 0}%;background:#08AEAA;border-radius:4px;"></div>
      </div>
    </div>

    <!-- Best model -->
    ${bestModel ? `
    <div style="background:#0D2030;border:1px solid rgba(248,185,61,0.2);border-radius:12px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#F8B93D;margin-bottom:6px;">Best model this week</div>
      <div style="font-size:15px;font-weight:600;color:#F0F8FF;">${bestModel}</div>
    </div>` : ""}

    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#08AEAA,#069E9A);color:#fff;font-weight:700;font-size:14px;padding:13px 28px;border-radius:12px;text-decoration:none;">
        View full journal →
      </a>
    </div>

    <!-- Footer -->
    <p style="text-align:center;font-size:11.5px;color:#4A8FAA;margin-top:24px;">
      You're receiving this because you have weekly reports enabled in your
      <a href="${dashboardUrl.replace("/dashboard", "/settings")}" style="color:#08AEAA;">Settings</a>.
    </p>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resend  = new Resend(process.env.RESEND_API_KEY);
  const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? "https://smilefxtraders.com";
  const weekStart  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

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

      const html = weeklyReportHtml({
        name:         u.name,
        trades:       trades.length,
        wins,
        losses,
        winRate,
        netR:         (netR >= 0 ? "" : "") + netR.toFixed(1) + "R",
        streak:       u.streak,
        bestModel,
        dashboardUrl: `${appUrl}/dashboard`,
      });

      const { error } = await resend.emails.send({
        from:    FROM,
        to:      u.email,
        subject: `Your week in trading — ${wins}W ${losses}L ${netR >= 0 ? "+" : ""}${netR.toFixed(1)}R`,
        html,
      });

      results.push({ email: u.email, status: error ? `error: ${error.message}` : "sent" });
    } catch (e) {
      results.push({ email: u.email, status: `error: ${e instanceof Error ? e.message : String(e)}` });
    }
  }

  return NextResponse.json({ sent: results.filter((r) => r.status === "sent").length, total: users.length, results });
}
