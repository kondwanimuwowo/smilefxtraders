import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { detectZmOperator } from "@/lib/mobile-money";

const LENCO_BASE = "https://api.lenco.co/access/v2";
const LENCO_KEY  = process.env.LENCO_API_KEY ?? "";

// ── Plan pricing (amount in the smallest currency unit) ─────────────────────
// Annual is a single up-front charge covering all 12 months, not the
// discounted monthly-equivalent rate alone — K199/mo annual for Edge means
// the customer pays K199 x 12 = K2,388 once, not K199 total.

const PLAN_PRICES: Record<string, Record<string, { zmw: number }>> = {
  edge: {
    monthly: { zmw: 24900 },        // K249
    annual:  { zmw: 19900 * 12 },   // K199/mo x 12 = K2,388
  },
  pro: {
    monthly: { zmw: 54900 },        // K549
    annual:  { zmw: 43900 * 12 },   // K439/mo x 12 = K5,268
  },
};

const DB_PLAN: Record<string, "EDGE" | "PRO"> = { edge: "EDGE", pro: "PRO" };

// ── POST /api/checkout/mobile-money ─────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json() as {
    plan:     "edge" | "pro";
    cycle:    "monthly" | "annual";
    phone:    string;
    operator: string;
  };

  const prices = PLAN_PRICES[body.plan]?.[body.cycle];
  if (!prices) return NextResponse.json({ error: "Invalid plan or cycle" }, { status: 400 });

  // Mobile money in Zambia is ZMW-only.
  const amount   = prices.zmw;
  const currency = "ZMW" as const;
  const reference = `smfx_${body.plan}_${dbUser.id}_${Date.now()}`;

  // Keep the number as the user typed it (Airtel already works this way) but
  // strip spaces so "+260 97 ..." and "097 ..." normalise cleanly.
  const phone = body.phone.replace(/\s+/g, "");

  // The mobile-money wallet network is determined by the phone number itself,
  // so trust the number over the submitted operator — this prevents a mismatch
  // (e.g. an MTN number sent as "airtel") from ever reaching Lenco. Fall back to
  // the client's selection only if the prefix is unrecognised.
  const operator = detectZmOperator(phone) ?? (body.operator ?? "").trim().toLowerCase();

  // Create pending subscription record
  const subscription = await prisma.subscription.create({
    data: {
      userId:       dbUser.id,
      plan:         DB_PLAN[body.plan],
      status:       "PENDING",
      lencoReference: reference,
      currency,
      amountCents:  amount,
      billingCycle: body.cycle,
    },
  });

  // Call Lenco API server-side. `country` is recommended so Lenco routes the
  // charge to the correct mobile-money network (Airtel/MTN/Zamtel) in Zambia.
  const lencoRes = await fetch(`${LENCO_BASE}/collections/mobile-money`, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${LENCO_KEY}`,
    },
    body: JSON.stringify({
      amount:   (amount / 100).toFixed(2),
      currency,
      country:  "zm",
      reference,
      phone,
      operator,
    }),
  });

  const lencoData = await lencoRes.json().catch(() => ({}));

  const collectionState: string = lencoData?.data?.status ?? "";
  // Lenco may report the failure reason under a few different keys.
  const failureReason: string =
    lencoData?.data?.reasonForFailure ||
    lencoData?.data?.failureReason ||
    lencoData?.data?.reason ||
    lencoData?.message ||
    "";

  // Server-side diagnostic — never logs the API key, only Lenco's response.
  console.log("[checkout/mobile-money]", operator, "→", {
    httpOk:  lencoRes.ok,
    status:  lencoData?.status,
    state:   collectionState,
    reason:  failureReason,
  });

  // 1) Lenco rejected the request outright.
  if (!lencoRes.ok || !lencoData.status) {
    await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => null);
    return NextResponse.json({ error: failureReason || "Payment initiation failed" }, { status: 400 });
  }

  // 2) Request accepted, but the collection already terminated as failed/declined.
  //    Fail fast instead of returning a reference the client would poll for 60s.
  if (collectionState === "failed" || collectionState === "declined") {
    await prisma.subscription.delete({ where: { id: subscription.id } }).catch(() => null);
    const friendly =
      failureReason ||
      `${operator.toUpperCase()} could not process this payment. Confirm the number is a registered ${operator} mobile-money wallet, or try a different network.`;
    return NextResponse.json({ error: friendly, state: collectionState }, { status: 400 });
  }

  return NextResponse.json({
    reference:      lencoData.data?.reference ?? reference,
    lencoReference: lencoData.data?.lencoReference ?? reference,
    status:         lencoData.data?.status ?? "pay-offline",
    subscriptionId: subscription.id,
  });
}
