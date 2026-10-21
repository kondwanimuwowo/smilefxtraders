"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { validateWaitlistSecurity } from "@/lib/bot-protection";
import { withEvlog, useLogger } from "@/lib/evlog";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const subscribeToWaitlist = withEvlog(async (formData: FormData) => {
  const log = useLogger();
  const email = ((formData.get("email") as string) ?? "").trim().toLowerCase();
  const source = formData.get("source") === "maintenance" ? "maintenance" : "waitlist";

  // Deliberately the source and the domain only, never the address or the IP:
  // this is a public form, so those two fields are the whole reason the event
  // is worth keeping and the only ones safe to keep in a log.
  log.set({ waitlist: { source, emailDomain: email.split("@")[1] ?? "unknown" } });

  if (!email || !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || "unknown";

  const security = await validateWaitlistSecurity(email, ip);
  if (!security.ok) {
    log.set({ waitlist: { rejected: security.error } });
    return { error: security.error };
  }

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
});
