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

// Matches driver-adapter errors caused by a stalled/hung connection attempt
// -- not a genuinely slow or broken query. See createPrismaClient below for
// the incident context this responds to.
const TRANSIENT_CONNECTION_ERROR = /Query read timeout|timeout exceeded when trying to connect|ECONNRESET|ECONNREFUSED|ETIMEDOUT/i;

function createPrismaClient() {
  const connectionString = resolveConnectionString();
  // Workers reuses isolates (and this module-level singleton) across
  // requests. These client-side timeouts turn a stale/hung connection into a
  // normal thrown error within a few seconds, which every caller already
  // handles via try/catch or `.catch(() => null)`.
  const adapter = new PrismaPg({
    connectionString,
    // 2026-08-14 incident: an intermittent minority of connection attempts
    // stall in Workers' connect() layer reaching Supabase, on a database
    // confirmed to answer instantly every time it's checked directly
    // (pg_stat_activity empty during the failures) -- happens identically
    // via Hyperdrive or a direct connection, so it isn't either proxy.
    // Manually reloading the page reliably "fixes" it because a fresh
    // connection attempt almost always succeeds immediately. Rather than
    // make users wait out a long timeout, fail fast and let the $extends
    // retry below make that same fresh attempt automatically.
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    query_timeout: 6_000,
    // Page loads fire several API routes in parallel (dashboard, academy,
    // notifications, etc.) that can land on the same reused isolate. A
    // pool of 3 queues the overflow and those queued acquires were hitting
    // connectionTimeoutMillis before the first 3 queries freed up -- see
    // 2026-08-14 incident: "prisma:error timeout exceeded when trying to
    // connect" on every DB-backed route. Hyperdrive's origin_connection_limit
    // is 60, so there's plenty of headroom to raise this.
    max: 10,
  });
  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // One transparent retry on a transient connection stall, applied to every
  // query through every model automatically. Deliberately not a loop/backoff
  // -- if a second fresh attempt also stalls, that's worth surfacing as a
  // real error (via handleApiError) rather than making the user wait
  // through a third attempt.
  return client.$extends({
    name: "retry-transient-connection-errors",
    query: {
      async $allOperations({ operation, model, args, query }) {
        try {
          return await query(args);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (!TRANSIENT_CONNECTION_ERROR.test(message)) throw err;
          console.warn(`[prisma] retrying ${model ?? ""}.${operation} after transient connection error`);
          return await query(args);
        }
      },
    },
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

// The $extends retry wrapper's type no longer structurally matches the base
// PrismaClient (it's missing $on/$use/etc, which nothing here calls). Callers
// that accept "any Prisma client" (e.g. lib/notifications.ts's Db union) use
// this instead of PrismaClient directly.
export type PrismaClientLike = ReturnType<typeof createPrismaClient>;
