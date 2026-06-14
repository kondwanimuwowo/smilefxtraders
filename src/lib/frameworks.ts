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
    "Fresh Demand Zone":      { need: ["Zone untested", "Strong impulse origin", "In discount"],          tip: "A fresh demand zone has never been revisited. Price must have left with a strong, impulsive move — weak origin = weak zone." },
    "Fresh Supply Zone":      { need: ["Zone untested", "Strong impulse origin", "In premium"],           tip: "A fresh supply zone has never been revisited. Look for a strong, fast impulsive move that created the zone." },
    "Drop-Base-Rally (DBR)":  { need: ["Drop identified", "Base formed", "Rally from base"],              tip: "Price drops sharply, consolidates (base), then rallies through. Enter on the return to the base." },
    "Rally-Base-Drop (RBD)":  { need: ["Rally identified", "Base formed", "Drop from base"],              tip: "Price rallies sharply, consolidates (base), then drops through. Enter on the return to the base." },
    "Drop-Base-Drop (DBD)":   { need: ["Zone on drop", "Base consolidation", "Continuation drop"],       tip: "Bearish continuation — price drops, bases, then continues dropping. Enter on the return to the base." },
    "Rally-Base-Rally (RBR)": { need: ["Zone on rally", "Base consolidation", "Continuation rally"],     tip: "Bullish continuation — price rallies, bases, then continues rallying. Enter on the return to the base." },
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
    "Drop-Base-Rally (DBR)":  "Price drops, consolidates (base), then rallies — entry on the return to base.",
    "Rally-Base-Drop (RBD)":  "Price rallies, consolidates (base), then drops — entry on the return to base.",
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
  inPremiumDiscount: boolean;
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
    liqSwept:          false,
    bos:               false,
    choch:             false,
    smtDiv:            false,
    zoneIsFresh:       false,
    strongOrigin:      false,
    correctSide:       false,
    inPremiumDiscount: false,
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
  rules:   RuleResult[];
  grade:   "A+" | "A" | "B" | "C" | "D";
  score:   number;
  verdict: string;
  canLog:  boolean;
}

// ── SMC rule engine ───────────────────────────────────────────────────────────

export function validateSMC(s: Setup): RuleResult[] {
  const rules: RuleResult[] = [];

  // 1 — HTF bias
  const biasMatch   = (s.dir === "long" && s.htfBias === "bullish") || (s.dir === "short" && s.htfBias === "bearish");
  const biasRanging = s.htfBias === "ranging";
  rules.push({
    id: "htf", label: "HTF bias aligns with direction",
    status: biasRanging ? "warn" : biasMatch ? "pass" : "fail",
    why: biasRanging
      ? "HTF is ranging — directional trades in choppy markets are low-probability."
      : biasMatch
        ? "Trade direction agrees with higher timeframe structure."
        : "Trade direction opposes HTF bias. You are fighting the trend.",
  });

  // 2 — BOS / CHoCH
  const structureOk = s.bos || s.choch;
  const chochOnly   = s.choch && !s.bos;
  rules.push({
    id: "structure", label: "Market structure confirmed (BOS / CHoCH)",
    status: structureOk ? (chochOnly ? "warn" : "pass") : "fail",
    why: !structureOk
      ? "No BOS or CHoCH confirmed. There is no structural permission to trade this direction yet."
      : chochOnly
        ? "CHoCH only — structure has shifted but no BOS yet. Proceed with reduced size."
        : "Break of Structure confirmed. You have structural permission.",
  });

  // 3 — Liquidity swept
  const sweepModels = ["Liquidity Sweep → FVG", "Liquidity → CHoCH", "Turtle Soup"];
  const needsSweep  = sweepModels.includes(s.model);
  rules.push({
    id: "liquidity", label: "Liquidity pool swept",
    status: needsSweep
      ? (s.liqSwept ? "pass" : "fail")
      : (s.liqSwept ? "pass" : "warn"),
    why: needsSweep
      ? s.liqSwept
        ? "Liquidity has been taken. Smart money has hunted stops — reversal condition met."
        : `${s.model} requires a liquidity sweep before entry. No sweep = no trade.`
      : s.liqSwept
        ? "Liquidity taken — adds confluence even though this model does not strictly require it."
        : "Sweep not confirmed. Not required for this model, but extra confluence would strengthen the setup.",
  });

  // 4 — POI matches model
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

  rules.push({
    id: "poi", label: "POI matches model requirements",
    status: poiOk ? "pass" : "fail",
    why: poiOk
      ? `${s.poi} is a valid entry zone for ${s.model}.`
      : `${s.model} requires ${requiredPOI.join(" or ")} as the entry POI. Your selected POI (${s.poi}) does not match.`,
  });

  // 5 — SMT divergence (conditional)
  if (s.model === "SMT + OB") {
    rules.push({
      id: "smt", label: "SMT divergence confirmed",
      status: s.smtDiv ? "pass" : "fail",
      why: s.smtDiv
        ? "Correlated pair divergence confirmed — smart money footprint is visible."
        : "SMT + OB requires divergence between two correlated pairs (e.g. EURUSD vs GBPUSD). Confirm this before entering.",
    });
  }

  // 6 — R:R
  const rrVal = parseFloat(s.rr);
  const hasRR = !isNaN(rrVal) && rrVal > 0;
  rules.push({
    id: "rr", label: "Risk:Reward ≥ 2:1",
    status: !hasRR ? "warn" : rrVal < 2 ? "fail" : rrVal < 3 ? "warn" : "pass",
    why: !hasRR
      ? "Enter your planned R:R to validate. A minimum of 2:1 is required."
      : rrVal < 2
        ? `${rrVal}:1 is below the minimum 2:1. This trade does not pay enough to justify the risk.`
        : rrVal < 3
          ? `${rrVal}:1 meets minimum criteria. A 3:1 or better setup gives you more room to be wrong.`
          : `${rrVal}:1 — excellent reward for the risk taken.`,
  });

  // 7 — Killzone
  const sessionKillzones: Record<string, string> = { London: "0800–1100 UTC", "New York": "1330–1600 UTC", Asia: "0000–0300 UTC" };
  rules.push({
    id: "killzone", label: "Entry within session killzone",
    status: s.killzone ? "pass" : "warn",
    why: s.killzone
      ? `Inside the ${s.session} killzone (${sessionKillzones[s.session] ?? "active window"}). Institutional activity is at its highest.`
      : "Outside the killzone. Liquidity is thinner and moves are less reliable. Consider waiting for the window.",
  });

  // 8 — Session-model fit
  const poorFit: [string, string][] = [["Turtle Soup", "Asia"], ["SMT + OB", "Asia"]];
  const sessionWarn = poorFit.find(([m, sess]) => s.model === m && s.session === sess);
  rules.push({
    id: "session-model", label: "Model suits selected session",
    status: sessionWarn ? "warn" : "pass",
    why: sessionWarn
      ? `${s.model} performs best in London or New York. During the Asia session, institutional volume is lower and this pattern is less reliable.`
      : `${s.model} is a reasonable fit for the ${s.session} session.`,
  });

  return rules;
}

