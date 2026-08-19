import { assess, ruleById, type Assessment, type Readiness } from "./rulebook";

// Single source of truth for trading framework definitions.
// Both the validator and journal import from here — nothing duplicated.

export type Framework = "SMC" | "SnD";

export const FRAMEWORK_LABELS: Record<Framework, string> = {
  SMC: "Smart Money Concepts (ICT)",
  SnD: "Supply & Demand",
};

// ── Models ────────────────────────────────────────────────────────────────────

export const MODELS: Record<Framework, string[]> = {
  SMC: [
    "Liquidity Sweep → FVG",
    "OB + BOS",
    "Liquidity → CHoCH",
    "SMT + OB",
    "OB + FVG",
    "Turtle Soup",
    "BOS + retrace",
  ],
  SnD: [
    "Fresh Demand Zone",
    "Fresh Supply Zone",
    "Drop-Base-Rally (DBR)",
    "Rally-Base-Drop (RBD)",
    "Drop-Base-Drop (DBD)",
    "Rally-Base-Rally (RBR)",
  ],
};

// ── Validator info cards ──────────────────────────────────────────────────────

export const MODEL_INFO: Record<Framework, Record<string, { need: string[]; tip: string }>> = {
  SMC: {
    "Liquidity Sweep → FVG":  { need: ["Liquidity swept", "FVG as POI"],              tip: "Price must sweep a high/low (EQH/EQL/PDH/PDL) and then enter a Fair Value Gap." },
    "OB + BOS":               { need: ["BOS confirmed", "OB as POI"],                  tip: "A Break of Structure must print first. Entry is the last opposing candle before the BOS." },
    "Liquidity → CHoCH":      { need: ["Liquidity swept", "CHoCH confirmed"],          tip: "Liquidity swept, followed by a Change of Character that signals structural reversal." },
    "SMT + OB":               { need: ["SMT divergence", "OB as POI"],                 tip: "Two correlated pairs diverge (e.g. EURUSD makes HH, GBPUSD doesn't). Entry at the OB on the weaker pair." },
    "OB + FVG":               { need: ["OB as POI", "FVG as POI"],                     tip: "An Order Block and a Fair Value Gap overlap, providing the highest-confluence entry zone." },
    "Turtle Soup":            { need: ["Liquidity swept", "Reversal structure"],       tip: "Price sweeps a prior high or low (trapping breakout traders), then reverses sharply." },
    "BOS + retrace":          { need: ["BOS confirmed", "OB or FVG as retest zone"],  tip: "After a BOS, price retraces into the origin OB or FVG before continuing." },
  },
  SnD: {
    "Fresh Demand Zone":      { need: ["Zone untested", "Strong impulse origin", "In discount"],          tip: "A fresh demand zone has never been revisited. Price must have left with a strong, impulsive move. Weak origin = weak zone." },
    "Fresh Supply Zone":      { need: ["Zone untested", "Strong impulse origin", "In premium"],           tip: "A fresh supply zone has never been revisited. Look for a strong, fast impulsive move that created the zone." },
    "Drop-Base-Rally (DBR)":  { need: ["Drop identified", "Base formed", "Rally from base"],              tip: "Price drops sharply, consolidates (base), then rallies through. Enter on the return to the base." },
    "Rally-Base-Drop (RBD)":  { need: ["Rally identified", "Base formed", "Drop from base"],              tip: "Price rallies sharply, consolidates (base), then drops through. Enter on the return to the base." },
    "Drop-Base-Drop (DBD)":   { need: ["Zone on drop", "Base consolidation", "Continuation drop"],       tip: "Bearish continuation: price drops, bases, then continues dropping. Enter on the return to the base." },
    "Rally-Base-Rally (RBR)": { need: ["Zone on rally", "Base consolidation", "Continuation rally"],     tip: "Bullish continuation: price rallies, bases, then continues rallying. Enter on the return to the base." },
  },
};

// ── Trade drawer one-liners ────────────────────────────────────────────────────

