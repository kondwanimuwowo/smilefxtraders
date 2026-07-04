import { emailShell, para, tradeCard, APP } from "../layout";

export function instructorAlertEmail(p: {
  pair:       string;
  direction:  string; // "LONG" | "SHORT"
  title:      string;
  model:      string;
  entryPrice: number;
  stopLoss:   number;
  tp1:        number;
  rr:         string;
}): { subject: string; html: string } {
  const isLong     = p.direction === "LONG";
  const accentColor = isLong ? "#08AEAA" : "#EA523D";
  // LONG badge: teal bg, dark text. SHORT badge: coral bg, white text.
  const badgeBg    = isLong ? "#08AEAA" : "#EA523D";
  const badgeText  = isLong ? "#06222C" : "#FFFFFF";
  const modelColor = isLong ? "#30E8DF" : "#FF7A6A";

  const bodyHtml = [
    para(`Kondwani just posted a new trade alert:`),
    tradeCard({
      pair:       p.pair,
      direction:  p.direction,
      badgeBg,
      badgeText,
      title:      p.title,
      model:      p.model,
      modelColor,
      entry:      String(p.entryPrice),
      sl:         String(p.stopLoss),
      tp1:        String(p.tp1),
      rr:         p.rr,
    }),
    para(`Full context, tags, and any updates are in the Alerts feed. Manage your risk — never take a setup you haven't validated yourself.`),
  ].join("");

  return {
    subject: `New alert: ${p.pair} ${p.direction} — from Kondwani`,
    html: emailShell({
      preheader:   `${p.title} — ${p.model} · ${p.rr}`,
      accentColor,
      eyebrow:     "New trade alert",
      heading:     `${p.pair} ${p.direction}`,
      sub:         p.title,
      bodyHtml,
      ctaLabel:    "View alert →",
      ctaHref:     `${APP}/alerts`,
      ctaColor:    accentColor,
      footerNote:  `You're receiving alert emails because they're enabled in your <a href="${APP}/settings" style="color:#1B807B;">Settings</a>.`,
    }),
  };
}
