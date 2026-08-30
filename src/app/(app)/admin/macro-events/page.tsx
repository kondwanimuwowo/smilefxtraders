import { requireInstructor } from "@/lib/admin-guard";
import { prisma } from "@/lib/prisma";
import { MacroEventsManager } from "./MacroEventsManager";

export default async function MacroEventsPage() {
  await requireInstructor();
  const events = await prisma.economicEvent.findMany({
    where: { externalId: { startsWith: "manual:" } },
    orderBy: { eventTime: "desc" },
  });
  const initial = events.map((e) => ({ ...e, eventTime: e.eventTime.toISOString() }));
  return <MacroEventsManager initial={initial} />;
}
