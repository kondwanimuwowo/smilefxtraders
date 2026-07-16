import { CheckoutPage } from "./CheckoutPage";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Upgrade | Smile FX Traders" };

export default async function Page({ params }: { params: Promise<{ plan: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const dbUser = user
    ? await prisma.user.findUnique({ where: { supabaseId: user.id }, select: { instruments: true } }).catch(() => null)
    : null;
  const needsOnboarding = !dbUser || dbUser.instruments.length === 0;

  return <CheckoutPage paramsPromise={params} needsOnboarding={needsOnboarding} />;
}