export const MODEL_BRIEF: Record<Framework, Record<string, string>> = {
  SMC: {
    "Liquidity Sweep → FVG":  "Price sweeps a liquidity pool then enters a Fair Value Gap.",
    "OB + BOS":               "Order Block entry after a confirmed Break of Structure.",
    "Liquidity → CHoCH":      "Liquidity taken, then a Change of Character signals reversal.",
    "SMT + OB":               "Smart Money Technique divergence confirms an Order Block entry.",
    "OB + FVG":               "Order Block coincides with a Fair Value Gap for confluence.",
    "Turtle Soup":            "Stop-hunt reversal off a previous high/low with structure flip.",
    "BOS + retrace":          "Break of Structure, then a retracement entry on the retrace.",
  },
  SnD: {
    "Fresh Demand Zone":      "Untested demand zone formed by a strong bullish impulse.",
    "Fresh Supply Zone":      "Untested supply zone formed by a strong bearish impulse.",
    "Drop-Base-Rally (DBR)":  "Price drops, consolidates (base), then rallies. Enter on the return to the base.",
    "Rally-Base-Drop (RBD)":  "Price rallies, consolidates (base), then drops. Enter on the return to the base.",
    "Drop-Base-Drop (DBD)":   "Bearish continuation: drop, base, then further drop from the same zone.",
    "Rally-Base-Rally (RBR)": "Bullish continuation: rally, base, then further rally from the same zone.",
  },
};

// ── Journal tags ──────────────────────────────────────────────────────────────

export const TAG_POOL: Record<Framework, Record<string, string[]>> = {
  SMC: {
    "Liquidity Sweep → FVG": ["Sweep", "FVG", "Discount"],
    "OB + BOS":              ["OB", "BOS", "Premium"],
    "Liquidity → CHoCH":     ["EQL", "CHoCH", "FVG"],
    "SMT + OB":              ["SMT", "OB", "Premium"],
    "OB + FVG":              ["OB", "FVG"],
    "Turtle Soup":           ["Reversal", "Sweep"],
    "BOS + retrace":         ["BOS", "Retrace"],
  },
  SnD: {
    "Fresh Demand Zone":      ["Demand", "Fresh", "Discount"],
    "Fresh Supply Zone":      ["Supply", "Fresh", "Premium"],
    "Drop-Base-Rally (DBR)":  ["Demand", "DBR", "Reversal"],
    "Rally-Base-Drop (RBD)":  ["Supply", "RBD", "Reversal"],
    "Drop-Base-Drop (DBD)":   ["Supply", "DBD", "Continuation"],
    "Rally-Base-Rally (RBR)": ["Demand", "RBR", "Continuation"],
  },
};

// ── Shared Setup interface (used by Validator + validate functions) ─────────────

export interface Setup {
  framework:         Framework;
  pair:              string;
  dir:               string;
  model:             string;
  session:           string;
  htfBias:           string;
  entryTf:           string;
  rr:                string;
  killzone:          boolean;
  /**
   * Where entry sits in the HTF range (rulebook rule 3).
   *
   * Was a single `inPremiumDiscount` boolean, which could not tell "near
   * equilibrium" apart from "on the wrong side of it" — and the rulebook only
   * forbids the latter ("Never buy premium or sell discount"). Since rule 3 is
   * invalidating, that distinction decides whether a setup is void or merely
   * weaker, so it needs three states rather than two.
   */
  pdZone:            "" | "discount" | "equilibrium" | "premium";
  // ── Risk inputs ─────────────────────────────────────────────────────────
  // These lived in the Validator's own component state, feeding the pip
  // calculator only, so validate() could not see them: the calculator knew a
  // trader was risking 3% while the rule engine had no idea. Rules 8 and 10
  // are unenforceable without them.
  balance:           string;
  riskPct:           string;
  entryPrice:        string;
  slPrice:           string;
  // ── Declarations ────────────────────────────────────────────────────────
  // Rules the trader asserts rather than the engine deriving. Self-reported by
  // nature, which is the point of a pre-trade checklist, and also why Gavo can
  // later contradict them from real price data.
  htfDrawAligned:    boolean;
  cleanRetrace:      boolean;
  stopBeyondInvalidation: boolean;
  prePlanned:        boolean;
  newsChecked:       boolean;
  // SMC-specific
  poi:               string;
  liqSwept:          boolean;
  bos:               boolean;
  choch:             boolean;
  smtDiv:            boolean;
  // SnD-specific
  zoneIsFresh:       boolean;
  strongOrigin:      boolean;
  correctSide:       boolean;
  // Fibonacci confluence — framework-agnostic
  fibConfluence:     boolean;
  fibLevel:          string; // "OTE (62–79%)" | "61.8%" | "78.6%" | "50%"
}

