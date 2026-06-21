import { requireInstructor } from "@/lib/admin-guard";
import { AlertsManager } from "./AlertsManager";

export default async function AdminAlertsPage() {
  await requireInstructor();
  return <AlertsManager />;
}
