import { NextResponse } from "next/server";
import { createClient, getAuthState } from "@/lib/supabase/server";
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
 *
 * Auth *unavailable* → 503, which is neither of those. It used to answer 401,
 * so a paying member briefly hitting the refresh-token race (see getAuthState)
 * was shown the upgrade wall for a feature they pay for. 503 is the honest
 * status and the client already retries it, where 403 is treated as a settled
 * answer and deliberately is not retried.
 */
export async function requirePaidPlan(feature: string): Promise<NextResponse | null> {
  const access = await checkPaidPlan();
  if (access.allowed) return null;

  if (access.reason === "unavailable") {
    return NextResponse.json(
      { error: "Could not verify your session. Please try again.", retry: true },
      { status: 503 },
    );
  }
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
  | { allowed: false; reason: "unauthenticated" | "free" | "unavailable" };

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
  const auth = await getAuthState(supabase);

  // Deliberately NOT failing open here, unlike the DB error below. A caller
  // controls their own cookies, so a malformed session can be planted to force
  // "unknown" on purpose — failing open would make that a way past the paid
  // gate. "Ask again" is the only safe answer.
  if (auth.state === "unknown")   return { allowed: false, reason: "unavailable" };
  if (auth.state === "anonymous") return { allowed: false, reason: "unauthenticated" };

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: auth.user.id },
    select: { plan: true },
  }).catch(() => null);

  if (dbUser?.plan === "FREE") return { allowed: false, reason: "free" };
  return { allowed: true };
}
