import { emailLayout, paragraph, noteCard, APP } from "../layout";

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
  const isLong = p.direction === "LONG";
  const dirColor = isLong ? "#08AEAA" : "#EA523D";

  const bodyHtml = `
    ${paragraph(`Kondwani just posted a new trade alert:`)}
    ${noteCard(`${p.pair} · <span style="color:${dirColor};">${p.direction}</span>`, `
      <div style="font-size:13px;font-weight:400;color:#D1E5F0;line-height:2;">
        <strong style="color:#F0F8FF;">${p.title}</strong><br/>
        Model — ${p.model}<br/>
        <span style="font-family:ui-monospace,monospace;font-variant-numeric:tabular-nums;">
          Entry ${p.entryPrice} · SL ${p.stopLoss} · TP1 ${p.tp1} · ${p.rr}
        </span>
      </div>`, isLong ? "rgba(8,174,170,0.25)" : "rgba(234,82,61,0.25)", dirColor)}
    ${paragraph(`Full context, tags, and any updates are in the Alerts feed. Manage your risk — never take a setup you haven't validated yourself.`)}`;

  return {
    subject: `New alert: ${p.pair} ${p.direction} — from Kondwani`,
    html: emailLayout({
      preheader: `${p.pair} ${p.direction} · ${p.model} · ${p.rr}`,
      eyebrow:   "New trade alert",
      heading:   `${p.pair} ${p.direction}`,
      sub:       p.title,
      bodyHtml,
      cta:       { label: "View alert →", href: `${APP}/alerts` },
      footerNote: `You're receiving alert emails because they're enabled in your <a href="${APP}/settings" style="color:#08AEAA;">Settings</a>.`,
    }),
  };
}
