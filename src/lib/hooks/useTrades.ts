"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Trade } from "../store";

export interface TradeStats {
  closed: number;
  wins: number;
  losses: number;
  netR: number;
  avgWin: number;
  avgLoss: number;
  winRate: number;
  expectancy: number;
  discFollowed: number;
  equity: number[];
  models: { model: string; pct: number; n: number }[];
}
import { useStore } from "../store";

export function computeStats(trades: Trade[]): TradeStats {
  const closed = trades.filter((t) => t.result !== "open");
  const wins = closed.filter((t) => t.result === "win");
  const losses = closed.filter((t) => t.result === "loss");
  const netR = closed.reduce((a, t) => a + t.pnlR, 0);
  const avgWin = wins.length ? wins.reduce((a, t) => a + t.pnlR, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((a, t) => a + t.pnlR, 0) / losses.length : 0;
  const winRate = closed.length ? Math.round((wins.length / closed.length) * 100) : 0;
  const expectancy = closed.length
    ? +((winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss).toFixed(2)
    : 0;
  const discFollowed = trades.length
    ? Math.round((trades.filter((t) => t.discipline).length / trades.length) * 100)
    : 100;

  const chrono = closed.slice().reverse();
  let cum = 0;
  const equity: number[] = [0];
  chrono.forEach((t) => { cum += t.pnlR; equity.push(+cum.toFixed(1)); });

  const byModel: Record<string, { w: number; n: number }> = {};
  closed.forEach((t) => {
    if (!byModel[t.model]) byModel[t.model] = { w: 0, n: 0 };
    byModel[t.model].n++;
    if (t.result === "win") byModel[t.model].w++;
  });
  const models = Object.entries(byModel)
    .map(([model, v]) => ({ model, pct: Math.round((v.w / v.n) * 100), n: v.n }))
    .sort((a, b) => b.pct - a.pct);

  return {
    closed: closed.length, wins: wins.length, losses: losses.length,
    netR: +netR.toFixed(1), avgWin: +avgWin.toFixed(1), avgLoss: +avgLoss.toFixed(1),
    winRate, expectancy, discFollowed, equity, models,
  };
}

export function useTrades() {
  const query = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      let res: Response;
      try {
        res = await fetch("/api/trades");
      } catch {
        throw new Error("Can't reach the server. Check your internet connection.");
      }
      if (res.status === 401) throw new Error("Session expired. Please sign in again.");
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Server error (${res.status})`);
      }
      return res.json() as Promise<Trade[]>;
    },
  });

  const stats = computeStats(query.data ?? []);
  return { ...query, trades: query.data ?? [], stats };
}

export function useAddTrade() {
  const queryClient = useQueryClient();
  const toast = useStore((s) => s.toast);

  return useMutation({
    mutationFn: async (trade: Partial<Trade>) => {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(trade),
      });
      if (!res.ok) throw new Error("Failed to add trade");
      return res.json() as Promise<Trade>;
    },
    onMutate: async (newTrade) => {
      await queryClient.cancelQueries({ queryKey: ["trades"] });
      const previousTrades = queryClient.getQueryData<Trade[]>(["trades"]) || [];
      const tempId = "temp_" + Date.now();
      queryClient.setQueryData<Trade[]>(["trades"], (old) => [{ ...newTrade, id: tempId } as Trade, ...(old || [])]);
      return { previousTrades, tempId };
    },
    onSuccess: (data: Trade, _vars, context) => {
      // Replace the optimistic temp entry with the real trade from the server (real UUID)
      queryClient.setQueryData<Trade[]>(["trades"], (old) =>
        (old ?? []).map((t) => (t.id === context?.tempId ? data : t))
      );
    },
    onError: (_err, _newTrade, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(["trades"], context.previousTrades);
      }
      toast("Sync failed. Check connection.", "coral", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}

export function useUpdateTrade() {
  const queryClient = useQueryClient();
  const toast = useStore((s) => s.toast);

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Trade> }) => {
      const res = await fetch(`/api/trades/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        console.error("[useUpdateTrade]", res.status, body.error ?? "PATCH failed");
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      return res.json() as Promise<Trade>;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: ["trades"] });
      const previousTrades = queryClient.getQueryData<Trade[]>(["trades"]) || [];
      queryClient.setQueryData<Trade[]>(["trades"], (old) =>
        (old || []).map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
      return { previousTrades };
    },
    onSuccess: (serverTrade: Trade) => {
      // Replace with the exact server-returned trade so fields like aiReview are never lost
      queryClient.setQueryData<Trade[]>(["trades"], (old) =>
        (old ?? []).map((t) => (t.id === serverTrade.id ? serverTrade : t))
      );
    },
    onError: (err, _variables, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(["trades"], context.previousTrades);
      }
      console.error("[save trade]", err);
      toast("Save failed. Check the console for details.", "coral", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}

export function useDeleteTrade() {
  const queryClient = useQueryClient();
  const toast = useStore((s) => s.toast);

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trades/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete trade");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["trades"] });
      const previousTrades = queryClient.getQueryData<Trade[]>(["trades"]) || [];
      queryClient.setQueryData<Trade[]>(["trades"], (old) => (old || []).filter((t) => t.id !== id));
      return { previousTrades };
    },
    onError: (err, id, context) => {
      if (context?.previousTrades) {
        queryClient.setQueryData(["trades"], context.previousTrades);
      }
      toast("Sync failed. Check connection.", "coral", "error");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}
