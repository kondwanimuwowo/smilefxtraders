import { useQuery } from "@tanstack/react-query";
import type { Instrument } from "@prisma/client";

export type { Instrument };

async function fetchInstruments(): Promise<Instrument[]> {
  const res = await fetch("/api/instruments");
  if (!res.ok) throw new Error("Failed to fetch instruments");
  return res.json();
}

export function useInstruments() {
  return useQuery<Instrument[]>({
    queryKey:  ["instruments"],
    queryFn:   fetchInstruments,
    staleTime: 60 * 60 * 1000,
  });
}

export function useInstrumentSymbols() {
  const { data = [] } = useInstruments();
  return data.map((i) => i.symbol);
}
