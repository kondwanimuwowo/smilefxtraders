import { emailLayout, statCard, statGrid, noteCard } from "../layout";

export interface WeeklyReportParams {
  name:         string;
  trades:       number;
  wins:         number;
  losses:       number;
  winRate:      number;
  netR:         string; // e.g. "3.5R" or "-1.0R"
  streak:       number;
  bestModel:    string | null;
  dashboardUrl: string;
}

export function weeklyReportEmail(p: WeeklyReportParams): { subject: string; html: string } {
  const isPositive = !p.netR.startsWith("-");
  const netRColor  = isPositive ? "#08AEAA" : "#EA523D";

  const bodyHtml = `
    ${statGrid([
      statCard("Trades",   String(p.trades)),
      statCard("Win rate", `${p.winRate}%`, p.winRate >= 50 ? "#08AEAA" : "#EA523D"),
      statCard("Net R",    (isPositive ? "+" : "") + p.netR, netRColor),
      statCard("Streak",   `${p.streak} 🔥`, "#F8B93D"),
    ])}

    <!-- Win / loss bar -->
    <div style="background:#0D2030;border:1px solid #1A4A65;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:#7EB8D4;margin-bottom:10px;">
        <span>${p.wins} wins</span>
        <span>${p.losses} losses</span>
      </div>
      <div style="height:8px;border-radius:4px;background:#1A4A65;overflow:hidden;">
        <div style="height:100%;width:${p.trades > 0 ? Math.round((p.wins / p.trades) * 100) : 0}%;background:#08AEAA;border-radius:4px;"></div>
      </div>
    </div>

    ${p.bestModel ? noteCard("Best model this week", p.bestModel, "rgba(248,185,61,0.2)", "#F8B93D") : ""}`;

  return {
    subject: `Your week in trading — ${p.wins}W ${p.losses}L ${isPositive ? "+" : ""}${p.netR}`,
    html: emailLayout({
      heading:    `Your weekly report, ${p.name.split(" ")[0]}`,
      sub:        "Here's how your trading looked this week.",
      bodyHtml,
      cta:        { label: "View full journal →", href: p.dashboardUrl },
      footerNote: `You're receiving this because you have weekly reports enabled in your <a href="${p.dashboardUrl.replace("/dashboard", "/settings")}" style="color:#08AEAA;">Settings</a>.`,
    }),
  };
}
