import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface HyperdriveBinding { connectionString: string }

// Route through the Hyperdrive binding when available. 2026-08-14 incident
// notes: briefly bypassed this to test whether Hyperdrive itself was the
// source of "Query read timeout" errors -- it wasn't. Direct DATABASE_URL
// showed the exact same intermittent ~10s stalls on a database confirmed
// healthy via pg_stat_activity, so the stall is in Workers' `connect()`
// layer reaching a non-Cloudflare host, not in which proxy sits in front of
// it. Reverted to Hyperdrive since it's still the architecturally-correct
// choice (pooling, edge caching); query_timeout raised below as the actual
// mitigation while this is investigated further.
function resolveConnectionString(): string {
  try {
    const ctx = getCloudflareContext() as unknown as { env: Record<string, unknown> };
    const hyperdrive = ctx.env.HYPERDRIVE as HyperdriveBinding | undefined;
    if (hyperdrive?.connectionString) return hyperdrive.connectionString;
  } catch {
    // Not running inside a Workers request context — fall through.
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set.");
  return url;
}

function createPrismaClient() {
  const connectionString = resolveConnectionString();
  // Workers reuses isolates (and this module-level singleton) across
  // requests. These client-side timeouts turn a stale/hung connection into a
  // normal thrown error within a few seconds, which every caller already
  // handles via try/catch or `.catch(() => null)`.
  const adapter = new PrismaPg({
    connectionString,
    // See resolveConnectionString: intermittent stalls happen regardless of
    // Hyperdrive vs. direct, on a database confirmed to answer instantly.
    // The old 10s budget was killing slow-but-fine round trips, not slow
    // queries -- see 2026-08-14 "Query read timeout" incident.
    connectionTimeoutMillis: 15_000,
    idleTimeoutMillis: 10_000,
    query_timeout: 20_000,
    // Page loads fire several API routes in parallel (dashboard, academy,
    // notifications, etc.) that can land on the same reused isolate. A
    // pool of 3 queues the overflow and those queued acquires were hitting
    // connectionTimeoutMillis before the first 3 queries freed up -- see
    // 2026-08-14 incident: "prisma:error timeout exceeded when trying to
    // connect" on every DB-backed route. Hyperdrive's origin_connection_limit
    // is 60, so there's plenty of headroom to raise this.
    max: 10,
  });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as { prisma: ReturnType<typeof createPrismaClient> };

// Lazy singleton: initialized on first access so that DATABASE_URL is
// guaranteed to be injected by Next.js before the first query is executed.
function getPrisma() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as ReturnType<typeof createPrismaClient>, {
  get: (_, prop) => (getPrisma() as any)[prop],
});
