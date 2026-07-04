import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { TrendMatrix } from "./TrendMatrix";

export const metadata = { title: "Trend Matrix | Smile FX Traders" };

export default async function TrendMatrixPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isInstructor = false;
  if (user) {
    const dbUser = await prisma.user.findUnique({
      where:  { supabaseId: user.id },
      select: { role: true },
    });
    isInstructor = dbUser?.role === "INSTRUCTOR";
  }

  return <TrendMatrix isInstructor={isInstructor} />;
}
