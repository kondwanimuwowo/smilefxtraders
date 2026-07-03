"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStore, type Notif } from "@/lib/store";

interface NotificationsResponse {
  notifications: Notif[];
  unreadCount:   number;
}

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

export function useNotifications() {
  const setNotifs = useStore((s) => s.setNotifs);

  const query = useQuery<NotificationsResponse>({
    queryKey:               ["notifications"],
    queryFn:                fetchNotifications,
    refetchInterval:        60_000,
    refetchOnWindowFocus:   true,
  });

  useEffect(() => {
    if (query.data) setNotifs(query.data.notifications);
  }, [query.data, setNotifs]);

  return query;
}

export function useMarkNotifsRead() {
  const queryClient    = useQueryClient();
  const markNotifsRead = useStore((s) => s.markNotifsRead);

  return useMutation({
    mutationFn: (payload: { id?: string; all?: boolean }) =>
      fetch("/api/notifications", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      }).then((r) => r.json()),
    onMutate: (payload) => {
      // Optimistic: bulk flips everything locally; single-row flips arrive on
      // the next refetch (the unread dot is minor enough not to hand-patch).
      if (payload.all) markNotifsRead();
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
