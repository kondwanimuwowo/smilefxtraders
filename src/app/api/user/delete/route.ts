/**
 * POST /api/user/delete
 *
 * Self-service account deletion. Two separate actions, in this order:
 *
 * 1. Permanently ban the Supabase auth identity (ban_duration ~100 years)
 *    instead of deleting it. This keeps the auth.users row — and the email
 *    address — reserved forever, so the same email can never be used to
 *    sign up again for a fresh Free-tier account (resetting the 20-trade
 *    journal cap, streaks, etc). Deleting the auth user instead would
 *    release the email and defeat the entire point.
 *
 * 2. Delete the Prisma user row. Every owned relation (trades, posts,
 *    comments, likes, alerts authored, notifications, subscriptions, price
 *    alerts, badges, lesson progress) cascades — this is the actual data
 *    wipe promised in the Settings "Danger zone" copy.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { id: true, role: true },
  });
  if (!dbUser) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (dbUser.role === "INSTRUCTOR") {
    return NextResponse.json(
      { error: "Instructor accounts can't be self-deleted — contact support@smilefxtraders.com." },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { error: banError } = await admin.auth.admin.updateUserById(user.id, {
    ban_duration: "876000h",
  });
  if (banError) {
    return NextResponse.json({ error: banError.message }, { status: 500 });
  }

  await prisma.user.delete({ where: { id: dbUser.id } });

  return NextResponse.json({ success: true });
}
