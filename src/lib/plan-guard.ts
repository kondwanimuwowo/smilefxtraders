import { NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
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
  const access = await checkPaidPlan();
  if (access.allowed) return null;

  if (access.reason === "unauthenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    { error: `${feature} requires an Edge or Pro plan.`, upgrade: true },
    { status: 403 },
  );
}

export type PaidPlanAccess =
  | { allowed: true }
  | { allowed: false; reason: "unauthenticated" | "free" };

/**
 * The same check as requirePaidPlan, expressed as a plain result instead of
 * an HTTP response.
 *
 * requirePaidPlan can only speak in NextResponse, which is right for a route
 * and useless anywhere else: a server component that wanted to know whether
 * to render the lock screen had to make an HTTP request to its own API to
 * find out. This is the shared decision; requirePaidPlan is now a thin
 * translation of it into status codes.
 *
 * Fails *open* on a missing row or a DB error, deliberately and unchanged
 * from the original: blocking every paying user during a transient database
 * hiccup is worse than letting an edge-case request through.
 */
export async function checkPaidPlan(): Promise<PaidPlanAccess> {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return { allowed: false, reason: "unauthenticated" };

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { plan: true },
  }).catch(() => null);

  if (dbUser?.plan === "FREE") return { allowed: false, reason: "free" };
  return { allowed: true };
}
