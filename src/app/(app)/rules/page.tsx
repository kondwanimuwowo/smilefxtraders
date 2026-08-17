import { RulebookView } from "@/components/rulebook/RulebookView";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { loadRuleStats, EMPTY_RULE_STATS, type RuleStats } from "@/lib/gavo/rule-stats";
import type { Framework } from "@/lib/frameworks";

export const metadata = { title: "The Rulebook | Smile FX Traders" };

/**
 * Both frameworks' stats, since the reader can switch books client-side and a
 * second round trip on every toggle would be worse than one query each here.
 *
 * Fails soft as a whole: the rules are the point of the page, and a member
 * with no reviews (or a stats query that struggles) should still get them.
 */
async function loadStats(): Promise<Record<Framework, RuleStats>> {
  const empty = { SMC: EMPTY_RULE_STATS, SnD: EMPTY_RULE_STATS };
  try {
    const supabase = await createClient();
    const user = await getAuthedUser(supabase);
    if (!user) return empty;

    const dbUser = await prisma.user.findUnique({
      where:  { supabaseId: user.id },
      select: { id: true },
    });
    if (!dbUser) return empty;

    const [SMC, SnD] = await Promise.all([
      loadRuleStats(dbUser.id, "SMC"),
      loadRuleStats(dbUser.id, "SnD"),
    ]);
    return { SMC, SnD };
  } catch (err) {
    console.error("[rules]", err);
    return empty;
  }
}

// Available to every signed-in member, Starter included. Grading someone
// against a standard while hiding the standard from them is indefensible, and
// this is the clearest argument the platform has for what it teaches.
export default async function RulesPage() {
  const stats = await loadStats();

  return (
    <div className="view">
      <div className="mb-6">
        <h1 className="font-display font-medium text-[26px] tracking-[-0.025em] text-ink-strong">
          The Rulebook
        </h1>
        <p className="text-[13px] mt-1 max-w-2xl text-ink-dim">
          The standard every setup is measured against, by the Validator before you enter and by
          Gavo after you journal it. Nothing here is hidden from you.
        </p>
      </div>

      <RulebookView stats={stats} />
    </div>
  );
}
