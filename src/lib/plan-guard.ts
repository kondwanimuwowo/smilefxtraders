import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * API-route guard for paid features (the proxy leaves /api public, so every
 * route enforces its own access). Returns an error response to send back, or
 * null when the caller may proceed.
 *
 * Unauthenticated → 401. Known-FREE plan → 403 with `upgrade: true` (the
 * shape CotReports' lock screen expects). A missing DB record or a DB error
 * fails open — blocking every paid user on a transient DB hiccup is worse
 * than letting an edge-case request through.
 */
export async function requirePaidPlan(feature: string): Promise<NextResponse | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { plan: true },
  }).catch(() => null);

  if (dbUser?.plan === "FREE") {
    return NextResponse.json(
      { error: `${feature} requires an Edge or Pro plan.`, upgrade: true },
      { status: 403 },
    );
  }

  return null;
}
