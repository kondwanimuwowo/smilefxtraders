"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function demoLoginAction() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: process.env.DEMO_EMAIL ?? "demo@smilefxtraders.com",
    password: process.env.DEMO_PASSWORD ?? "demo-trader-2025",
  });

  if (error) {
    // If demo account doesn't exist, sign up and create it
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: process.env.DEMO_EMAIL ?? "demo@smilefxtraders.com",
      password: process.env.DEMO_PASSWORD ?? "demo-trader-2025",
    });
    if (signUpError || !data.user) return { error: signUpError?.message ?? "Demo login failed" };

    await prisma.user.upsert({
      where: { supabaseId: data.user.id },
      update: {},
      create: {
        supabaseId: data.user.id,
        name: "Demo Trader",
        username: "demo_trader",
        email: data.user.email!,
        plan: "PRO",
        level: 3,
        streak: 7,
        riskPct: 0.5,
        experience: "INTERMEDIATE",
        instruments: ["EURUSD", "GBPUSD", "XAUUSD", "NAS100"],
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signupAction(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const username = (formData.get("username") as string).replace(/^@/, "");
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Signup failed — please try again." };

  await prisma.user.create({
    data: {
      supabaseId: data.user.id,
      name,
      username,
      email,
    },
  });

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

  await prisma.user.update({
    where: { supabaseId: user.id },
    data: {
      instruments,
      riskPct,
      experience: experience.toUpperCase() as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
      framework,
    },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function updateProfileAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name     = (formData.get("name") as string ?? "").trim();
  const username = (formData.get("username") as string ?? "").replace(/^@/, "").trim();

  if (!name)     return { error: "Name is required" };
  if (!username) return { error: "Username is required" };

  try {
    await prisma.user.update({
      where: { supabaseId: user.id },
      data:  { name, username },
    });
    revalidatePath("/", "layout");
    return { success: true, name, username };
  } catch (err: unknown) {
    const msg = (err as { code?: string })?.code === "P2002"
      ? "Username already taken — choose another"
      : "Could not save profile";
    return { error: msg };
  }
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
