import { NextRequest, NextResponse } from "next/server";
import { createClient, getAuthedUser } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const LENCO_BASE = "https://api.lenco.co/access/v2";
const LENCO_KEY  = process.env.LENCO_API_KEY ?? "";
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.smilefxtraders.com";

// Same amounts as /api/checkout/mobile-money — annual is the full 12-month
// charge, not the discounted monthly-equivalent rate alone.
const PLAN_PRICES: Record<string, Record<string, { zmw: number }>> = {
  edge: {
    monthly: { zmw: 24900 },
    annual:  { zmw: 19900 * 12 },
  },
  pro: {
    monthly: { zmw: 54900 },
    annual:  { zmw: 43900 * 12 },
  },
};

const DB_PLAN: Record<string, "EDGE" | "PRO"> = { edge: "EDGE", pro: "PRO" };

// ── POST /api/checkout/card ──────────────────────────────────────────────────
// Creates a Lenco hosted card-collection session and returns its checkout
// URL, which the client opens in a popup window. Reuses the same
// Subscription + /api/checkout/verify + Lenco webhook flow as mobile money.
//
// NOTE: the exact `/collections/card` path and response field names below
// follow the same convention as the working mobile-money integration, but
// haven't been confirmed against Lenco's card-collection docs/dashboard —
// verify before relying on this in production.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const user = await getAuthedUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json() as { plan: "edge" | "pro"; cycle: "monthly" | "annual" };
  const prices = PLAN_PRICES[body.plan]?.[body.cycle];
  if (!prices) return NextResponse.json({ error: "Invalid plan or cycle" }, { status: 400 });

  const amount    = prices.zmw;
  const reference = `smfx_${body.plan}_${dbUser.id}_${Date.now()}`;

  const subscription = await prisma.subscription.create({
    data: {
      userId:         dbUser.id,
      plan:           DB_PLAN[body.plan],
      status:         "PENDING",
      lencoReference: reference,
      currency:       "ZMW",
      amountCents:    amount,
      billingCycle:   body.cycle,
    },
  });

  const lencoRes = await fetch(`${LENCO_BASE}/collections/card`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${LENCO_KEY}`,
    },
    body: JSON.stringify({
      amount:      (amount / 100).toFixed(2),
      currency:    "ZMW",
      country:     "zm",
      reference,
      email:       dbUser.email,
      redirectUrl: `${APP_URL}/checkout/${body.plan}?ref=${reference}`,
    }),
  });

  const lencoData = await lencoRes.json().catch(() => ({}));

  const checkoutUrl: string | undefined =
    lencoData?.data?.authorizationUrl ||
    lencoData?.data?.checkoutUrl ||
    lencoData?.data?.link;

  if (!lencoRes.ok || !checkoutUrl) {
    await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => null);
    return NextResponse.json(
      { error: lencoData?.message || "Could not start card payment" },
      { status: 400 },
    );
  }

  return NextResponse.json({ reference, checkoutUrl });
}
