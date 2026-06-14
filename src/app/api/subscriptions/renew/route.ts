/**
 * POST /api/subscriptions/renew
 *
 * Expires overdue subscriptions and downgrades the associated user plan to FREE.
 * Lenco initiates re-billing — when the next payment clears, the webhook
 * reactivates the subscription and upgrades the plan automatically.
 *
 * Run daily via cron (e.g. 02:00 UTC).
 * Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth   = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all active subscriptions whose renewal date has passed
  const overdue = await prisma.subscription.findMany({
    where: {
      status:   "ACTIVE",
      renewsAt: { lt: now },
    },
    select: {
      id:     true,
      userId: true,
      plan:   true,
    },
  });

  if (overdue.length === 0) {
    return NextResponse.json({ expired: 0, message: "No overdue subscriptions." });
  }

  // Expire each subscription and downgrade the user plan in a single transaction
  const results: { userId: string; plan: string }[] = [];

  for (const sub of overdue) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data:  { status: "EXPIRED" },
      }),
      prisma.user.update({
        where: { id: sub.userId },
        data:  { plan: "FREE" },
      }),
    ]);

    results.push({ userId: sub.userId, plan: sub.plan });
    console.info(`[subscriptions/renew] expired: userId=${sub.userId} was=${sub.plan}`);
  }

  return NextResponse.json({
    expired: results.length,
    users:   results,
  });
}
