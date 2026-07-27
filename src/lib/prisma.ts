import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set.");
  // Workers reuses isolates (and this module-level singleton) across
  // requests, but Supabase's pgbouncer can silently drop an idle pooled
  // connection between requests. Without a client-side timeout, the next
  // query on that dead connection hangs until Cloudflare's own ~30s watchdog
  // kills the whole request with an opaque error. These timeouts turn that
  // into a normal thrown error within a few seconds, which every caller
  // already handles via try/catch or `.catch(() => null)`.
  const adapter = new PrismaPg({
    connectionString: url,
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 10_000,
    query_timeout: 10_000,
    max: 3,
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
