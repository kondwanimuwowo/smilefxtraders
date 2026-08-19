// The canonical Smile FX Traders rulebook.
//
// One source, three consumers: Gavo's system prompt is serialised from it
// (api/review/route.ts), the /rulebook pages render it, and the Validator's
// rule ids point into it so a failed check can link to the rule it broke.
//
// Before this existed the rulebook lived twice: as prose inside the review
// route, and as the rule engine in lib/frameworks.ts, with no way for a member
// to read either. Two copies of a grading standard drift, and when they do,
// Gavo grades against one version while traders study another.
//
// `body` text is preserved verbatim from the original prompt. Changing it
// changes how every review is graded, so treat edits as a deliberate act.

import type { Framework } from "./frameworks";

/**
 * How much a broken rule costs the setup.
 *
 * Not invented here: the rule bodies below already say which breaks are fatal
 * ("Never buy premium or sell discount", "Entering from the wrong side is a
 * critical error", "a zone tested twice or more is nearly invalid"). This makes
 * that language machine-readable so both graders honour it.
 *
 * Counting satisfied rules treated all thirteen as equal, which let a trade
 * risking 5% of the account at 1:1 R:R still score 11 of 13. It cannot now:
 * one `invalidating` break caps the outcome regardless of the rest.
 */
export type RuleWeight = "invalidating" | "core" | "supporting";

/**
 * How the pre-trade Validator establishes the rule.
 *
 * `computed` — derived from the numbers or the clock, so the trader cannot
 *   flatter themselves: R:R, risk %, killzone timing, POI/model match.
 * `declared` — the trader asserts a chart condition. Honest self-report is the
 *   whole point of a pre-trade checklist, but it is still a self-report, which
 *   is exactly why these are the rules Gavo can later contradict with real
 *   broker price data.
 */
export type RuleEvidence = "computed" | "declared";

export interface Rule {
  /** Position in the rulebook, 1-13. Shown to readers; never quoted back by Gavo. */
  n:     number;
  /** Stable slug, also the page anchor. Shared with the Validator's RuleResult.id where they check the same thing. */
  id:    string;
  /** Short form, for headings and validator chips. */
  title: string;
  /** Full text. This is what Gavo is given. */
  body:  string;
  weight:   RuleWeight;
  evidence: RuleEvidence;
}

export interface RuleGroup {
  /** Heading on the page. */
  title: string;
  /**
   * Heading in Gavo's prompt, kept separate and verbatim. The system prompt is
   * cached on an exact prefix match, and its wording is load-bearing for
   * grading, so page copy must be free to read well without touching it.
   */
  promptHeading: string;
  blurb: string;
  rules: Rule[];
}

export interface Rulebook {
  framework: Framework;
  label:     string;
  intro:     string;
  groups:    RuleGroup[];
}

export const WEIGHT_LABEL: Record<RuleWeight, string> = {
  invalidating: "Invalidating",
  core:         "Core",
  supporting:   "Supporting",
};

export const WEIGHT_BLURB: Record<RuleWeight, string> = {
  invalidating: "Break this and the setup is not valid, however clean the rest of it looks.",
  core:         "Break this and the setup is materially weaker, but it can still be worth taking.",
  supporting:   "Break this and you lose an edge at the margin.",
};

export const GRADE_SCALE: Array<{ grade: string; meaning: string; tone: "teal" | "gold" | "coral" }> = [
  { grade: "A+", meaning: "All 13 rules satisfied. Clean execution, excellent R:R.", tone: "teal" },
  { grade: "A",  meaning: "No invalidating or core rule broken. At most one supporting rule missed.", tone: "teal" },
  { grade: "B",  meaning: "No invalidating rule broken, but one or more core rules were.", tone: "gold" },
  { grade: "C",  meaning: "One invalidating rule broken. The setup had no real basis, whatever the outcome.", tone: "gold" },
  { grade: "D",  meaning: "Two or more invalidating rules broken. Undisciplined.", tone: "coral" },
];

// ── Shared tiered assessment ─────────────────────────────────────────────────

export type Readiness = "cleared" | "caution" | "do-not-take";