export const FIB_LEVELS = ["OTE (62–79%)", "61.8%", "78.6%", "50%"] as const;
export type FibLevel = typeof FIB_LEVELS[number];

export const FIB_TAG_OPTIONS = ["OTE", "Fib 61.8", "Fib 78.6", "Fib 50"] as const;
export type FibTag = typeof FIB_TAG_OPTIONS[number];

export function BLANK_SETUP(framework: Framework): Setup {
  return {
    framework,
    pair:              "XAUUSD",
    dir:               "long",
    model:             MODELS[framework][0],
    session:           "London",
    htfBias:           "bullish",
    entryTf:           "H1",
    poi:               "FVG",
    rr:                "",
    killzone:          false,
    pdZone:            "",
    // 10000/1 mirrors the calculator's previous defaults, and the balance is
    // overwritten from localStorage on mount where the trader has set one.
    balance:           "10000",
    riskPct:           "1",
    entryPrice:        "",
    slPrice:           "",
    htfDrawAligned:    false,
    cleanRetrace:      false,
    stopBeyondInvalidation: false,
    prePlanned:        false,
    newsChecked:       false,
    liqSwept:          false,
    bos:               false,
    choch:             false,
    smtDiv:            false,
    zoneIsFresh:       false,
    strongOrigin:      false,
    correctSide:       false,
    fibConfluence:     false,
    fibLevel:          "OTE (62–79%)",
  };
}

// ── Shared types ──────────────────────────────────────────────────────────────

export type Status = "pass" | "fail" | "warn" | "na";

export interface RuleResult {
  id:     string;
  label:  string;
  status: Status;
  why:    string;
}

export interface ValidationResult {
  /** The thirteen rulebook rules, in rulebook order. */
  rules:     RuleResult[];
  /** Model-specific advice that is not a rulebook rule and does not affect readiness. */
  subChecks: RuleResult[];
  readiness: Readiness;
  clear:     number;
  total:     number;
  /** Ids of broken invalidating rules. Non-empty means the setup is void. */
  blockers:  string[];
  /** Ids of broken core rules. */
  weakness:  string[];
  verdict:   string;
  canLog:    boolean;
}

// ── Shared rules ──────────────────────────────────────────────────────────────
// Seven of the thirteen rules are identical across both frameworks. They used
// to be written out twice, which is how the two engines drifted apart (S&D
// checked premium/discount, SMC never did, despite it being rule 3 in both).

const SESSION_KILLZONES: Record<string, string> = {
  London: "0800–1100 UTC", "New York": "1330–1600 UTC", Asia: "0000–0300 UTC",
};

function ruleHtf(s: Setup, againstTrend: string): RuleResult {
  const biasMatch   = (s.dir === "long" && s.htfBias === "bullish") || (s.dir === "short" && s.htfBias === "bearish");
  const biasRanging = s.htfBias === "ranging";
  return {
    id: "htf", label: "HTF bias aligns with direction",
    status: biasRanging ? "warn" : biasMatch ? "pass" : "fail",
    why: biasRanging
      ? "HTF is ranging, and directional trades in choppy markets are low-probability."
      : biasMatch
        ? "Trade direction agrees with higher timeframe structure."
        : againstTrend,
  };
}

function ruleHtfDraw(s: Setup, target: string): RuleResult {
  return {
    id: "htf-draw", label: `Aligned with the ${target}`,
    status: s.htfDrawAligned ? "pass" : "warn",
    why: s.htfDrawAligned
      ? `Trade runs toward the ${target}, so price has a reason to reach your target.`
      : `Confirm where price is being drawn to before entering. Without a ${target} in your favour, your target is a guess.`,
  };
}

/**
 * Rule 3, invalidating. Three states rather than a boolean, because "near
 * equilibrium" is a caution while "on the wrong side of it" voids the setup —
 * the rulebook forbids only the second ("Never buy premium or sell discount").
 */
