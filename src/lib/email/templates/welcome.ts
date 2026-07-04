import { emailShell, para, bulletList, kondwaniSig, APP } from "../layout";

export function welcomeEmail(p: { name: string }): { subject: string; html: string } {
  const first = p.name.split(" ")[0];

  const bodyHtml = [
    para(`Hey ${first},`),
    para(`Kondwani here — welcome to Smile FX Traders. Really glad you joined us.`),
    para(`This community is built around one idea: trading with a plan, reviewing every trade, and getting better week after week. Here's where I'd start:`),
    bulletList([
      `Log your first trade in the journal — even a past one. The stats start working immediately.`,
      `Start the Foundations course in the Academy if you're new to Smart Money Concepts.`,
      `Introduce yourself in the community feed — tell us what you trade.`,
    ]),
    para(`If you ever get stuck or have a question, just reply to this email — it comes straight to me.`),
    para(`See you inside,`),
    kondwaniSig(),
  ].join("");

  return {
    subject: `Welcome to Smile FX Traders, ${first} 👋`,
    html: emailShell({
      preheader:  "A quick note from your instructor — here's where to start.",
      eyebrow:    "Welcome aboard",
      heading:    `Welcome, ${first}!`,
      sub:        "A quick note from your instructor.",
      bodyHtml,
      ctaLabel:   "Open your dashboard →",
      ctaHref:    `${APP}/dashboard`,
    }),
  };
}
