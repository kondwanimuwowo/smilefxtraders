import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import crypto from "crypto";

interface HyperdriveBinding { connectionString: string }

// See src/lib/prisma.ts for why this routes through Hyperdrive on Workers.
function resolveConnectionString(): string {
  try {
    const ctx = getCloudflareContext() as unknown as { env: Record<string, unknown> };
    const hyperdrive = ctx.env.HYPERDRIVE as HyperdriveBinding | undefined;
    if (hyperdrive?.connectionString) return hyperdrive.connectionString;
  } catch {
    // Not running inside a Workers request context — fall through.
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}
import { addMonths } from "@/lib/date";
import { createNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";
import { paymentConfirmedEmail, paymentFailedEmail } from "@/lib/email/templates/billing";

// Lazy singleton, evaluated on first property access rather than at module
// load. Using the shared @/lib/prisma singleton directly caused "Cannot read
// properties of undefined" errors in this route because it was evaluated
// before env vars were ready; eagerly constructing a client here instead
// broke Next's build-time page-data collection (and any environment that
// doesn't have DATABASE_URL set until runtime, e.g. CI), since DATABASE_URL
// isn't read until something actually queries the database.
function createDb() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: resolveConnectionString() }) });
}

const globalForDb = globalThis as unknown as { webhookDb?: PrismaClient };
function getDb() {
  if (!globalForDb.webhookDb) globalForDb.webhookDb = createDb();
  return globalForDb.webhookDb;
}

const db = new Proxy({} as PrismaClient, {
  get: (_, prop) => (getDb() as any)[prop],
});

// ── Webhook body shape from Lenco ────────────────────────────────────────────

interface LencoWebhookPayload {
  event?:     string;  // e.g. "collection.successful" | "collection.failed"
  status?:    string;  // some payloads carry status at the top level
  reference?: string;
  data?: {
    id?:             string;
    reference?:      string;
    lencoReference?: string;
    amount?:         string;
    currency?:       string;
    status?:         string;
    type?:           string;
  };
}

// Disable body parsing for raw HMAC verification
export const dynamic = "force-dynamic";

function fmtAmount(amountCents: number, currency: string): string {
  const units = amountCents / 100;
  const n = Number.isInteger(units) ? String(units) : units.toFixed(2);
  return currency === "ZMW" ? `K${n}` : `$${n}`;
}

// ── POST /api/webhooks/lenco ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-lenco-signature") ?? "";
  const secret    = process.env.LENCO_WEBHOOK_SECRET ?? "";

  // Verify HMAC-SHA256 signature if secret is configured
  if (secret) {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    let valid = false;
    try {
      valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      valid = false; // length mismatch throws
    }
    if (!valid) {
      console.warn("[lenco webhook] invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  let payload: LencoWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Normalise across payload shapes: event name ("collection.successful")
  // or bare status ("successful" | "failed" | "declined" | "expired").
  const status =
    payload.event?.split(".")[1] ??
    payload.status ??
    payload.data?.status ??
    "";
  const reference = payload.data?.reference ?? payload.reference ?? "";

  if (!reference) {
    return NextResponse.json({ received: true });
  }

  const sub = await db.subscription.findFirst({
    where: { lencoReference: reference },
    include: { user: true },
  });

  if (!sub) {
    return NextResponse.json({ received: true });
  }

  if (status === "successful") {
    const now      = new Date();
    const renewsAt = addMonths(now, sub.billingCycle === "annual" ? 12 : 1);

    // Idempotent activation: the updateMany guard means only ONE caller
    // (this webhook or /api/checkout/verify) performs the transition — the
    // loser sees count 0 and sends nothing.
    const activated = await db.$transaction(async (tx) => {
      const r = await tx.subscription.updateMany({
        where: { id: sub.id, status: { not: "ACTIVE" } },
        data:  { status: "ACTIVE", startedAt: now, renewsAt },
      });
      if (r.count === 0) return false;
      await tx.user.update({
        where: { id: sub.userId },
        data:  { plan: sub.plan, planExpiresAt: null },
      });
      return true;
    });

    if (activated) {
      console.info(`[lenco webhook] plan activated: userId=${sub.userId} plan=${sub.plan}`);
      void notifyPaymentConfirmed(sub, renewsAt).catch((e) =>
        console.error("[lenco webhook] notify failed:", e instanceof Error ? e.message : e)
      );
    }
  } else if (status === "failed" || status === "declined" || status === "expired") {
    // Payment failed — expire the pending subscription; never touch the plan.
    const r = await db.subscription.updateMany({
      where: { id: sub.id, status: "PENDING" },
      data:  { status: "EXPIRED" },
    });
    if (r.count > 0) {
      void notifyPaymentFailed(sub).catch((e) =>
        console.error("[lenco webhook] notify failed:", e instanceof Error ? e.message : e)
      );
    }
  }

  // Respond immediately — sends above are fire-and-forget
  return NextResponse.json({ received: true });
}

// ── Notifications + emails (best-effort, never block the ACK) ────────────────

type SubWithUser = NonNullable<Awaited<ReturnType<typeof db.subscription.findFirst<{ include: { user: true } }>>>>;

async function notifyPaymentConfirmed(sub: SubWithUser, renewsAt: Date) {
  const created = await createNotification(sub.userId, {
    type:      "PAYMENT_CONFIRMED",
    title:     "Payment confirmed",
    body:      `Your ${sub.plan === "PRO" ? "Pro" : "Edge"} plan is now active.`,
    icon:      "workspace_premium",
    tone:      "gold",
    href:      "/settings",
    dedupeKey: `payment-confirmed:${sub.id}:${renewsAt.toISOString()}`,
  }, db);

  if (created) {
    const { subject, html } = paymentConfirmedEmail({
      name:         sub.user.name,
      plan:         sub.plan,
      amount:       fmtAmount(sub.amountCents, sub.currency),
      billingCycle: sub.billingCycle,
      reference:    sub.lencoReference ?? sub.id,
      renewsAt,
    });
    await sendEmail({ from: "hello", to: sub.user.email, subject, html });
  }
}

async function notifyPaymentFailed(sub: SubWithUser) {
  const created = await createNotification(sub.userId, {
    type:      "PAYMENT_FAILED",
    title:     "Payment didn't go through",
    body:      "No charge was made. You can retry from the pricing page.",
    icon:      "error",
    tone:      "coral",
    href:      "/pricing",
    dedupeKey: `payment-failed:${sub.id}`,
  }, db);

  if (created) {
    const { subject, html } = paymentFailedEmail({ name: sub.user.name, plan: sub.plan });
    await sendEmail({ from: "hello", to: sub.user.email, subject, html });
  }
}
