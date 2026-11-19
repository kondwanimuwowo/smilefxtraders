import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createClient, getAuthState } from "@/lib/supabase/server";
import { AuthUnavailableError } from "@/lib/api-error";
import { prisma } from "@/lib/prisma";

/**
 * API-route twin of requireInstructor. A route handler must not answer a
 * `fetch` with a login/dashboard redirect — the client would try to parse the
 * HTML as JSON — so this returns the same decision as an HTTP error instead.
 *
 * "unknown" is a 503 (retryable), never a denial: see getAuthState for why a
 * signed-in member can momentarily fail to verify during a token refresh.
 */
export async function requireInstructorApi(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const auth = await getAuthState(supabase);

  if (auth.state === "unknown") {
    return NextResponse.json(
      { error: new AuthUnavailableError().message, retry: true },
      { status: 503 },
    );
  }
  if (auth.state === "anonymous") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.user.findUnique({
    where:  { supabaseId: auth.user.id },
    select: { role: true },
  }).catch(() => null);

  if (dbUser?.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Instructor access required." }, { status: 403 });
  }
  return null;
}

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
