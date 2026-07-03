"use client";

import { useNotifications } from "@/lib/hooks/useNotifications";

// Keeps the notifications query mounted (60s poll + focus refetch) on every
// app page and feeds results into the Zustand store for the topbar bell.
export function NotificationsPoller() {
  useNotifications();
  return null;
}