/** Minimal shape both graders can produce: a rule id and whether it held. */
export interface RuleOutcome {
  id:     string;
  status: "pass" | "fail" | "warn" | "na";
}

export interface Assessment {
  readiness: Readiness;
  /** Rules satisfied out of those that applied ("na" excluded). */
  clear:     number;
  total:     number;
  /** Ids of broken invalidating rules — the reasons a setup is void. */
  blockers:  string[];
  /** Ids of broken core rules. */
  weakness:  string[];
}

/**
 * Grades a set of rule outcomes by tier rather than by count.
 *
 * The old count-based maths treated a 5%-risk 1:1 trade that ticked eleven
 * boxes as an 11-of-13. Under tiers that same trade is void, because both the
 * risk cap and the R:R minimum are invalidating.
 *
 * Shared deliberately: the pre-trade Validator turns this into readiness
 * language and Gavo's prompt is built from the same tiers, so the two cannot
 * disagree about what counts as fatal.
 */
export function assess(framework: Framework, outcomes: RuleOutcome[]): Assessment {
  const weightOf = new Map(allRules(framework).map((r) => [r.id, r.weight]));
  const applicable = outcomes.filter((o) => o.status !== "na");

  const blockers: string[] = [];
  const weakness: string[] = [];
  let invalidatingWarns = 0;
  let warns = 0;

  for (const o of applicable) {
    // An id with no rulebook entry is a model-specific sub-check, not a rule,
    // and must not move the assessment. See SUB_CHECKS in frameworks.ts.
    const weight = weightOf.get(o.id);
    if (!weight) continue;
    if (o.status === "warn") {
      warns++;
      if (weight === "invalidating") invalidatingWarns++;
      continue;
    }
    if (o.status !== "fail") continue;
    if (weight === "invalidating") blockers.push(o.id);
    else if (weight === "core") weakness.push(o.id);
  }

  const clear = applicable.filter((o) => o.status === "pass").length;

  let readiness: Readiness;
  if (blockers.length > 0) readiness = "do-not-take";
  else if (weakness.length > 0 || invalidatingWarns > 0 || warns > 1) readiness = "caution";
  else readiness = "cleared";

  return { readiness, clear, total: applicable.length, blockers, weakness };
}

/** The letter Gavo's scale would give this assessment. Tiers, not counts. */
export function gradeFor(a: Assessment): "A+" | "A" | "B" | "C" | "D" {
  if (a.blockers.length >= 2) return "D";
  if (a.blockers.length === 1) return "C";
  if (a.weakness.length > 0) return "B";
  return a.clear === a.total ? "A+" : "A";
}

