import type { Metadata } from "next";
import { Notifications } from "./Notifications";

export const metadata: Metadata = { title: "Notifications | Smile FX Traders" };

export default function NotificationsPage() {
  return <Notifications />;
}
