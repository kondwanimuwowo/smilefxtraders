import { emailShell, para, statGrid4, winLossBar, infoCard, APP } from "../layout";

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
  const netRColor  = isPositive ? "#1B807B" : "#EA523D";
  const settingsUrl = p.dashboardUrl.replace("/dashboard", "/settings");

  const bodyHtml = [
    para(`Hey ${p.name.split(" ")[0]}, here's your journal summary for the week:`),
    statGrid4([
      { label: "Trades",   value: String(p.trades) },
      { label: "Win rate", value: `${p.winRate}%` },
      { label: "Net",      value: (isPositive ? "+" : "") + p.netR, valueColor: netRColor },
      { label: "Streak",   value: `${p.streak} 🔥` },
    ]),
    winLossBar(p.wins, p.losses, p.trades),
    p.bestModel ? infoCard("Best model this week", p.bestModel) : "",
    para(`Keep the streak alive — review this week's trades and tag what worked.`),
    `<div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>`,
  ].join("");

  return {
    subject: `Your week in trading — ${p.wins}W ${p.losses}L ${isPositive ? "+" : ""}${p.netR}`,
    html: emailShell({
      preheader:  `${p.trades} trades, ${p.winRate}% win rate, ${isPositive ? "+" : ""}${p.netR} this week.`,
      eyebrow:    "Weekly report",
      heading:    "Your week in the journal",
      sub:        "Here's how your trading week went.",
      bodyHtml,
      ctaLabel:   "View full journal →",
      ctaHref:    p.dashboardUrl,
      footerNote: `You're receiving this because you have weekly reports enabled in your <a href="${settingsUrl}" style="color:#1B807B;">Settings</a>.`,
    }),
  };
}