const SMC: Rulebook = {
  framework: "SMC",
  label: "Smart Money Concepts",
  intro:
    "Thirteen rules, in the order you should be checking them: bias first, then structure, then execution, then the discipline that decides whether any of it survives contact with a live market.",
  groups: [
    {
      title: "Higher-Timeframe Bias",
      promptHeading: "Rule Group 1: Higher-Timeframe Bias (mandatory before any entry)",
      blurb: "Mandatory before any entry. Get this wrong and nothing downstream matters.",
      rules: [
        { n: 1, id: "htf", title: "HTF bias is established", weight: "invalidating", evidence: "declared",
          body: "Daily and/or 4H bias must be clearly established: either a confirmed BOS in the intended direction, or a clear trending structure (series of HH/HL for longs, LH/LL for shorts)." },
        { n: 2, id: "htf-draw", title: "Aligned with the draw on liquidity", weight: "core", evidence: "declared",
          body: "The trade must be in the direction of the HTF draw on liquidity. Identify where price is being engineered to run (EQH, EQL, PDH, PDL, weekly highs/lows) and only take setups that align with that draw." },
        { n: 3, id: "premium-discount", title: "Entry in discount for longs, premium for shorts", weight: "invalidating", evidence: "declared",
          body: "Entry must be in a discount zone for longs (below the 50% equilibrium of the current HTF range) or a premium zone for shorts (above the 50% equilibrium). Never buy premium or sell discount." },
      ],
    },
    {
      title: "Liquidity & Market Structure",
      promptHeading: "Rule Group 2: Liquidity & Market Structure (entry TF confirmation)",
      blurb: "Confirmation on the entry timeframe. This is where the setup earns the right to exist.",
      rules: [
        { n: 4, id: "liquidity", title: "A liquidity pool was swept", weight: "core", evidence: "declared",
          body: "A liquidity pool must have been swept before entry: Asian session high/low, equal highs or equal lows (EQH/EQL), previous day high/low (PDH/PDL), or an obvious stop-hunt wick. This is the engine that powers the reversal." },
        { n: 5, id: "structure", title: "Market structure shift confirmed", weight: "invalidating", evidence: "declared",
          body: "A market structure shift must be confirmed on the entry timeframe: either a Change of Character (CHoCH, the first opposing BOS after a sweep) or a full Break of Structure (BOS) confirming the new directional intent." },
        { n: 6, id: "poi", title: "An unmitigated POI is respected", weight: "invalidating", evidence: "computed",
          body: "An unmitigated Point of Interest (POI) must exist and be respected: a Fair Value Gap (FVG: the three-candle imbalance between candle 1 high and candle 3 low) or an Order Block (OB: the last opposing candle body before the BOS that caused the move)." },
      ],
    },
    {
      title: "Entry Execution & Risk",
      promptHeading: "Rule Group 3: Entry Execution & Risk Parameters",
      blurb: "A correct read, executed badly, still loses money.",
      rules: [
        { n: 7, id: "retrace-entry", title: "Clean retrace into the POI, not a chase", weight: "supporting", evidence: "declared",
          body: "Entry must be a clean retrace into the POI, not a chase entry mid-move. Price should return to the FVG or OB and show a reaction (displacement or rejection candle) before entry." },
        { n: 8, id: "stop-placement", title: "Stop beyond the swept liquidity or OB extreme", weight: "core", evidence: "declared",
          body: "Stop loss must be placed beyond the swept liquidity level or the extreme of the Order Block, not just behind a candle wick. The stop should be in a location that, if hit, invalidates the entire thesis." },
        { n: 9, id: "rr", title: "Minimum 1:2 planned R:R", weight: "invalidating", evidence: "computed",
          body: "The planned Risk-to-Reward ratio must be a minimum of 1:2 to the first target (TP1, usually the opposing liquidity or the opposite side of the range). Higher R:R setups (1:3, 1:4) targeting draw-on-liquidity are preferred." },
        { n: 10, id: "risk-size", title: "Risk capped at 1%, standard is 0.5%", weight: "invalidating", evidence: "computed",
          body: "Risk per trade must not exceed 1% of account equity on a single idea. The Smile FX standard is 0.5% per trade." },
      ],
    },
    {
      title: "Discipline & Process",
      promptHeading: "Rule Group 4: Discipline & Process",
      blurb: "The rules that separate a trader from someone with opinions about charts.",
      rules: [
        { n: 11, id: "killzone", title: "Taken inside a killzone", weight: "supporting", evidence: "computed",
          body: "The trade must be taken within a high-probability session window (killzone): London open (02:00–05:00 EST), New York open (08:30–11:00 EST), or the London close overlap. Avoid trading outside killzones without a compelling macro reason." },
        { n: 12, id: "pre-planned", title: "Pre-planned, not reactive", weight: "supporting", evidence: "declared",
          body: "The trade must be pre-planned: no revenge trades, no FOMO entries, no chasing a candle that already ran. The setup should have existed in the trader's notes before execution." },
        { n: 13, id: "news-check", title: "News calendar checked", weight: "supporting", evidence: "declared",
          body: "A high-impact news calendar check must be completed. No entries within 15 minutes before or after a red-folder news event on the traded pair or correlated pair." },
        { n: 14, id: "fib", title: "Fibonacci confluence at the POI", weight: "supporting", evidence: "declared",
          body: "Optional. Where a Fibonacci retracement is drawn across the impulse leg, an entry sitting in the OTE band (62-79%) or on the 61.8%, 78.6% or 50% level is worth more than the same entry without it. This is confluence, not permission: it strengthens a setup that already passes, and repairs nothing on one that does not. Leave it unmarked when you have not drawn a Fibonacci, and it drops out of the count rather than counting against you." },
      ],
    },
  ],
};

