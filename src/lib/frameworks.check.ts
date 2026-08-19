// Behavioural checks for the rule engine. Run with `npm run check:rules`.
//
// Grading logic is the one place in this codebase where a silent regression is
// invisible in the UI and expensive for the user: a setup that should read "do
// not take" quietly reading "cleared" is worse than a crash. These assertions
// pin the tiered behaviour that replaced count-based scoring.

import { BLANK_SETUP, validate, type Setup } from "./frameworks";
import { allRules } from "./rulebook";
import { normaliseReview } from "./gavo/review-shape";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    failures++;
    console.error(`FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/** A setup that satisfies all thirteen SMC rules. */
function perfectSMC(): Setup {
  return {
    ...BLANK_SETUP("SMC"),
    dir: "long", htfBias: "bullish", model: "OB + BOS", poi: "OB",
    pdZone: "discount", rr: "3", riskPct: "0.5", balance: "10000",
    entryPrice: "2400", slPrice: "2390",
    killzone: true, liqSwept: true, bos: true,
    htfDrawAligned: true, cleanRetrace: true, stopBeyondInvalidation: true,
    prePlanned: true, newsChecked: true,
  };
}

function perfectSnD(): Setup {
  return {
    ...BLANK_SETUP("SnD"),
    dir: "long", htfBias: "bullish", model: "Fresh Demand Zone",
    pdZone: "discount", rr: "3", riskPct: "0.5", balance: "10000",
    entryPrice: "2400", slPrice: "2390",
    killzone: true, zoneIsFresh: true, strongOrigin: true, correctSide: true,
    htfDrawAligned: true, cleanRetrace: true, stopBeyondInvalidation: true,
    prePlanned: true, newsChecked: true,
  };
}

// ── Rulebook alignment ───────────────────────────────────────────────────────

for (const fw of ["SMC", "SnD"] as const) {
  check(`${fw} rulebook has 14 rules`, allRules(fw).length === 14, `got ${allRules(fw).length}`);

  const r = validate({ ...BLANK_SETUP(fw) });
  check(`${fw} validator returns 14 rules`, r.rules.length === 14, `got ${r.rules.length}`);

  // Rule 14 (Fibonacci) is optional confluence: unmarked it reports "na", and
  // assess() drops na from the denominator. So the count a trader is measured
  // against stays 13 until they actually claim the confluence — the whole
  // point of it being confluence rather than a requirement.
  check(`${fw} total stays 13 while Fibonacci is unmarked`, r.total === 13, `got ${r.total}`);
  check(`${fw} Fibonacci is na when unmarked`,
    r.rules.find((x) => x.id === "fib")?.status === "na",
    `got ${r.rules.find((x) => x.id === "fib")?.status}`);

  const withFib = validate({ ...BLANK_SETUP(fw), fibConfluence: true });
  check(`${fw} total becomes 14 once Fibonacci is claimed`, withFib.total === 14, `got ${withFib.total}`);
  check(`${fw} Fibonacci never lowers the count`, withFib.total >= r.total,
    `${withFib.total} < ${r.total}`);

  const ids = new Set(allRules(fw).map((x) => x.id));
  const orphans = r.rules.filter((x) => !ids.has(x.id)).map((x) => x.id);
  check(`${fw} every validator rule maps to a rulebook rule`, orphans.length === 0, `orphans: ${orphans.join(", ")}`);

  const order = r.rules.map((x) => x.id).join(",");
  const bookOrder = allRules(fw).map((x) => x.id).join(",");
  check(`${fw} validator lists rules in rulebook order`, order === bookOrder, `${order} vs ${bookOrder}`);
}

// ── The perfect setup clears ──────────────────────────────────────────────────

for (const [label, setup] of [["SMC", perfectSMC()], ["SnD", perfectSnD()]] as const) {
  const r = validate(setup);
  check(`${label} perfect setup is cleared`, r.readiness === "cleared", `${r.readiness}: ${r.verdict}`);
  check(`${label} perfect setup clears all 13`, r.clear === 13,
    `${r.clear}/13 — unmet: ${r.rules.filter((x) => x.status !== "pass").map((x) => `${x.id}=${x.status}`).join(", ")}`);
  check(`${label} perfect setup can be logged`, r.canLog);
}

// ── Invalidating breaks void the setup, however clean the rest ────────────────

const RISKY = validate({ ...perfectSMC(), riskPct: "5" });
check("5% risk is an invalidating break", RISKY.blockers.includes("risk-size"), RISKY.blockers.join(","));
check("5% risk voids the setup", RISKY.readiness === "do-not-take", RISKY.readiness);
check("5% risk blocks logging", !RISKY.canLog);

const THIN_RR = validate({ ...perfectSMC(), rr: "1" });
check("1:1 R:R is an invalidating break", THIN_RR.blockers.includes("rr"), THIN_RR.blockers.join(","));

const BUYING_PREMIUM = validate({ ...perfectSMC(), pdZone: "premium" });
check("buying premium is an invalidating break", BUYING_PREMIUM.blockers.includes("premium-discount"), BUYING_PREMIUM.blockers.join(","));

const SELLING_DISCOUNT = validate({ ...perfectSMC(), dir: "short", htfBias: "bearish", pdZone: "discount", entryPrice: "2400", slPrice: "2410" });
check("selling discount is an invalidating break", SELLING_DISCOUNT.blockers.includes("premium-discount"), SELLING_DISCOUNT.blockers.join(","));

// The specific case count-based scoring got wrong: eleven of thirteen ticked,
// but the two broken rules are the two that decide account survival.
const OLD_ELEVEN_OF_THIRTEEN = validate({ ...perfectSMC(), riskPct: "5", rr: "1" });
check("5% risk at 1:1 is not a near-pass", OLD_ELEVEN_OF_THIRTEEN.readiness === "do-not-take", OLD_ELEVEN_OF_THIRTEEN.readiness);
check("5% risk at 1:1 names both blockers", OLD_ELEVEN_OF_THIRTEEN.blockers.length === 2, OLD_ELEVEN_OF_THIRTEEN.blockers.join(","));

// ── Equilibrium is a caution, not a break ────────────────────────────────────

const EQ = validate({ ...perfectSMC(), pdZone: "equilibrium" });
check("equilibrium entry does not void the setup", EQ.readiness !== "do-not-take", EQ.readiness);
check("equilibrium entry is not counted as fully met", EQ.clear === 12, `${EQ.clear}`);

// ── Core breaks caution rather than void ─────────────────────────────────────

const NO_SWEEP = validate({ ...perfectSMC(), model: "Liquidity Sweep → FVG", poi: "FVG", liqSwept: false });
check("missing a required sweep is a break", NO_SWEEP.readiness !== "cleared", NO_SWEEP.readiness);

const WEAK_ORIGIN = validate({ ...perfectSnD(), strongOrigin: false });
check("weak origin is a core break, not invalidating", WEAK_ORIGIN.weakness.includes("origin"), WEAK_ORIGIN.weakness.join(","));
check("weak origin still allows a logged trade", WEAK_ORIGIN.canLog);

// ── Stop on the wrong side of entry fails on arithmetic alone ────────────────

const INVERTED_LONG = validate({ ...perfectSMC(), entryPrice: "2400", slPrice: "2410" });
check("long with SL above entry fails stop placement",
  INVERTED_LONG.rules.find((x) => x.id === "stop-placement")?.status === "fail",
  INVERTED_LONG.rules.find((x) => x.id === "stop-placement")?.status);

const INVERTED_SHORT = validate({ ...perfectSMC(), dir: "short", htfBias: "bearish", pdZone: "premium", entryPrice: "2400", slPrice: "2390" });
check("short with SL below entry fails stop placement",
  INVERTED_SHORT.rules.find((x) => x.id === "stop-placement")?.status === "fail",
  INVERTED_SHORT.rules.find((x) => x.id === "stop-placement")?.status);

// A declared stop cannot override the arithmetic.
check("declaring a stop valid does not override wrong-side arithmetic",
  validate({ ...perfectSMC(), entryPrice: "2400", slPrice: "2410", stopBeyondInvalidation: true })
    .rules.find((x) => x.id === "stop-placement")?.status === "fail");

// ── Sub-checks stay out of the assessment ────────────────────────────────────

const SMT_MODEL = validate({ ...perfectSMC(), model: "SMT + OB", poi: "OB", smtDiv: false });
check("SMT sub-check does not enter the rule list", !SMT_MODEL.rules.some((x) => x.id === "smt"));
check("SMT sub-check is reported separately", SMT_MODEL.subChecks.some((x) => x.id === "smt"));
check("a failed sub-check does not void the setup", SMT_MODEL.readiness !== "do-not-take", SMT_MODEL.readiness);
check("sub-checks do not change the total", SMT_MODEL.total === 13, `${SMT_MODEL.total}`);

// ── Confluence cannot repair a rule break ───────────────────────────────────

const FIB_OVER_BREAK = validate({ ...perfectSMC(), riskPct: "5", fibConfluence: true });
check("Fibonacci confluence does not clear an invalidating break",
  FIB_OVER_BREAK.readiness === "do-not-take", FIB_OVER_BREAK.readiness);

// ── Review shape: raw model output and legacy stored reviews ─────────────────

const LEGACY = normaliseReview(
  { grade: "B", verdict: "Decent read, sloppy risk.", good: ["Clean sweep entry"], improve: ["Risked too much"], tip: "Halve it." },
  "SMC",
);
check("legacy string feedback still renders", LEGACY.good[0]?.text === "Clean sweep entry", JSON.stringify(LEGACY.good));
check("legacy string feedback cites no rules", LEGACY.good[0]?.rules.length === 0);
check("legacy grade survives", LEGACY.grade === "B", LEGACY.grade);

const CITED = normaliseReview(
  { grade: "C", verdict: "v", good: [{ text: "good", rules: ["htf"] }], improve: [{ text: "bad", rules: ["risk-size", "rr"] }], tip: "t" },
  "SMC",
);
check("cited rule ids are kept", CITED.improve[0]?.rules.join(",") === "risk-size,rr", CITED.improve[0]?.rules.join(","));

// A model asked for slugs will occasionally invent one, and an invented id
// renders as a link to an anchor that does not exist.
const INVENTED = normaliseReview({ good: [{ text: "x", rules: ["htf", "not-a-rule", "moon-phase"] }] }, "SMC");
check("invented rule ids are dropped", INVENTED.good[0]?.rules.join(",") === "htf", INVENTED.good[0]?.rules.join(","));

const CROSS_FRAMEWORK = normaliseReview({ good: [{ text: "x", rules: ["zone-fresh"] }] }, "SMC");
check("ids from the other framework are dropped", CROSS_FRAMEWORK.good[0]?.rules.length === 0,
  CROSS_FRAMEWORK.good[0]?.rules.join(","));

check("duplicate ids are collapsed",
  normaliseReview({ good: [{ text: "x", rules: ["rr", "rr"] }] }, "SMC").good[0]?.rules.length === 1);

// An unrecognised grade falls through the UI's colour lookup to teal, so a D
// would read as a pass.
check("an unknown grade becomes a dash", normaliseReview({ grade: "A++" }, "SMC").grade === "—",
  normaliseReview({ grade: "A++" }, "SMC").grade);
check("junk input does not throw", normaliseReview(null, "SMC").good.length === 0);
check("empty feedback text is dropped", normaliseReview({ good: ["", "  ", "real"] }, "SMC").good.length === 1);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
if (failures > 0) process.exitCode = 1;
