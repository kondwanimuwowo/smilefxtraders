// Shared branded email chrome — inline-styled HTML (email clients ignore
// stylesheets). Palette mirrors the app theme: teal #08AEAA, coral #EA523D,
// gold #F8B93D, bg #0C1B27, cards #0D2030, borders #1A4A65.

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.smilefxtraders.com";

export interface EmailLayoutOptions {
  preheader?:  string; // hidden preview text shown by inbox clients
  eyebrow?:    string; // small uppercase label in the header card
  heading:     string;
  sub?:        string;
  bodyHtml:    string;
  cta?:        { label: string; href: string };
  footerNote?: string; // defaults to the settings-link note
}

export function emailLayout(opts: EmailLayoutOptions): string {
  const {
    preheader = "",
    eyebrow = "Smile FX Traders",
    heading,
    sub,
    bodyHtml,
    cta,
    footerNote = `You're receiving this because you're a member of Smile FX Traders. Manage emails in your <a href="${APP_URL}/settings" style="color:#08AEAA;">Settings</a>.`,
  } = opts;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#0C1B27;font-family:'Inter',system-ui,sans-serif;color:#D1E5F0;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>` : ""}
  <div style="max-width:560px;margin:32px auto;padding:0 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#082A3B,#0B425D);border-radius:16px;padding:28px 32px;margin-bottom:20px;border:1px solid #1A4A65;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#08AEAA;margin-bottom:8px;">
        ${eyebrow}
      </div>
      <h1 style="margin:0 0 4px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#F0F8FF;">
        ${heading}
      </h1>
      ${sub ? `<p style="margin:0;font-size:13px;color:#7EB8D4;">${sub}</p>` : ""}
    </div>

    ${bodyHtml}

    ${cta ? `
    <!-- CTA -->
    <div style="text-align:center;margin:28px 0;">
      <a href="${cta.href}" style="display:inline-block;background:linear-gradient(135deg,#08AEAA,#069E9A);color:#fff;font-weight:700;font-size:14px;padding:13px 28px;border-radius:12px;text-decoration:none;">
        ${cta.label}
      </a>
    </div>` : ""}

    <!-- Footer -->
    <p style="text-align:center;font-size:11.5px;color:#4A8FAA;margin-top:24px;">
      ${footerNote}
    </p>
  </div>
</body>
</html>`;
}

// ── Building blocks for bodyHtml ──────────────────────────────────────────────

export function statCard(label: string, value: string, color = "#D1E5F0"): string {
  return `
      <div style="background:#0D2030;border:1px solid #1A4A65;border-radius:12px;padding:16px 18px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#4A8FAA;margin-bottom:6px;">${label}</div>
        <div style="font-size:24px;font-weight:700;color:${color};font-variant-numeric:tabular-nums;">${value}</div>
      </div>`;
}

export function statGrid(cells: string[]): string {
  return `
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px;">
      ${cells.join("")}
    </div>`;
}

export function noteCard(title: string, html: string, accent = "#1A4A65", titleColor = "#4A8FAA"): string {
  return `
    <div style="background:#0D2030;border:1px solid ${accent};border-radius:12px;padding:18px 20px;margin-bottom:20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${titleColor};margin-bottom:6px;">${title}</div>
      <div style="font-size:15px;font-weight:600;color:#F0F8FF;">${html}</div>
    </div>`;
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.65;color:#D1E5F0;">${html}</p>`;
}

export const APP = APP_URL;
