import { emailLayout, paragraph, APP } from "../layout";

export function welcomeEmail(p: { name: string }): { subject: string; html: string } {
  const first = p.name.split(" ")[0];

  const bodyHtml = `
    ${paragraph(`Hey ${first},`)}
    ${paragraph(`Kondwani here — welcome to <strong style="color:#F0F8FF;">Smile FX Traders</strong>. Really glad you joined us.`)}
    ${paragraph(`This community is built around one idea: trading with a plan, reviewing every trade, and getting better week after week. Here's where I'd start:`)}
    <ul style="margin:0 0 16px;padding-left:20px;font-size:14px;line-height:1.9;color:#D1E5F0;">
      <li><a href="${APP}/journal" style="color:#08AEAA;font-weight:600;">Log your first trade</a> in the journal — even a past one. The stats start working immediately.</li>
      <li><a href="${APP}/academy" style="color:#08AEAA;font-weight:600;">Start the Foundations course</a> in the Academy if you're new to Smart Money Concepts.</li>
      <li><a href="${APP}/community" style="color:#08AEAA;font-weight:600;">Introduce yourself</a> in the community feed — tell us what you trade.</li>
    </ul>
    ${paragraph(`If you ever get stuck or have a question, just reply to this email — it comes straight to me.`)}
    ${paragraph(`See you inside,<br/><strong style="color:#F0F8FF;">Kondwani</strong><br/><span style="color:#7EB8D4;font-size:13px;">Lead Instructor, Smile FX Traders</span>`)}`;

  return {
    subject: `Welcome to Smile FX Traders, ${first} 👋`,
    html: emailLayout({
      preheader: "Glad you're here — here's how to get started.",
      eyebrow:   "Welcome aboard",
      heading:   `Welcome, ${first}!`,
      sub:       "A quick note from your instructor.",
      bodyHtml,
      cta:       { label: "Open your dashboard →", href: `${APP}/dashboard` },
    }),
  };
}
