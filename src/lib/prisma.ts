import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function resolveConnectionString(): string {
  // TEMP (2026-08-14): bypassing Hyperdrive to isolate whether it's the
  // source of the "Query read timeout" errors clustering right up against
  // query_timeout on requests routed through Cloudflare's NBO colo -- DB
  // itself answers instantly (confirmed via pg_stat_activity), a Hyperdrive
  // restart didn't help, so testing the raw pgbouncer path directly.
  // Revert to the Hyperdrive-first version once this is resolved either way.
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
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 10_000,
    query_timeout: 10_000,
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
