import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface HyperdriveBinding { connectionString: string }

// Route through the Hyperdrive binding when available.
//
// ⚠️ The Hyperdrive origin MUST point at Supabase's *session* pooler
// (aws-<region>.pooler.supabase.com:5432), NOT the transaction pooler on
// 6543. Switching to 6543 on 2026-08-15 took the whole app down: every query
// stalled to the client timeout and no retry ever succeeded, while Supavisor
// logged successful authentication and a fresh Postgres backend each time.
// Prisma's driver uses named prepared statements, and transaction mode can
// land the Parse and the Bind/Execute on different backends -- behind
// Hyperdrive that desync hangs rather than erroring. Hyperdrive also already
// pools in transaction mode, so 6543 stacks two transaction poolers. Supabase's
// "use 6543 for serverless" guidance is written for clients connecting
// directly, not for ones behind Hyperdrive. Reverting to 5432 restored service
// immediately.
//
// 2026-08-14 notes: briefly bypassed this to test whether Hyperdrive itself
// was the source of "Query read timeout" errors -- it wasn't. Direct
// DATABASE_URL showed the same intermittent stalls on a database confirmed
// healthy via pg_stat_activity, so the residual intermittent stall lives in
// the Workers connect() layer reaching a non-Cloudflare host, not in which
// proxy sits in front of it. That intermittent stall is still unsolved; the
// retry below is what keeps it off users' screens.
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

  // Escape hatch: set DB_BYPASS_HYPERDRIVE=1 to skip the binding and connect
  // straight to DATABASE_URL.
  //
  // Added during the 2026-08-15 outage to test whether Hyperdrive was at
  // fault. It never got used -- the cause turned out to be the 6543 pooler
  // port (see the warning above) and reverting to 5432 fixed it. Kept as a
  // deliberate breaker switch: that outage locked every user out for hours
  // with no quick lever, and this is one env var.
  //
  // NOT a default. Leaving it set permanently gives up Hyperdrive's pooling
  // and query caching, and points an unbounded number of per-isolate pools
  // (max: 10 each) straight at a database with max_connections = 60. Fine for
  // a short diagnostic window, a real hazard as the user base grows.
  if (process.env.DB_BYPASS_HYPERDRIVE === "1") {
    const direct = process.env.DATABASE_URL;
    if (!direct) throw new Error("DB_BYPASS_HYPERDRIVE=1 but DATABASE_URL is not set.");
    logConnectionSource("env-DATABASE_URL (hyperdrive bypass flag set)", direct);
    return direct;
  }

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

// Total attempts (first try + retries).
//
// This is the actual mitigation for the frozen-isolate dead socket described
// in createPrismaClient below: the first attempt is spent discovering the
// socket is dead, and the retry gets a fresh one. Since that is the *normal*
// path after an isolate wakes rather than a rare fault, a single retry left a
// visible failure any time the second attempt also drew a stale connection.
// Three attempts at a 1.5s timeout bounds the worst case at ~4.5s.
const RETRY_ATTEMPTS = 3;

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
    // ── Why these are so low: the frozen-isolate dead-socket problem ────────
    //
    // Workers freeze the V8 isolate between requests, and this module-level
    // pool survives the freeze. While frozen, Supavisor drops the idle
    // connection at its end (its logs show "DbHandler: Connection closed
    // unexpectedly while idle in the pool"). When the isolate wakes, pg hands
    // out that socket believing it is healthy, writes the query into it, and
    // waits for a reply that can never arrive. That is the stall: it always
    // burns the FULL timeout, and a fresh attempt then succeeds in ~190ms.
    //
    // idleTimeoutMillis cannot rescue this. Timers are frozen along with
    // everything else, so the pool never gets to evict a connection that died
    // mid-freeze -- it wakes up believing the socket is still good. Nothing we
    // set client-side runs while frozen.
    //
    // So the only lever is detecting the dead socket quickly. A healthy query
    // answers in ~190ms (measured), which makes 1.5s roughly 8x headroom while
    // cutting the invisible-to-the-user recovery from ~3.2s to ~1.7s, and the
    // absolute worst case (all RETRY_ATTEMPTS stalling) from 9s to 4.5s.
    //
    // Caveat for whoever raises this later: query_timeout is global, so it
    // also caps the notification fan-out's createMany in lib/notifications.ts.
    // Trivial at current user counts, but that is the first query likely to
    // outgrow the cap -- batch it before assuming this number is the problem.
    connectionTimeoutMillis: 1_500,
    idleTimeoutMillis: 10_000,
    query_timeout: 1_500,
    // Lets the OS notice a dead peer on its own while the isolate is actually
    // running. No help across a freeze, but it costs nothing and shortens the
    // window in which a connection can go stale unnoticed during a request.
    keepAlive: true,
    // Retire every connection after a single checkout, so no socket can
    // survive long enough to be killed during an isolate freeze. This attacks
    // the cause rather than the symptom -- with connections that never
    // outlive one query, there is no stale socket to hand out on wake.
    //
    // Measured before enabling this: the pool was routinely handing out two
    // dead sockets in a row ("SUCCEEDED on attempt 3"), which is what a pool
    // of up to `max` stale connections looks like after a freeze -- each
    // attempt burns one. Three requests in 40 minutes exhausted all attempts
    // and surfaced a real error to a user.
    //
    // The cost is a fresh connection per query, which the same logs show is
    // ~4ms: these connections terminate at hyperdrive.local inside the Worker
    // runtime, and Hyperdrive keeps the real pool to Supabase warm. If this
    // ever needs reverting, delete this one line -- the timeouts and retries
    // above stand on their own.
    maxUses: 1,
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

  // Transparent retries on a transient connection stall, applied to every
  // query through every model automatically.
  //
  // Was a single retry. The 2026-08-15 instrumentation showed why that wasn't
  // enough: a stalled attempt burns the full query_timeout and a fresh one
  // then succeeds in ~190ms, so the difference between one retry and two is
  // the difference between a paying trader seeing an error card and seeing
  // nothing at all. Worst case is bounded by RETRY_ATTEMPTS * query_timeout,
  // which is why query_timeout is kept tight below.
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
        let lastErr: unknown;
        for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
          const startedAt = Date.now();
          try {
            const result = await query(args);
            if (attempt > 1) {
              console.info(`[prisma] ${label} SUCCEEDED on attempt ${attempt} after ${Date.now() - startedAt}ms`);
            }
            return result;
          } catch (err) {
            lastErr = err;
            const message = err instanceof Error ? err.message : String(err);
            // Only connection stalls are worth repeating. A genuine query
            // error (bad input, constraint violation) fails identically every
            // time, so retrying it just multiplies the user's wait.
            if (!TRANSIENT_CONNECTION_ERROR.test(message)) throw err;
            console.warn(`[prisma] ${label} stalled ${Date.now() - startedAt}ms on attempt ${attempt}/${RETRY_ATTEMPTS}`);
          }
        }
        console.error(`[prisma] ${label} exhausted ${RETRY_ATTEMPTS} attempts`);
        throw lastErr;
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