function rulePremiumDiscount(s: Setup): RuleResult {
  const wanted = s.dir === "long" ? "discount" : "premium";
  const label  = s.dir === "long" ? "Entry sits in discount" : "Entry sits in premium";
  if (!s.pdZone) {
    return { id: "premium-discount", label, status: "warn",
      why: `Mark where your entry sits in the HTF range. A ${s.dir} needs to be in ${wanted}.` };
  }
  if (s.pdZone === "equilibrium") {
    return { id: "premium-discount", label, status: "warn",
      why: "Entry is near the 50% equilibrium. Not a rule break, but you are paying mid-range price with no discount edge." };
  }
  const ok = s.pdZone === wanted;
  return {
    id: "premium-discount", label,
    status: ok ? "pass" : "fail",
    why: ok
      ? `Entry is in ${wanted}, which is where a ${s.dir} belongs.`
      : `You are ${s.dir === "long" ? "buying premium" : "selling discount"}. The rulebook forbids this outright: you are entering where price has already moved against you.`,
  };
}

function ruleRetrace(s: Setup, zone: string): RuleResult {
  return {
    id: "retrace-entry", label: "Entry is a retrace, not a chase",
    status: s.cleanRetrace ? "pass" : "warn",
    why: s.cleanRetrace
      ? `Waiting for price to come back to the ${zone} is what keeps your stop tight.`
      : `Confirm price has retraced into the ${zone}. Chasing mid-move widens your stop and ruins the R:R you planned.`,
  };
}

/**
 * Rule 8, core. Partly computed: whatever the trader declares, a stop on the
 * wrong side of entry is arithmetically wrong and fails regardless.
 */
function ruleStopPlacement(s: Setup, beyondWhat: string): RuleResult {
  const label = "Stop beyond the invalidation point";
  const entry = parseFloat(s.entryPrice);
  const sl    = parseFloat(s.slPrice);
  const bothPresent = Number.isFinite(entry) && Number.isFinite(sl) && entry !== sl;

  if (bothPresent) {
    const wrongSide = s.dir === "long" ? sl > entry : sl < entry;
    if (wrongSide) {
      return { id: "stop-placement", label, status: "fail",
        why: `Your stop is ${s.dir === "long" ? "above" : "below"} your entry on a ${s.dir}. That is not a stop, it is a target.` };
    }
  }
  return {
    id: "stop-placement", label,
    status: s.stopBeyondInvalidation ? "pass" : "warn",
    why: s.stopBeyondInvalidation
      ? `Stop sits beyond ${beyondWhat}, so if it is hit your thesis was genuinely wrong.`
      : `Confirm the stop sits beyond ${beyondWhat}, not just behind a wick. A stop that can be hit while your thesis still holds will bleed you.`,
  };
}

function ruleRR(s: Setup): RuleResult {
  const rrVal = parseFloat(s.rr);
  const hasRR = !isNaN(rrVal) && rrVal > 0;
  return {
    id: "rr", label: "Risk:Reward ≥ 2:1",
    status: !hasRR ? "warn" : rrVal < 2 ? "fail" : rrVal < 3 ? "warn" : "pass",
    why: !hasRR
      ? "Enter your planned R:R to validate. A minimum of 2:1 is required."
      : rrVal < 2
        ? `${rrVal}:1 is below the minimum 2:1. This trade does not pay enough to justify the risk.`
        : rrVal < 3
          ? `${rrVal}:1 meets minimum criteria. A 3:1 or better setup gives you more room to be wrong.`
          : `${rrVal}:1, excellent reward for the risk taken.`,
  };
}

/**
 * Rule 10, invalidating and fully computed — the check the Validator has always
 * had the numbers for and never made. The 1% cap is the only rule in the book
 * that decides whether a losing streak is survivable.
 */
function ruleRiskSize(s: Setup): RuleResult {
  const label   = "Risk capped at 1% of equity";
  const balance = parseFloat(s.balance);
  const risk    = parseFloat(s.riskPct);

  if (!Number.isFinite(risk) || risk <= 0) {
    return { id: "risk-size", label, status: "warn",
      why: "Set your risk percentage. Position size is the one input that decides whether a bad run ends your account." };
  }
  const cash = Number.isFinite(balance) && balance > 0
    ? ` That is ${(balance * risk / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })} of a ${balance.toLocaleString()} account.`
    : "";
  if (risk > 1) {
    return { id: "risk-size", label, status: "fail",
      why: `${risk}% breaches the 1% hard cap.${cash} Six losses in a row at this size is a drawdown most traders never come back from.` };
  }
  if (risk > 0.5) {
    return { id: "risk-size", label, status: "warn",
      why: `${risk}% is inside the 1% cap but above the 0.5% Smile FX standard.${cash}` };
  }
  return { id: "risk-size", label, status: "pass",
    why: `${risk}% is at or below the 0.5% house standard.${cash}` };
}

