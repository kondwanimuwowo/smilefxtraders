// Server-side notification creation + fan-out. Creation is internal-only —
// there is no public POST endpoint; event sites call these helpers directly.

import { Prisma, type NotificationType, type PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Accepts any Prisma client because webhooks/lenco deliberately uses its own
// getDb() instance instead of the shared singleton (env-timing workaround).
type Db = PrismaClient | Prisma.TransactionClient;

export interface NotificationInput {
  type:       NotificationType;
  title:      string;
  body:       string;
  icon?:      string;               // material symbol name
  tone?:      "teal" | "gold" | "coral";
  href?:      string;               // deep link
  dedupeKey?: string;               // idempotency — unique per user
  visibleAt?: Date;                 // delayed delivery (FREE 4h alert gate)
}

/**
 * Create one notification. Returns false if a row with the same
 * (userId, dedupeKey) already exists — callers use this as the idempotency
 * gate for a paired email ("only send if the notification was new").
 */
export async function createNotification(
  userId: string,
  n: NotificationInput,
  db: Db = prisma,
): Promise<boolean> {
  try {
    await db.notification.create({
      data: {
        userId,
        type:      n.type,
        title:     n.title,
        body:      n.body,
        icon:      n.icon ?? "notifications_active",
        tone:      n.tone ?? "teal",
        href:      n.href,
        dedupeKey: n.dedupeKey,
        visibleAt: n.visibleAt ?? new Date(),
      },
    });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return false; // dedupeKey already exists — already notified
    }
    console.error("[notifications] create failed:", e instanceof Error ? e.message : e);
    return false;
  }
}

const FANOUT_CHUNK = 1000;

/** Fan out one notification to many users. Returns the number created. */
export async function createNotifications(
  userIds: string[],
  n: NotificationInput,
  db: Db = prisma,
): Promise<number> {
  let created = 0;
  for (let i = 0; i < userIds.length; i += FANOUT_CHUNK) {
    const chunk = userIds.slice(i, i + FANOUT_CHUNK);
    try {
      const res = await db.notification.createMany({
        data: chunk.map((userId) => ({
          userId,
          type:      n.type,
          title:     n.title,
          body:      n.body,
          icon:      n.icon ?? "notifications_active",
          tone:      n.tone ?? "teal",
          href:      n.href,
          dedupeKey: n.dedupeKey,
          visibleAt: n.visibleAt ?? new Date(),
        })),
        skipDuplicates: true,
      });
      created += res.count;
    } catch (e) {
      console.error("[notifications] fan-out chunk failed:", e instanceof Error ? e.message : e);
    }
  }
  return created;
}
