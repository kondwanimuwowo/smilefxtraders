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
/**
 * Logs which connection path was actually taken, once per isolate.
 *
 * 2026-08-15: two Hyperdrive config changes (origin_connection_limit 60->40,
 * and session mode 5432 -> transaction mode 6543) produced *identical*
 * failure signatures, which is what you'd expect if the app never reaches
 * Hyperdrive at all and silently falls through to DATABASE_URL below. This
 * settles that before any more time goes into tuning a component that might
 * not be in the path.
 *
 * Logs host:port only -- never the connection string, which carries the
 * password.
 */
let loggedConnectionSource = false;

function logConnectionSource(source: string, connectionString: string): void {
  if (loggedConnectionSource) return;
  loggedConnectionSource = true;
  let origin = "unparseable";
  try {
    const u = new URL(connectionString);
    origin = `${u.hostname}:${u.port || "5432"}`;
  } catch {
    // Leave as "unparseable" — never fall back to logging the raw string.
  }
  console.info(`[prisma] connection source=${source} origin=${origin}`);
}

function resolveConnectionString(): string {
  let contextError: string | null = null;
  try {
    const ctx = getCloudflareContext() as unknown as { env: Record<string, unknown> };
    const hyperdrive = ctx.env.HYPERDRIVE as HyperdriveBinding | undefined;
    if (hyperdrive?.connectionString) {
      logConnectionSource("hyperdrive-binding", hyperdrive.connectionString);
      return hyperdrive.connectionString;
    }
    contextError = "context resolved but HYPERDRIVE binding was empty";
  } catch (err) {
    // Not running inside a Workers request context — fall through.
    contextError = err instanceof Error ? err.message : String(err);
  }
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set.");
  logConnectionSource(`env-DATABASE_URL (${contextError})`, url);
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
    // 2026-08-14 audit: these were 5s/6s, and because the $extends retry
    // below makes a second full attempt, a stalled connection cost the user
    // 12 seconds of spinner before any error appeared. A healthy query here
    // answers in well under 100ms (verified against pg_stat_activity), so
    // 3s is still ~30x headroom while halving the worst case to ~6s.
    //
    // Caveat for whoever raises this later: query_timeout is global, so it
    // also caps the notification fan-out's createMany in lib/notifications.ts.
    // That is trivial at current user counts but is the first query likely to
    // outgrow a 3s cap -- batch it before assuming this number is the problem.
    connectionTimeoutMillis: 3_000,
    idleTimeoutMillis: 10_000,
    query_timeout: 3_000,
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
  //
  // Type-checking this specific $extends call crashes tsc itself ("Debug
  // Failure: No error for last overload signature") -- confirmed a genuine
  // compiler bug in overload resolution against this API, not a real type
  // error: explicitly typing the callback params didn't help, and the
  // runtime behavior is correct (verified live -- retries fire and succeed
  // exactly as intended). Routing the call through `any` skips
  // type-checking just this one expression instead of fighting the crash;
  // the cast back to PrismaClient keeps every caller's types normal, since
  // nothing here calls the methods the extended client is missing
  // ($on/$use/etc).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).$extends({
    name: "retry-transient-connection-errors",
    query: {
      async $allOperations({ operation, model, args, query }: {
        operation: string;
        model?: string;
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
      }) {
        // Timings added 2026-08-15. The old log said only that a retry was
        // being attempted -- it never recorded how long the first attempt
        // stalled, nor whether the retry actually succeeded. Both matter:
        // "first attempt stalls for the full timeout, retry succeeds
        // instantly" and "both attempts stall identically" point at
        // completely different causes, and we currently cannot tell them
        // apart from the logs.
        const label = `${model ?? "raw"}.${operation}`;
        const startedAt = Date.now();
        try {
          return await query(args);
        } catch (err) {
          const stalledFor = Date.now() - startedAt;
          const message = err instanceof Error ? err.message : String(err);
          if (!TRANSIENT_CONNECTION_ERROR.test(message)) throw err;
          console.warn(`[prisma] ${label} stalled ${stalledFor}ms — retrying once`);
          const retryStartedAt = Date.now();
          try {
            const result = await query(args);
            console.info(`[prisma] ${label} retry SUCCEEDED after ${Date.now() - retryStartedAt}ms`);
            return result;
          } catch (retryErr) {
            console.error(`[prisma] ${label} retry FAILED after ${Date.now() - retryStartedAt}ms (first attempt stalled ${stalledFor}ms)`);
            throw retryErr;
          }
        }
      },
    },
  }) as PrismaClient;
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
  // Indexing the client by an arbitrary symbol/string key can't be expressed
  // without `any` here; callers still see the fully-typed PrismaClient.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get: (_, prop) => (getPrisma() as any)[prop],
});

// The $extends retry wrapper's type no longer structurally matches the base
// PrismaClient (it's missing $on/$use/etc, which nothing here calls). Callers
// that accept "any Prisma client" (e.g. lib/notifications.ts's Db union) use
// this instead of PrismaClient directly.
export type PrismaClientLike = ReturnType<typeof createPrismaClient>;