function ruleKillzone(s: Setup, reason: string): RuleResult {
  return {
    id: "killzone", label: "Entry within session killzone",
    status: s.killzone ? "pass" : "warn",
    why: s.killzone
      ? `Inside the ${s.session} killzone (${SESSION_KILLZONES[s.session] ?? "active window"}). ${reason}`
      : "Outside the killzone. Liquidity is thinner and moves are less reliable. Consider waiting for the window.",
  };
}

function rulePrePlanned(s: Setup, marked: string): RuleResult {
  return {
    id: "pre-planned", label: "Pre-planned, not reactive",
    status: s.prePlanned ? "pass" : "warn",
    why: s.prePlanned
      ? "This setup existed in your notes before you clicked. That is the difference between a trade and a reaction."
      : `Confirm you ${marked} before price arrived. Revenge trades and FOMO entries all feel justified in the moment.`,
  };
}

function ruleNewsCheck(s: Setup): RuleResult {
  return {
    id: "news-check", label: "News calendar checked",
    status: s.newsChecked ? "pass" : "warn",
    why: s.newsChecked
      ? "Calendar checked. No red-folder event is about to invalidate your levels."
      : "Check the calendar. A red-folder release inside 15 minutes can run every level on your chart regardless of how clean the setup is.",
  };
}

function ruleFibConfluence(s: Setup): RuleResult {
  // "na", not "warn", when it is unmarked. assess() drops na outcomes from
  // both clear and total, so a trader who never draws a Fibonacci still reads
  // 13/13 on a clean setup rather than being shown an unreachable 13/14.
  // Confluence should be able to raise a score, never to lower one.
  return {
    id: "fib", label: "Fibonacci confluence at the POI",
    status: s.fibConfluence ? "pass" : "na",
    why: s.fibConfluence
      ? `Entry sits at ${s.fibLevel}. Confluence on an entry that already passes is worth having.`
      : "Optional. Mark it if you drew a Fibonacci and the entry sits in the OTE band or on a key level; leave it if you did not, and it will not count against you.",
  };
}

// ── SMC rule engine ───────────────────────────────────────────────────────────

export function validateSMC(s: Setup): RuleResult[] {
  const structureOk = s.bos || s.choch;
  const chochOnly   = s.choch && !s.bos;

  const sweepModels = ["Liquidity Sweep → FVG", "Liquidity → CHoCH", "Turtle Soup"];
  const needsSweep  = sweepModels.includes(s.model);

  const poiRules: Record<string, string[]> = {
    "Liquidity Sweep → FVG": ["FVG"],
    "OB + BOS":              ["OB"],
    "Liquidity → CHoCH":     ["FVG", "OB"],
    "SMT + OB":              ["OB"],
    "OB + FVG":              ["OB+FVG"],
    "Turtle Soup":           ["FVG", "OB"],
    "BOS + retrace":         ["FVG", "OB"],
  };
  const requiredPOI = poiRules[s.model] ?? [];
  const poiOk =
    requiredPOI.length === 0 ||
    requiredPOI.includes(s.poi) ||
    (requiredPOI.includes("FVG") && s.poi === "OB+FVG") ||
    (requiredPOI.includes("OB")  && s.poi === "OB+FVG") ||
    (requiredPOI.includes("OB+FVG") && s.poi === "OB+FVG");

  // Rulebook order, so the Validator lists checks in the same sequence a member
  // reads them on /rules.
  return [
    ruleHtf(s, "Trade direction opposes HTF bias. You are fighting the trend."),
    ruleHtfDraw(s, "draw on liquidity"),
    rulePremiumDiscount(s),
    {
      id: "liquidity", label: "Liquidity pool swept",
      status: needsSweep ? (s.liqSwept ? "pass" : "fail") : (s.liqSwept ? "pass" : "warn"),
      why: needsSweep
        ? s.liqSwept
          ? "Liquidity has been taken. Smart money has hunted stops, so the reversal condition is met."
          : `${s.model} requires a liquidity sweep before entry. No sweep = no trade.`
        : s.liqSwept
          ? "Liquidity taken, which adds confluence even though this model does not strictly require it."
          : "Sweep not confirmed. Not required for this model, but extra confluence would strengthen the setup.",
    },
    {
      id: "structure", label: "Market structure confirmed (BOS / CHoCH)",
      status: structureOk ? (chochOnly ? "warn" : "pass") : "fail",
      why: !structureOk
        ? "No BOS or CHoCH confirmed. There is no structural permission to trade this direction yet."
        : chochOnly
          ? "CHoCH only: structure has shifted but no BOS yet. Proceed with reduced size."
          : "Break of Structure confirmed. You have structural permission.",
    },
    {
      id: "poi", label: "POI matches model requirements",
      status: poiOk ? "pass" : "fail",
      why: poiOk
        ? `${s.poi} is a valid entry zone for ${s.model}.`
        : `${s.model} requires ${requiredPOI.join(" or ")} as the entry POI. Your selected POI (${s.poi}) does not match.`,
    },
    ruleRetrace(s, "POI"),
    ruleStopPlacement(s, "the swept liquidity level or the OB extreme"),
    ruleRR(s),
    ruleRiskSize(s),
    ruleKillzone(s, "Institutional activity is at its highest."),
    rulePrePlanned(s, "marked this setup"),
    ruleNewsCheck(s),
    ruleFibConfluence(s),
  ];
}