// ── SnD rule engine ───────────────────────────────────────────────────────────

export function validateSnD(s: Setup): RuleResult[] {
  const rules: RuleResult[] = [];
  const isSupply = s.dir === "short";

  // 1 — HTF bias
  const biasMatch   = (s.dir === "long" && s.htfBias === "bullish") || (s.dir === "short" && s.htfBias === "bearish");
  const biasRanging = s.htfBias === "ranging";
  rules.push({
    id: "htf", label: "HTF bias aligns with direction",
    status: biasRanging ? "warn" : biasMatch ? "pass" : "fail",
    why: biasRanging
      ? "HTF is ranging — directional trades in choppy markets are low-probability."
      : biasMatch
        ? "Trade direction agrees with higher timeframe structure."
        : "Trade direction opposes HTF bias. You are trading against the trend.",
  });

  // 2 — Zone fresh/untested
  rules.push({
    id: "zone-fresh", label: "Zone is fresh (untested)",
    status: s.zoneIsFresh ? "pass" : "fail",
    why: s.zoneIsFresh
      ? "This zone has never been revisited — maximum strength and probability."
      : "Zones lose potency each time they are touched. A retested zone is a weak zone. Do not enter.",
  });

  // 3 — Strong impulsive origin
  rules.push({
    id: "origin", label: "Strong impulsive origin move",
    status: s.strongOrigin ? "pass" : "fail",
    why: s.strongOrigin
      ? "The zone was created by a strong, fast impulse — high-quality supply/demand imbalance."
      : "Weak origin moves produce weak zones. The impulse that created this zone was not convincing.",
  });

  // 4 — Correct side approach
  rules.push({
    id: "correct-side", label: "Approaching from correct side",
    status: s.correctSide ? "pass" : "fail",
    why: s.correctSide
      ? `Price is approaching the ${isSupply ? "supply" : "demand"} zone from the correct direction.`
      : `${isSupply ? "Supply" : "Demand"} zones must be approached from ${isSupply ? "below (price rallying into supply)" : "above (price dropping into demand)"}. Verify the approach direction.`,
  });

  // 5 — Premium / discount
  rules.push({
    id: "premium-discount", label: isSupply ? "Zone sits in premium area" : "Zone sits in discount area",
    status: s.inPremiumDiscount ? "pass" : "warn",
    why: s.inPremiumDiscount
      ? `Zone is in ${isSupply ? "premium" : "discount"} — best probability for a ${s.dir}.`
      : `Zone is not clearly in ${isSupply ? "premium" : "discount"}. Near equilibrium reduces the probability edge.`,
  });

  // 6 — R:R
  const rrVal = parseFloat(s.rr);
  const hasRR = !isNaN(rrVal) && rrVal > 0;
  rules.push({
    id: "rr", label: "Risk:Reward ≥ 2:1",
    status: !hasRR ? "warn" : rrVal < 2 ? "fail" : rrVal < 3 ? "warn" : "pass",
    why: !hasRR
      ? "Enter your planned R:R to validate. A minimum of 2:1 is required."
      : rrVal < 2
        ? `${rrVal}:1 is below the minimum 2:1. This trade does not pay enough to justify the risk.`
        : rrVal < 3
          ? `${rrVal}:1 meets minimum criteria. A 3:1 or better setup gives you more room to be wrong.`
          : `${rrVal}:1 — excellent reward for the risk taken.`,
  });

  // 7 — Killzone
  const sessionKillzones: Record<string, string> = { London: "0800–1100 UTC", "New York": "1330–1600 UTC", Asia: "0000–0300 UTC" };
  rules.push({
    id: "killzone", label: "Entry within session killzone",
    status: s.killzone ? "pass" : "warn",
    why: s.killzone
      ? `Inside the ${s.session} killzone (${sessionKillzones[s.session] ?? "active window"}). Best time to trade S&D zones.`
      : "Outside the killzone. Liquidity is thinner. Wait for a high-probability session window.",
  });

  // 8 — Session-model fit
  const poorFitSnD: [string, string][] = [["Drop-Base-Rally (DBR)", "Asia"], ["Rally-Base-Drop (RBD)", "Asia"]];
  const sessionWarn = poorFitSnD.find(([m, sess]) => s.model === m && s.session === sess);
  rules.push({
    id: "session-model", label: "Setup suits selected session",
    status: sessionWarn ? "warn" : "pass",
    why: sessionWarn
      ? `${s.model} performs best in London or New York where institutional volume drives clean reversals from zones.`
      : `${s.model} is a reasonable fit for the ${s.session} session.`,
  });

  return rules;
}

