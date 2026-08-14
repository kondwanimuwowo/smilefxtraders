import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

/**
 * Classifies a caught API route error into a stable `kind` the client can
 * branch on, logs the full error server-side (prefixed for Workers Logs
 * filtering), and returns a JSON response with a status matching the kind.
 *
 * Without this, an unhandled Prisma/pg failure surfaces as a bare 500 with
 * no body -- Next.js masks the real message in production, and the browser
 * console shows nothing but a digest. See 2026-08-14 incident: every
 * DB-backed route without a try/catch went straight to that dead end.
 */
export function handleApiError(context: string, err: unknown): NextResponse {
  console.error(`[${context}]`, err);

  const message = err instanceof Error ? err.message : String(err);

  // node-postgres / Prisma driver adapter: pool exhausted or origin
  // unreachable within connectionTimeoutMillis ("timeout exceeded..."), or a
  // connection was acquired but the query itself didn't get a response
  // within query_timeout ("Query read timeout") -- both are the same class
  // of transient stall from the client's perspective (see lib/prisma.ts's
  // retry wrapper, which already retries these once before this is ever
  // reached). Missing the second phrasing here previously misclassified the
  // *majority* of these as generic "unknown" errors, undermining the whole
  // point of this classifier -- see 2026-08-14 incident.
  if (/timeout exceeded when trying to connect|Query read timeout/i.test(message)) {
    return NextResponse.json(
      { error: "Database connection timed out. Please try again.", kind: "timeout" },
      { status: 503 }
    );
  }

  // TCP-level failures reaching Hyperdrive/Supabase.
  if (/ECONNREFUSED|ECONNRESET|ENOTFOUND|EHOSTUNREACH|ETIMEDOUT/.test(message)) {
    return NextResponse.json(
      { error: "Could not reach the database. Please try again.", kind: "network" },
      { status: 503 }
    );
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: "Database connection failed to initialize.", kind: "database", code: err.errorCode ?? null },
      { status: 503 }
    );
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return NextResponse.json(
      { error: `Database error (${err.code}).`, kind: "database", code: err.code },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "Unexpected server error.", kind: "unknown" },
    { status: 500 }
  );
}
