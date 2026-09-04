"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { validateWaitlistSecurity } from "@/lib/bot-protection";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToWaitlist(formData: FormData) {
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const source = formData.get("source") === "maintenance" ? "maintenance" : "waitlist";

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";

  const security = await validateWaitlistSecurity(email, ip);
  if (!security.ok) return { error: security.error };

  try {
    await prisma.waitlistSignup.upsert({
      where: { email },
      update: {},
      create: { email, source },
    });
  } catch {
    return { error: "Could not save your email. Please try again." };
  }

  return { success: true };
}
