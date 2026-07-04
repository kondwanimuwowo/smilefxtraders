"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates/welcome";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.smilefxtraders.com";

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email    = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes("invalid login")) {
        return { error: "Incorrect email or password." };
      }
      if (error.message.toLowerCase().includes("email not confirmed")) {
        return { error: "Please verify your email first. Check your inbox for the confirmation link (it may be in spam)." };
      }
      return { error: error.message };
    }
  } catch {
    return { error: "Could not reach the server. Check your internet connection and try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function demoLoginAction() {
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email:    process.env.DEMO_EMAIL    ?? "demo@smilefxtraders.com",
      password: process.env.DEMO_PASSWORD ?? "demo-trader-2025",
    });

    if (error) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:    process.env.DEMO_EMAIL    ?? "demo@smilefxtraders.com",
        password: process.env.DEMO_PASSWORD ?? "demo-trader-2025",
      });
      if (signUpError || !data.user) return { error: signUpError?.message ?? "Demo login failed" };

      await prisma.user.upsert({
        where:  { supabaseId: data.user.id },
        update: {},
        create: {
          supabaseId:  data.user.id,
          name:        "Demo Trader",
          username:    "demo_trader",
          email:       data.user.email!,
          plan:        "PRO",
          level:       3,
          streak:      7,
          riskPct:     0.5,
          experience:  "INTERMEDIATE",
          instruments: ["EURUSD", "GBPUSD", "XAUUSD", "NAS100"],
        },
      });
    }
  } catch {
    return { error: "Could not reach the server. Check your internet connection and try again." };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

export async function signupAction(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const username = (formData.get("username") as string).replace(/^@/, "");
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${APP_URL}/auth/callback`,
      data: { full_name: name, username },
    },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Signup failed. Please try again." };

  // Already-registered email: Supabase returns an obfuscated user with no
  // identities. Show the same neutral "check your email" screen — don't
  // reveal whether an account exists.
  if (data.user.identities?.length === 0) {
    return { pendingVerification: true, email };
  }

  try {
    // Upsert, not create — the DB trigger (handle_new_auth_user) already
    // inserted a placeholder row the instant auth.signUp() created the
    // auth.users row, using an email-prefix name/username. The `update`
    // branch overwrites that placeholder with what the user actually typed
    // into the signup form, so their real name/username always wins.
    await prisma.user.upsert({
      where:  { supabaseId: data.user.id },
      update: { name, username, email },
      create: { supabaseId: data.user.id, name, username, email },
    });
  } catch (err: unknown) {
    const e = err as { code?: string; meta?: { target?: string[] } };
    if (e?.code === "P2002" && e.meta?.target?.includes("username")) {
      return { error: "Username already taken. Choose another." };
    }
    // Other P2002s (double-submit on email/supabaseId) mean the row exists — continue.
  }

  // Email confirmation enabled: no session until the link is clicked.
  if (!data.session) {
    return { pendingVerification: true, email };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function saveOnboardingAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const instruments = formData.getAll("instruments") as string[];
  const riskPct = parseFloat(formData.get("riskPct") as string);
  const experience = formData.get("experience") as string;
  const framework = (formData.get("framework") as string) || "SMC";

  const dbUser = await prisma.user.upsert({
    where: { supabaseId: user.id },
    update: {
      instruments,
      riskPct,
      experience: experience.toUpperCase() as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      framework,
    },
    create: {
      supabaseId:  user.id,
      email:       user.email ?? "",
      name:        (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "Trader",
      username:    `trader_${user.id.slice(0, 8)}`,
      instruments,
      riskPct,
      experience: experience.toUpperCase() as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      framework,
    },
  });

  // Personal welcome from Kondwani, exactly once per user. Covers email
  // signups, OAuth signups, and lazily-created users alike. The flag is set
  // first (claim) so a double-submit can't double-send.
  if (!dbUser.welcomeEmailAt && dbUser.email) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data:  { welcomeEmailAt: new Date() },
    }).catch(() => null);
    const { subject, html } = welcomeEmail({ name: dbUser.name });
    await sendEmail({ from: "kondwani", to: dbUser.email, subject, html });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name     = (formData.get("name") as string ?? "").trim();
  const username = (formData.get("username") as string ?? "").replace(/^@/, "").trim();
  const location = (formData.get("location") as string ?? "").trim() || null;

  if (!name)     return { error: "Name is required" };
  if (!username) return { error: "Username is required" };

  try {
    await prisma.user.update({
      where: { supabaseId: user.id },
      data:  { name, username, location },
    });
    revalidatePath("/", "layout");
    return { success: true, name, username, location };
  } catch (err: unknown) {
    const msg = (err as { code?: string })?.code === "P2002"
      ? "Username already taken. Choose another"
      : "Could not save profile";
    return { error: msg };
  }
}

export async function changeEmailAction(newEmail: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const email = newEmail.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address" };
  }
  if (email === user.email) {
    return { error: "That's already your current email" };
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${APP_URL}/auth/callback` },
  );
  if (error) return { error: error.message };

  return { success: true };
}

export async function updateTradingAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const instruments = formData.getAll("instruments") as string[];
  const riskPct     = parseFloat(formData.get("riskPct") as string);
  const experience  = (formData.get("experience") as string).toUpperCase();
  const framework   = (formData.get("framework") as string) || "SMC";

  if (isNaN(riskPct) || riskPct <= 0) return { error: "Invalid risk value" };

  try {
    await prisma.user.update({
      where: { supabaseId: user.id },
      data: {
        instruments,
        riskPct,
        experience: experience as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        framework,
      },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "Could not save preferences" };
  }
}

export async function signoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