/**
 * Model-specific checks that are not rulebook rules.
 *
 * Both used to sit in the rule array and count toward the score, which is why
 * the Validator returned 8 or 9 "rules" depending on the model while the
 * rulebook has 13, and why neither could link to a rule that explains it.
 * They are advice about a chosen model, not a standard every setup is held to.
 */
export function subChecksSMC(s: Setup): RuleResult[] {
  const checks: RuleResult[] = [];

  if (s.model === "SMT + OB") {
    checks.push({
      id: "smt", label: "SMT divergence confirmed",
      status: s.smtDiv ? "pass" : "fail",
      why: s.smtDiv
        ? "Correlated pair divergence confirmed. The smart money footprint is visible."
        : "SMT + OB requires divergence between two correlated pairs (e.g. EURUSD vs GBPUSD). Confirm this before entering.",
    });
  }

  const poorFit: [string, string][] = [["Turtle Soup", "Asia"], ["SMT + OB", "Asia"]];
  const sessionWarn = poorFit.find(([m, sess]) => s.model === m && s.session === sess);
  checks.push({
    id: "session-model", label: "Model suits selected session",
    status: sessionWarn ? "warn" : "pass",
    why: sessionWarn
      ? `${s.model} performs best in London or New York. During the Asia session, institutional volume is lower and this pattern is less reliable.`
      : `${s.model} is a reasonable fit for the ${s.session} session.`,
  });

  return checks;
}

// ── SnD rule engine ───────────────────────────────────────────────────────────

export function validateSnD(s: Setup): RuleResult[] {
  const isSupply = s.dir === "short";

  return [
    ruleHtf(s, "Trade direction opposes HTF bias. You are trading against the trend."),
    ruleHtfDraw(s, "HTF magnet"),
    rulePremiumDiscount(s),
    {
      id: "zone-fresh", label: "Zone is fresh (untested)",
      status: s.zoneIsFresh ? "pass" : "fail",
      why: s.zoneIsFresh
        ? "This zone has never been revisited: maximum strength and probability."
        : "Zones lose potency each time they are touched. A retested zone is a weak zone. Do not enter.",
    },
    {
      id: "origin", label: "Strong impulsive origin move",
      status: s.strongOrigin ? "pass" : "fail",
      why: s.strongOrigin
        ? "The zone was created by a strong, fast impulse: a high-quality supply/demand imbalance."
        : "Weak origin moves produce weak zones. The impulse that created this zone was not convincing.",
    },
    {
      id: "correct-side", label: "Approaching from correct side",
      status: s.correctSide ? "pass" : "fail",
      why: s.correctSide
        ? `Price is approaching the ${isSupply ? "supply" : "demand"} zone from the correct direction.`
        : `${isSupply ? "Supply" : "Demand"} zones must be approached from ${isSupply ? "below (price rallying into supply)" : "above (price dropping into demand)"}. Entering from the wrong side is a critical error.`,
    },
    ruleRetrace(s, "zone's proximal edge"),
    ruleStopPlacement(s, "the distal edge of the zone"),
    ruleRR(s),
    ruleRiskSize(s),
    ruleKillzone(s, "Best time to trade S&D zones."),
    rulePrePlanned(s, "marked this zone"),
    ruleNewsCheck(s),
    ruleFibConfluence(s),
  ];
}

