// Light-themed email chrome matching the Smile FX Traders brand design.
// All styles are inline — email clients ignore external stylesheets.
// Palette: white card on #F4F4F4 bg, teal #08AEAA, coral #EA523D, gold #F8B93D.

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.smilefxtraders.com";
const LOGO_URL = `${APP_URL}/smile-logo-dark.png`;

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');`;

// ── Shell ─────────────────────────────────────────────────────────────────────

export interface EmailShellOptions {
  preheader?:    string;
  accentColor?:  string; // top bar colour; default teal
  eyebrow?:      string;
  eyebrowColor?: string; // if different from accentColor
  heading:       string;
  sub?:          string;
  bodyHtml:      string;
  ctaLabel?:     string;
  ctaHref?:      string;
  ctaColor?:     string; // CTA button bg; default teal
  footerNote?:   string; // '' = no note shown
}

export function emailShell(opts: EmailShellOptions): string {
  const {
    preheader   = "",
    accentColor = "#08AEAA",
    eyebrow,
    eyebrowColor,
    heading,
    sub,
    bodyHtml,
    ctaLabel,
    ctaHref,
    ctaColor    = "#08AEAA",
    footerNote,
  } = opts;

  const eyeColor = eyebrowColor ?? accentColor;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>${heading}</title>
<style>
${FONT_IMPORT}
body,table,td{margin:0;padding:0;}
img{border:0;line-height:100%;}
@media only screen and (max-width:620px){
  .container{width:100%!important;}
  .inner{padding:28px 22px 32px!important;}
  /* Stack the 4-col stat/trade-detail tables (statGrid4, tradeCard) instead of
     squeezing 4 columns into ~85px each on a phone. Kept as classes (not
     td[width] attribute selectors) since some webmail clients strip
     attribute selectors from <style> blocks. NOTE: this same rule must be
     mirrored by hand into supabase/email-templates/*.html — those are
     static files pasted into the Supabase dashboard, not generated from
     this shared shell, so there's no build step keeping them in sync. */
  .sg-cell{display:block!important;width:100%!important;padding:0 0 8px!important;}
  .tc-cell{display:block!important;width:100%!important;padding:8px 0 0!important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:#F4F4F4;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4F4F4;">
<tr><td align="center" style="padding:36px 16px 30px;">
<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;">

  <!-- Logo row -->
  <tr><td style="padding:0 6px 18px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle"><img src="${LOGO_URL}" width="36" height="36" alt="Smile FX Traders" style="display:block;border-radius:9px;"></td>
      <td valign="middle" style="padding-left:11px;font-family:'Space Grotesk',Arial,sans-serif;font-size:17px;font-weight:700;color:#082A3B;">Smile FX <span style="color:#08AEAA;">Traders</span></td>
    </tr></table>
  </td></tr>

  <!-- Card -->
  <tr><td style="background-color:#FFFFFF;border:1px solid #E3E8EA;border-radius:14px;overflow:hidden;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td height="5" style="background-color:${accentColor};font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td class="inner" style="padding:36px 44px 42px;">
        ${eyebrow ? `<div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${eyeColor};padding-bottom:14px;">${eyebrow}</div>` : ""}
        <div style="font-family:'Space Grotesk',Arial,sans-serif;font-size:27px;line-height:1.2;font-weight:700;color:#082A3B;">${heading}</div>
        ${sub ? `<div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:15px;line-height:1.5;color:#5C6B73;padding-top:8px;">${sub}</div>` : ""}
        <div style="padding-top:24px;">${bodyHtml}</div>
        ${ctaLabel && ctaHref ? `
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr>
          <td style="border-radius:9px;background-color:${ctaColor};">
            <a href="${ctaHref}" style="display:inline-block;padding:13px 28px;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:9px;">${ctaLabel}</a>
          </td>
        </tr></table>` : ""}
      </td></tr>
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td align="center" style="padding:26px 24px 0;">
    ${footerNote ? `<p style="margin:0 0 10px;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:12px;line-height:1.6;color:#8A969C;">${footerNote}</p>` : ""}
    <p style="margin:0 0 6px;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:12px;color:#8A969C;">Smile FX Traders &middot; Lusaka, Zambia</p>
    <p style="margin:0;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:12px;color:#8A969C;"><a href="${APP_URL}/settings" style="color:#1B807B;text-decoration:underline;">Email settings</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;<a href="${APP_URL}/settings" style="color:#1B807B;text-decoration:underline;">Unsubscribe</a>&nbsp;&nbsp;&middot;&nbsp;&nbsp;&copy; 2026 Smile FX Traders</p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

// ── Building blocks for bodyHtml ──────────────────────────────────────────────

/** Standard body paragraph */
export function para(html: string): string {
  return `<p style="margin:0 0 16px;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:15px;line-height:1.68;color:#3B4A52;">${html}</p>`;
}

/** Teal-dash bullet list (welcome email style) */
export function bulletList(items: string[]): string {
  const rows = items
    .map(
      (item) =>
        `<tr>
          <td valign="top" width="22" style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:15px;line-height:1.68;color:#08AEAA;font-weight:700;">&ndash;</td>
          <td style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:15px;line-height:1.68;color:#3B4A52;padding-bottom:8px;">${item}</td>
        </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">${rows}</table>`;
}

/** Kondwani avatar + name/title block */
export function kondwaniSig(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 22px;">
  <tr>
    <td valign="middle">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td align="center" width="40" height="40" style="width:40px;height:40px;background-color:#08AEAA;border-radius:20px;font-family:'Space Grotesk',Arial,sans-serif;font-size:16px;font-weight:700;color:#FFFFFF;">K</td>
      </tr></table>
    </td>
    <td valign="middle" style="padding-left:12px;">
      <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:14px;font-weight:600;color:#082A3B;">Kondwani</div>
      <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:12.5px;color:#5C6B73;">Lead Instructor, Smile FX Traders</div>
    </td>
  </tr>
</table>`;
}

/** Billing receipt table — label | value rows divided by lines */
export function receiptTable(rows: { label: string; value: string; valueColor?: string }[]): string {
  const trs = rows
    .map(
      (row, i) => `
    <tr>
      <td style="padding:13px 0;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:13px;color:#5C6B73;word-break:break-word;${i > 0 ? "border-top:1px solid #E3E8EA;" : ""}">${row.label}</td>
      <td align="right" style="padding:13px 0 13px 12px;font-family:'IBM Plex Mono','Courier New',monospace;font-size:14px;font-weight:600;color:${row.valueColor ?? "#082A3B"};word-break:break-word;${i > 0 ? "border-top:1px solid #E3E8EA;" : ""}">${row.value}</td>
    </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6F7;border-radius:10px;margin:6px 0 22px;">
  <tr><td style="padding:8px 22px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${trs}</table>
  </td></tr>
</table>`;
}

/** Centered label + large monospace value (e.g. "Access until / 17 July 2026") */
export function centeredCard(label: string, value: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6F7;border-radius:10px;margin:6px 0 22px;">
  <tr><td align="center" style="padding:22px;">
    <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#5C6B73;padding-bottom:6px;">${label}</div>
    <div style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:22px;font-weight:600;color:#082A3B;">${value}</div>
  </td></tr>
</table>`;
}

/** Stat card grid — 4 equal columns (weekly report) */
export function statGrid4(cards: { label: string; value: string; valueColor?: string }[]): string {
  const cells = cards
    .map(
      (c) => `
    <td width="25%" class="sg-cell" style="padding:0 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6F7;border-radius:10px;">
        <tr><td align="center" style="padding:16px 4px;">
          <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#5C6B73;padding-bottom:6px;">${c.label}</div>
          <div style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:20px;font-weight:600;color:${c.valueColor ?? "#082A3B"};">${c.value}</div>
        </td></tr>
      </table>
    </td>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px -4px 20px;"><tr>${cells}</tr></table>`;
}

/** Win / loss split bar */
export function winLossBar(wins: number, losses: number, trades: number): string {
  const pct = trades > 0 ? Math.round((wins / trades) * 100) : 0;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px;">
  <tr>
    <td style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:12.5px;font-weight:600;color:#1B807B;padding-bottom:7px;">${wins} wins</td>
    <td align="right" style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:12.5px;font-weight:600;color:#EA523D;padding-bottom:7px;">${losses} losses</td>
  </tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">
  <tr>
    <td width="${pct}%" height="10" style="background-color:#08AEAA;border-radius:5px 0 0 5px;font-size:0;line-height:0;">&nbsp;</td>
    <td height="10" style="background-color:#F3D5D0;border-radius:0 5px 5px 0;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
}

/** Info card — label above monospace content (best model, etc.) */
export function infoCard(label: string, content: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6F7;border-radius:10px;margin:0 0 22px;">
  <tr><td style="padding:16px 22px;">
    <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:#5C6B73;padding-bottom:6px;">${label}</div>
    <div style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:15px;font-weight:600;color:#082A3B;">${content}</div>
  </td></tr>
</table>`;
}

/** Dark navy trade card (instructor alerts) */
export function tradeCard(p: {
  pair:       string;
  direction:  string;
  badgeBg:    string;  // pill background — teal or coral
  badgeText:  string;  // pill text
  title:      string;
  model:      string;
  modelColor: string;  // monospace model text colour
  entry:      string;
  sl:         string;
  tp1:        string;
  rr:         string;
}): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0C3245;border-radius:12px;margin:4px 0 22px;">
  <tr><td style="padding:22px 26px 24px;">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="font-family:'Space Grotesk',Arial,sans-serif;font-size:20px;font-weight:700;color:#FFFFFF;">${p.pair}</td>
      <td style="padding-left:12px;"><span style="display:inline-block;padding:4px 10px;background-color:${p.badgeBg};border-radius:6px;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.08em;color:${p.badgeText};">${p.direction}</span></td>
    </tr></table>
    <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:13.5px;color:rgba(255,255,255,0.62);padding-top:6px;">${p.title}</div>
    <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:12.5px;color:rgba(255,255,255,0.62);padding-top:10px;">Model &nbsp;<span style="font-family:'IBM Plex Mono','Courier New',monospace;color:${p.modelColor};">${p.model}</span></div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;"><tr>
      ${[
        ["Entry", p.entry],
        ["SL",    p.sl],
        ["TP1",   p.tp1],
        ["R:R",   p.rr],
      ]
        .map(
          ([lbl, val]) => `<td width="25%" class="tc-cell" style="padding:14px 6px 0 0;">
        <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:10px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.45);padding-bottom:5px;">${lbl}</div>
        <div style="font-family:'IBM Plex Mono','Courier New',monospace;font-size:15px;font-weight:600;color:#FFFFFF;">${val}</div>
      </td>`,
        )
        .join("")}
    </tr></table>
  </td></tr>
</table>`;
}

/** Post excerpt card (community reply email) */
export function postCard(text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F2F6F7;border-radius:10px;margin:4px 0 14px;">
  <tr><td style="padding:16px 22px;">
    <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#5C6B73;padding-bottom:8px;">Your post</div>
    <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:14.5px;line-height:1.6;color:#3B4A52;">"${text}"</div>
  </td></tr>
</table>`;
}

/** Reply card with commenter initials avatar + teal left-border */
export function replyCard(commenterName: string, initials: string, text: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E3E8EA;border-left:4px solid #08AEAA;border-radius:10px;margin:0 0 22px;">
  <tr><td style="padding:16px 22px;">
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:10px;"><tr>
      <td align="center" width="30" height="30" style="width:30px;height:30px;background-color:#082A3B;border-radius:15px;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:11.5px;font-weight:700;color:#FFFFFF;">${initials}</td>
      <td style="padding-left:10px;font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:13.5px;font-weight:600;color:#082A3B;">${commenterName}</td>
    </tr></table>
    <div style="font-family:Inter,Arial,'Helvetica Neue',sans-serif;font-size:14.5px;line-height:1.6;color:#3B4A52;">"${text}"</div>
  </td></tr>
</table>`;
}

export const APP = APP_URL;
