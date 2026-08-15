import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { Alert } from "@/generated/prisma/client";

// ── DB → app mapping ─────────────────────────────────────────────────────────

const SESSION_TO_STORE: Record<string, string> = {
  LONDON: "London", NEW_YORK: "New York", ASIA: "Asia",
};

type AlertStatusApp = "active" | "tp1" | "tp2" | "sl" | "cancelled" | "closed";

const STATUS_TO_APP: Record<string, AlertStatusApp> = {
  ACTIVE:    "active",
  TP1:       "tp1",
  TP2:       "tp2",
  SL:        "sl",
  CANCELLED: "cancelled",
  CLOSED:    "closed",
};

function formatPrice(n: number): string {
  if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 10)   return n.toFixed(2);
  return n.toFixed(4);
}

export function dbToApi(a: Alert) {
  return {
    id:         a.id,
    pair:       a.pair,
    dir:        a.direction.toLowerCase() as "long" | "short",
    model:      a.model,
    session:    a.session ? SESSION_TO_STORE[a.session] : "London",
    rr:         a.rr,
    entry:      formatPrice(a.entryPrice),
    sl:         formatPrice(a.stopLoss),
    tp1:        formatPrice(a.tp1),
    tp2:        a.tp2 != null ? formatPrice(a.tp2) : undefined,
    tags:       a.tags,
    note:       a.note ?? "",
    status:     STATUS_TO_APP[a.status],
    timePosted: a.postedAt.toISOString(),
    authorId:   a.authorId,
    reactions:  a.reactions,
    taken:      a.taken,
  };
}

// FREE plan sees instructor alerts on a 4-hour delay; paid plans and the
// instructor see them immediately.
const FREE_ALERT_DELAY_MS = 4 * 60 * 60 * 1000;

/**
 * Instructor alerts visible to the current user, newest first.
 *
 * Server-only, and shared by (app)/alerts/page.tsx's prefetch and
 * /api/alerts. Keeping one implementation matters more here than elsewhere:
 * the plan gate below is a paid-feature boundary, and two copies of it are
 * two chances to leak early alerts to FREE users.
 */
export async function loadInstructorAlerts() {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);

  let isFreePlan = true;
  if (user) {
    const dbUser = await prisma.user
      .findUnique({ where: { supabaseId: user.id }, select: { plan: true, role: true } })
      .catch(() => null);
    if (dbUser && (dbUser.plan !== "FREE" || dbUser.role === "INSTRUCTOR")) {
      isFreePlan = false;
    }
  }

  const where = isFreePlan
    ? { postedAt: { lte: new Date(Date.now() - FREE_ALERT_DELAY_MS) } }
    : undefined;

  const alerts = await prisma.alert.findMany({ where, orderBy: { postedAt: "desc" } });
  return alerts.map(dbToApi);
}
