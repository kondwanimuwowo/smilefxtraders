// Shape of Gavo's pre-trade read, and the guard that validates it.
//
// Deliberately NOT a grade. The Validator reports readiness -- cleared,
// caution, do-not-take -- and Gavo grades closed trades A+ to D. Those two
// vocabularies were separated on purpose, because they disagree by design:
// one sees what a trader declares before entry, the other sees what price
// actually did. Handing Gavo a second verdict on the same setup would put two
// judgements on one screen with no way to reconcile them.
//
// So this adds the layer a checklist cannot: what the combination of breaks
// means, which one actually matters, and what to watch. The Validator rules;
// Gavo explains.

import { allRules } from "../rulebook";
import type { Framework } from "../frameworks";

export interface SetupRead {
  /** The read in prose. One short paragraph. */
  read: string;
  /** Concrete things to watch before or after entry. */
  watch: string[];
  /** Rule ids the read leans on, for linking. Validated against the rulebook. */
  rules: string[];
}

export const EMPTY_SETUP_READ: SetupRead = { read: "", watch: [], rules: [] };

/**
 * Validates a model response into a SetupRead.
 *
 * Same reasoning as normaliseReview: the model is asked for JSON, so it will
 * usually produce JSON, and "usually" is not a contract. An invented rule id
 * becomes a link to an anchor that does not exist, and a missing field becomes
 * a crash in the panel.
 */
export function normaliseSetupRead(raw: unknown, framework: Framework): SetupRead {
  if (!raw || typeof raw !== "object") return EMPTY_SETUP_READ;
  const o = raw as Record<string, unknown>;

  const valid = new Set(allRules(framework).map((r) => r.id));

  const read = typeof o.read === "string" ? o.read.trim() : "";

  const watch = Array.isArray(o.watch)
    ? o.watch.filter((w): w is string => typeof w === "string" && w.trim().length > 0)
        .map((w) => w.trim())
        .slice(0, 4)
    : [];

  // Ids from the other framework are dropped too, not just invented ones --
  // SMC and SnD share some ids and mean different things by them.
  const rules = Array.isArray(o.rules)
    ? [...new Set(o.rules.filter((r): r is string => typeof r === "string" && valid.has(r)))]
    : [];

  return { read, watch, rules };
}