// ── Grading + top-level validate ──────────────────────────────────────────────

function gradeRules(rules: RuleResult[], framework: Framework, fib: boolean, fibLevel: string): ValidationResult {
  const fails  = rules.filter((r) => r.status === "fail").length;
  const warns  = rules.filter((r) => r.status === "warn").length;
  const passes = rules.filter((r) => r.status === "pass").length;
  const total  = rules.length;
  const score  = Math.round((passes / total) * 100);

  let g: ValidationResult["grade"];
  if (fails === 0 && warns === 0) g = "A+";
  else if (fails === 0 && warns <= 1) g = "A";
  else if (fails <= 1) g = "B";
  else if (fails === 2) g = "C";
  else g = "D";

  // Fibonacci at a key level with no fails: A (one warn) → A+
  const fibBoosted = fib && fails === 0 && g === "A";
  if (fibBoosted) g = "A+";

  function buildVerdict(): string {
    if (g === "A+") {
      if (fibBoosted)
        return `One caution, but Fibonacci ${fibLevel} confluence at the POI compensates. Execute with full conviction.`;
      if (fib)
        return framework === "SMC"
          ? `Textbook setup. Fibonacci ${fibLevel} at the POI — maximum confluence. Execute with full conviction.`
          : `Textbook zone. Fibonacci ${fibLevel} confirms the level — maximum confluence. Execute with full conviction.`;
      return framework === "SMC"
        ? "Textbook setup — all criteria met. Execute with full conviction."
        : "Textbook zone setup — all criteria met. Execute with full conviction.";
    }
    if (g === "A")
      return framework === "SMC"
        ? "Strong setup with a minor caution. Execute at standard size."
        : "Strong zone with a minor caution. Execute at standard size.";
    if (g === "B")
      return fib
        ? `One rule flagged. Fibonacci ${fibLevel} adds partial confidence — proceed with half size only.`
        : "Proceed carefully — one rule flagged. Consider halving your risk.";
    if (g === "C")
      return "High-risk entry. Resolve the failed rules before pressing the button.";
    return framework === "SMC"
      ? "Do not enter. This setup violates core SMC principles. Step away and wait."
      : "Do not enter. This setup violates core Supply & Demand principles. Step away and wait.";
  }

  return { rules, grade: g, score, verdict: buildVerdict(), canLog: fails === 0 };
}

export function validate(s: Setup): ValidationResult {
  const rules = s.framework === "SMC" ? validateSMC(s) : validateSnD(s);
  return gradeRules(rules, s.framework, s.fibConfluence, s.fibLevel);
}
