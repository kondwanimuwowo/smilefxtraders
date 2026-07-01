import { requireInstructor } from "@/lib/admin-guard";
import { InstrumentsManager } from "./InstrumentsManager";
import { prisma } from "@/lib/prisma";

export default async function InstrumentsPage() {
  await requireInstructor();
  const instruments = await prisma.instrument.findMany({ orderBy: { displayOrder: "asc" } });
  return <InstrumentsManager initial={instruments} />;
}
