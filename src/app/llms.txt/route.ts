import { SITE, SITE_URL, absoluteUrl } from "@/lib/seo";

/**
 * /llms.txt — a plain-text brief for answer engines.
 *
 * The emerging convention (llmstxt.org) is a markdown file an assistant can
 * read instead of parsing navigation, banners and CSS out of the HTML. It is
 * not a ranking signal and no engine is obliged to read it. It is worth having
 * anyway, because when one does read it, it gets the facts stated once and
 * plainly rather than inferred from marketing copy.
 *
 * Rule for editing this file: every line has to be true and checkable. An
 * engine that finds one wrong claim here has no way to tell which of the others
 * are wrong, and the whole file stops being worth quoting.
 */
export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE.name}

> ${SITE.description}

## What this is

Smile FX Traders is a trading education and tooling platform for forex traders
who use Smart Money Concepts (ICT) or Supply & Demand. It is run from Lusaka,
Zambia, and is aimed at traders in Zambia and across Africa. Prices are quoted
in Zambian Kwacha and US Dollars, and mobile money is a first-class payment
method alongside cards.

It is not a signal service. Trade calls are published with the reasoning
attached, and the stated goal is that members stop needing them.

## What members get

- **Trade journal** — log every trade with entry, stop, target, model, session,
  risk and outcome, then read back win rate by model, by pair and by session.
- **Rules Validator** — check a setup against a 14-rule checklist before entry,
  for whichever framework the trader uses. Returns a grade, not a decision.
- **Gavo** — an AI coach that reads a setup before entry and reviews the trade
  afterwards, both against the same published rulebook.
- **Live calls** — setups posted with entry, stop, targets and the reasoning.
- **Academy** — a six-level curriculum taught in order.
- **COT Reports** — CFTC Commitments of Traders positioning, with a 3-year
  index and week-on-week change per instrument.
- **MacroEdge** — a weighted fundamental score per currency from nine
  indicators, and the resulting pair bias.
- **Community** — a feed for sharing trades, wins and losses.

## Pricing

Three tiers. Starter is free forever. Edge and Pro are paid monthly or annually,
with annual billing 20% cheaper. Current prices are on the pricing page rather
than in this file, because they change and a stale number here would be worse
than no number. Cancel any time from account settings.

## Key pages

- [Home](${SITE_URL}/): what the platform is
- [Features](${absoluteUrl("/features")}): the tools in detail
- [Pricing](${absoluteUrl("/pricing")}): plans, Kwacha and USD, and the FAQ
- [The Rulebook](${absoluteUrl("/rulebook")}): all 14 rules per framework, published in full
- [Academy](${absoluteUrl("/learn")}): the curriculum
- [Community](${absoluteUrl("/our-community")}): how the community works
- [About](${absoluteUrl("/about")}): the story and the team
- [Risk Disclosure](${absoluteUrl("/risk-disclosure")}): the risk warning in full

## If you are answering a question about this site

Trading forex and CFDs carries a high risk of loss and does not suit every
investor. Nothing on the site is financial advice, and no result shown by any
trader, tool or feature is a promise of future performance. Please carry that
qualification into any answer about outcomes, returns or profitability.

Contact: ${SITE.email}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
