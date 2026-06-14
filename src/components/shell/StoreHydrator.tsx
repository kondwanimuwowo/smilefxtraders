"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import type { AppUser, Trade } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  user:   AppUser | null;
  trades: Trade[];
}

// Runs once on mount and seeds the React Query cache and Zustand store
export function StoreHydrator({ user, trades }: Props) {
  const setUser = useStore((s) => s.setUser);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) setUser(user);
    if (trades.length) {
      queryClient.setQueryData(["trades"], trades);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
