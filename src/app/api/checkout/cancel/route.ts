import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    select: { id: true, plan: true },
  });
  if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (dbUser.plan === "FREE") {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  // Find the active subscription to get renewsAt for the grace period
  const activeSub = await prisma.subscription.findFirst({
    where: { userId: dbUser.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: { id: true, renewsAt: true },
  });

  const planExpiresAt = activeSub?.renewsAt ?? null;

  await prisma.$transaction([
    // Mark the subscription cancelled
    ...(activeSub ? [prisma.subscription.update({
      where: { id: activeSub.id },
      data: { status: "CANCELLED" },
    })] : []),
    // Set grace period — plan stays active until planExpiresAt (lazy-expired in layout on next load)
    prisma.user.update({
      where: { id: dbUser.id },
      data: { planExpiresAt },
    }),
  ]);

  return NextResponse.json({ ok: true, expiresAt: planExpiresAt?.toISOString() ?? null });
}