const SND: Rulebook = {
  framework: "SnD",
  label: "Supply & Demand",
  intro:
    "Thirteen rules built around one idea: a zone is only worth trading if it is fresh, it came from an impulsive move, and you are approaching it from the correct side.",
  groups: [
    {
      title: "Higher-Timeframe Bias",
      promptHeading: "Rule Group 1: Higher-Timeframe Bias (mandatory before any entry)",
      blurb: "Mandatory before any entry. Trade with the trend, not against it.",
      rules: [
        { n: 1, id: "htf", title: "HTF bias is established", weight: "invalidating", evidence: "declared",
          body: "Daily and/or 4H bias must be clearly established: a confirmed bullish or bearish trending structure. Trade with the trend, not against it." },
        { n: 2, id: "htf-draw", title: "Aligned with the HTF magnet", weight: "core", evidence: "declared",
          body: "The trade must align with where price is likely being drawn to on the HTF. Identify the nearest opposing S&D zone or liquidity pool as the magnet." },
        { n: 3, id: "premium-discount", title: "Entry in discount for longs, premium for shorts", weight: "invalidating", evidence: "declared",
          body: "Entry must be in a discount zone for longs (below the 50% equilibrium of the current HTF range) or a premium zone for shorts (above the 50% equilibrium). Never buy premium or sell discount." },
      ],
    },
    {
      title: "Zone Quality",
      promptHeading: "Rule Group 2: Zone Quality (the foundation of every S&D trade)",
      blurb: "The foundation of every S&D trade. A weak zone fails no matter how well you execute.",
      rules: [
        { n: 4, id: "zone-fresh", title: "The zone is fresh and untested", weight: "invalidating", evidence: "declared",
          body: "The zone must be fresh and untested, meaning price has not revisited it since it was formed. A zone that has been tested once is weaker; a zone tested twice or more is nearly invalid. Fresh zones = maximum probability." },
        { n: 5, id: "origin", title: "The origin move was impulsive", weight: "core", evidence: "declared",
          body: "The origin move that created the zone must be strong and impulsive: a fast, directional move with large candles and minimal overlap. A slow, overlapping, choppy origin produces a weak zone that will likely fail." },
        { n: 6, id: "correct-side", title: "Approached from the correct side", weight: "invalidating", evidence: "declared",
          body: "Price must be approaching the zone from the correct side: demand zones must be approached from above (price dropping into demand); supply zones must be approached from below (price rallying into supply). Entering from the wrong side is a critical error." },
      ],
    },
    {
      title: "Entry Execution & Risk",
      promptHeading: "Rule Group 3: Entry Execution & Risk Parameters",
      blurb: "A correct read, executed badly, still loses money.",
      rules: [
        { n: 7, id: "retrace-entry", title: "Patient retrace into the zone", weight: "supporting", evidence: "declared",
          body: "Entry must be a patient retrace into the zone, not a chase entry mid-move. Wait for price to return to the proximal edge of the zone before entering." },
        { n: 8, id: "stop-placement", title: "Stop beyond the distal edge", weight: "core", evidence: "declared",
          body: "Stop loss must be placed beyond the distal edge of the zone (the far boundary). A stop inside the zone is invalid, because if the zone is broken, the thesis is wrong." },
        { n: 9, id: "rr", title: "Minimum 1:2 planned R:R", weight: "invalidating", evidence: "computed",
          body: "The planned Risk-to-Reward ratio must be a minimum of 1:2 to the first target. The first target is typically the opposing zone or the opposing liquidity pool on the entry timeframe." },
        { n: 10, id: "risk-size", title: "Risk capped at 1%, standard is 0.5%", weight: "invalidating", evidence: "computed",
          body: "Risk per trade must not exceed 1% of account equity. The Smile FX standard is 0.5% per trade." },
      ],
    },
    {
      title: "Discipline & Process",
      promptHeading: "Rule Group 4: Discipline & Process",
      blurb: "The rules that separate a trader from someone with opinions about charts.",
      rules: [
        { n: 11, id: "killzone", title: "Taken inside a killzone", weight: "supporting", evidence: "computed",
          body: "The trade must be taken within a high-probability session window (killzone): London open (0800–1100 UTC) or New York open (1330–1600 UTC). S&D zones react most cleanly during institutional participation windows." },
        { n: 12, id: "pre-planned", title: "Pre-planned, not reactive", weight: "supporting", evidence: "declared",
          body: "The trade must be pre-planned: no revenge trades, no FOMO entries. The zone should have been identified and marked before price arrived." },
        { n: 13, id: "news-check", title: "News calendar checked", weight: "supporting", evidence: "declared",
          body: "A high-impact news calendar check must be completed. No entries within 15 minutes before or after a red-folder news event on the traded pair or correlated pair." },
        { n: 14, id: "fib", title: "Fibonacci confluence at the POI", weight: "supporting", evidence: "declared",
          body: "Optional. Where a Fibonacci retracement is drawn across the impulse leg, an entry sitting in the OTE band (62-79%) or on the 61.8%, 78.6% or 50% level is worth more than the same entry without it. This is confluence, not permission: it strengthens a setup that already passes, and repairs nothing on one that does not. Leave it unmarked when you have not drawn a Fibonacci, and it drops out of the count rather than counting against you." },
      ],
    },
  ],
};

