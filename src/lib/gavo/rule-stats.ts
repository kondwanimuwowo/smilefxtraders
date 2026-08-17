// Each rule's record against a member's own reviewed trades.
//
// Turns the rulebook from a document into a mirror: "you have been pulled up on
// this in 6 of your last 20 reviews" is a different read of rule 10 than the
// rule text alone. No schema change needed for it -- Gavo's reviews already
// store the rule ids each point cites, so the history is sitting in
// Trade.aiReview waiting to be counted.

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { normaliseReview } from "@/lib/gavo/review-shape";
import type { Framework } from "@/lib/frameworks";

/** How many recent reviewed trades to look back over. */
const WINDOW = 30;

export interface RuleStat {
  /** Reviews in the window where Gavo listed this rule under "improve". */
  flagged: number;
  /** Reviews where Gavo listed it under "good". */
  praised: number;
}

export interface RuleStats {
  /** Reviewed trades found in the window. Zero means show nothing. */
  reviewed: number;
  byRule:   Record<string, RuleStat>;
}

export const EMPTY_RULE_STATS: RuleStats = { reviewed: 0, byRule: {} };

/**
 * Counts rule citations across a member's recent reviews for one framework.
 *
 * Split by framework because the same id can carry different weight and
 * meaning between the two books, and mixing them would produce a number that
 * describes neither.
 *
 * Fails soft: this decorates the rulebook, and a stats query that throws must
 * not take down the page whose actual job is showing the rules.
 */
export async function loadRuleStats(userId: string, framework: Framework): Promise<RuleStats> {
  try {
    const trades = await prisma.trade.findMany({
      // Prisma.DbNull, not null: on a nullable Json column a bare null is
      // ambiguous between "SQL NULL" and "the JSON value null", so the client
      // rejects it outright.
      where:   { userId, framework, NOT: { aiReview: { equals: Prisma.DbNull } } },
      orderBy: { createdAt: "desc" },
      take:    WINDOW,
      select:  { aiReview: true },
    });

    const byRule: Record<string, RuleStat> = {};
    const bump = (id: string, key: keyof RuleStat) => {
      byRule[id] ??= { flagged: 0, praised: 0 };
      byRule[id][key]++;
    };

    for (const trade of trades) {
      // Normalised rather than trusted: older reviews hold plain strings, and
      // ids are re-validated against this framework's rulebook here too.
      const review = normaliseReview(trade.aiReview, framework);
      // A rule cited twice in one review still counts once — this is "how many
      // reviews mentioned it", not "how many sentences did".
      for (const id of new Set(review.improve.flatMap((p) => p.rules))) bump(id, "flagged");
      for (const id of new Set(review.good.flatMap((p) => p.rules)))    bump(id, "praised");
    }

    return { reviewed: trades.length, byRule };
  } catch (err) {
    console.error("[rule-stats]", err);
    return EMPTY_RULE_STATS;
  }
}
