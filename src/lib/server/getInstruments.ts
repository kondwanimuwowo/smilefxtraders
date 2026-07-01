import { prisma } from "@/lib/prisma";
import type { Instrument } from "@prisma/client";

export type { Instrument };

let cache: Instrument[] | null = null;
let cacheAt = 0;
const TTL = 60 * 60 * 1000; // 1 hour

export async function getInstruments(): Promise<Instrument[]> {
  if (cache && Date.now() - cacheAt < TTL) return cache;
  cache = await prisma.instrument.findMany({
    where:   { active: true },
    orderBy: { displayOrder: "asc" },
  });
  cacheAt = Date.now();
  return cache;
}