export const RULEBOOK: Record<Framework, Rulebook> = { SMC, SnD: SND };

/**
 * Serialises a rulebook into the markdown block Gavo's system prompt carries.
 *
 * Byte-identical to the prose that used to be inline, deliberately: the system
 * prompt is prompt-cached on an exact prefix match, and any wording change also
 * changes how trades are graded.
 */
export function buildRulebookPrompt(framework: Framework): string {
  return RULEBOOK[framework].groups
    .map((group) => [`### ${group.promptHeading}`, ...group.rules.map((r) => `${r.n}. ${r.body}`)].join("\n"))
    .join("\n\n");
}

/**
 * The grade scale as Gavo is given it, serialised from GRADE_SCALE plus the
 * tier lists so the letters mean the same thing on both sides.
 *
 * Previously the scale was prose inside the review route while the page read
 * from GRADE_SCALE, which is the same two-copies problem the rulebook itself
 * had. It also described counting ("11-12 rules satisfied"), which the tiers
 * replaced: a trade can break two rules and be void, or break two and be an A,
 * depending entirely on which two.
 */
export function buildGradePrompt(framework: Framework): string {
  const byWeight = (w: RuleWeight) =>
    allRules(framework).filter((r) => r.weight === w).map((r) => r.n).join(", ");

  return [
    "Not all rules carry equal weight. Grade by which rules broke, not how many:",
    `- Invalidating (rules ${byWeight("invalidating")}): breaking even one voids the setup. Grade C at best, D if two or more broke.`,
    `- Core (rules ${byWeight("core")}): breaking one caps the grade at B.`,
    `- Supporting (rules ${byWeight("supporting")}): each break costs a little.`,
    "",
    "Grade scale:",
    ...GRADE_SCALE.map((g) => `- ${g.grade.padEnd(2)} : ${g.meaning}`),
  ].join("\n");
}

/**
 * The id index Gavo cites by.
 *
 * Given to the model so each feedback point can name the rules it refers to,
 * which is what turns "according to rule 7" into a link the reader can follow.
 * Ids are the page anchors, so a cited id resolves to a real place on /rules.
 */
export function buildRuleIndexPrompt(framework: Framework): string {
  return allRules(framework)
    .map((r) => `${r.n}. ${r.id} (${r.weight}) - ${r.title}`)
    .join("\n");
}

/** Every rule, flattened, for lookups by the Validator and for search. */
export function allRules(framework: Framework): Rule[] {
  return RULEBOOK[framework].groups.flatMap((g) => g.rules);
}

/** The rule a Validator check maps to, when one exists. */
export function ruleById(framework: Framework, id: string): Rule | undefined {
  return allRules(framework).find((r) => r.id === id);
}