/** Model-specific advice, not a rulebook rule. See subChecksSMC. */
export function subChecksSnD(s: Setup): RuleResult[] {
  const poorFitSnD: [string, string][] = [["Drop-Base-Rally (DBR)", "Asia"], ["Rally-Base-Drop (RBD)", "Asia"]];
  const sessionWarn = poorFitSnD.find(([m, sess]) => s.model === m && s.session === sess);
  return [{
    id: "session-model", label: "Setup suits selected session",
    status: sessionWarn ? "warn" : "pass",
    why: sessionWarn
      ? `${s.model} performs best in London or New York where institutional volume drives clean reversals from zones.`
      : `${s.model} is a reasonable fit for the ${s.session} session.`,
  }];
}

// ── Assessment + top-level validate ────────────────────────────────

/**
 * Builds the readiness sentence shown under the verdict.
 *
 * Deliberately not a letter grade. The Validator sees what a trader declares
 * before entry; Gavo sees the closed trade and real broker prices. Two
 * different assessments both emitting A+ to D invited members to read a
 * Validator "B" and a Gavo "A" as a contradiction rather than as a pre-trade
 * check and a post-trade grade. The Validator answers "should I take this?",
 * Gavo answers "how well did I follow the rules?".
 */
function buildVerdict(
  framework: Framework,
  a: Assessment,
  rules: RuleResult[],
  fib: boolean,
  fibLevel: string,
): string {
  const titleOf = (id: string) =>
    ruleById(framework, id)?.title ?? rules.find((r) => r.id === id)?.label ?? id;

  if (a.readiness === "do-not-take") {
    const named = a.blockers.map(titleOf).join(", ");
    return a.blockers.length === 1
      ? `Do not take this. ${named} is an invalidating rule, and it is broken.`
      : `Do not take this. ${a.blockers.length} invalidating rules are broken: ${named}.`;
  }

  if (a.readiness === "caution") {
    if (a.weakness.length > 0) {
      const named = a.weakness.map(titleOf).join(", ");
      // Confluence is worth mentioning but must not clear a rule break: the old
      // engine let a Fibonacci tick promote A to A+, which quietly rewarded
      // confluence over compliance.
      const fibNote = fib ? ` Fibonacci ${fibLevel} confluence helps, but it does not repair this.` : "";
      return `Proceed carefully at reduced size. ${named} is a core rule and it is not met.${fibNote}`;
    }
    return fib
      ? `Nothing invalidating, but more than one caution. Fibonacci ${fibLevel} at the entry adds confidence. Half size.`
      : "Nothing invalidating, but more than one caution. Half size, or wait for a cleaner version of this setup.";
  }

  if (a.clear === a.total) {
    return fib
      ? `All ${a.total} rules clear, with Fibonacci ${fibLevel} confluence at the entry. Execute with full conviction.`
      : `All ${a.total} rules clear. Execute with full conviction.`;
  }
  return `Cleared to trade. ${a.clear} of ${a.total} rules fully met, with nothing invalidating or core broken.`;
}

export function validate(s: Setup): ValidationResult {
  const rules     = s.framework === "SMC" ? validateSMC(s) : validateSnD(s);
  const subChecks = s.framework === "SMC" ? subChecksSMC(s) : subChecksSnD(s);
  const a         = assess(s.framework, rules);

  return {
    rules,
    subChecks,
    readiness: a.readiness,
    clear:     a.clear,
    total:     a.total,
    blockers:  a.blockers,
    weakness:  a.weakness,
    verdict:   buildVerdict(s.framework, a, rules, s.fibConfluence, s.fibLevel),
    // Only a void setup is blocked from the journal. A cautious trade that the
    // trader takes anyway is exactly the trade worth having a record of.
    canLog:    a.readiness !== "do-not-take",
  };
}
