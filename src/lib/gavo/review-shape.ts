// The shape of a Gavo review, and the one place raw model output is trusted.
//
// Gavo cites rules in prose ("according to rule 7"), which was useless to a
// member who had no way to look rule 7 up. Each point now carries the rule ids
// it refers to so the UI can link straight to them. Prose alone put the burden
// of resolving the reference on the reader.

// Relative rather than aliased, matching rulebook.ts and frameworks.ts: these
// modules are also loaded by the check runner, whose resolver does not know the
// "@/" alias.
import { allRules } from "../rulebook";
import type { Framework } from "../frameworks";

/** One bullet of feedback, plus the rules it is about. */
export interface ReviewPoint {
  text:  string;
  /** Rulebook ids, already validated to exist in this framework. */
  rules: string[];
}

export interface AIReviewResult {
  grade:   string;
  verdict: string;
  good:    ReviewPoint[];
  improve: ReviewPoint[];
  tip:     string;
}

const GRADES = ["A+", "A", "B", "C", "D"];

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * Coerces one feedback item.
 *
 * Accepts both shapes on purpose. Reviews written before rule ids existed are
 * stored as plain strings in `Trade.aiReview`, and re-running a review to
 * upgrade the shape is a paid API call — so old reviews keep rendering, just
 * without chips.
 */
function toPoint(raw: unknown, valid: Set<string>): ReviewPoint | null {
  if (typeof raw === "string") {
    const text = raw.trim();
    return text ? { text, rules: [] } : null;
  }
  if (!raw || typeof raw !== "object") return null;

  const obj  = raw as Record<string, unknown>;
  const text = asString(obj.text);
  if (!text) return null;

  // Only ids that exist in this framework's rulebook survive. A model asked for
  // slugs will occasionally invent one, and an invented id renders as a link to
  // an anchor that isn't there — a dead end worse than no link at all.
  const rules = Array.isArray(obj.rules)
    ? obj.rules.map(asString).filter((id) => valid.has(id))
    : [];

  return { text, rules: [...new Set(rules)] };
}

/**
 * Normalises raw model JSON into a review safe to store and render.
 *
 * The route used to return `JSON.parse(match[0])` straight to the client and
 * into the database, so any shape the model produced became persisted state.
 */
export function normaliseReview(raw: unknown, framework: Framework): AIReviewResult {
  const valid = new Set(allRules(framework).map((r) => r.id));
  const obj   = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const points = (v: unknown): ReviewPoint[] =>
    (Array.isArray(v) ? v : []).map((x) => toPoint(x, valid)).filter((p): p is ReviewPoint => p !== null);

  const grade = asString(obj.grade);

  return {
    // An unrecognised grade would break the colour lookups downstream, which
    // silently fall back to teal — i.e. a D could read as a pass.
    grade:   GRADES.includes(grade) ? grade : "—",
    verdict: asString(obj.verdict),
    good:    points(obj.good),
    improve: points(obj.improve),
    tip:     asString(obj.tip),
  };
}
