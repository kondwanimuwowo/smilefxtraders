import { redirect } from "next/navigation";
import { createClient, getAuthState } from "@/lib/supabase/server";
import { AuthUnavailableError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

export async function requireInstructor() {
  const supabase = await createClient();
  const auth = await getAuthState(supabase);

  // Not redirect("/login"): bouncing someone to the sign-in page tells them
  // their session ended, when in fact this request just lost the refresh race
  // (see getAuthState). Throwing surfaces (app)/error.tsx, which offers a
  // retry — the accurate action, since the next attempt normally works.
  if (auth.state === "unknown") throw new AuthUnavailableError();
  if (!auth.user) redirect("/login");
  const user = auth.user;

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: user.id },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "INSTRUCTOR") redirect("/dashboard");
  return dbUser.id;
}
