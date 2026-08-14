import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

/**
 * Thrown for input the client got wrong (malformed JSON, missing/!string
 * fields). Routes throw this from inside their try block and let
 * handleApiError turn it into a 400 — that keeps a bad request from being
 * logged and reported as a server fault, which is what an unguarded
 * `req.json()` did before.
 */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequestError";
  }
}

/**
 * `req.json()` throws on an empty or malformed body. Every route that called
 * it bare turned a typo'd client request into a 500 — see the 2026-08-14
 * audit. Always call this instead.
 */
export async function readJsonBody<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new BadRequestError("Request body must be valid JSON.");
  }
}

/**
 * Parses an optional ISO date field. `new Date("nonsense")` yields an Invalid
 * Date, which Prisma only rejects at the driver level — surfacing as a 500
 * for what is really malformed client input.
 */
export function parseDate(value: unknown, field: string): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value as string);
  if (Number.isNaN(d.getTime())) throw new BadRequestError(`"${field}" is not a valid date.`);
  return d;
}

/** Reads a required string field, rejecting undefined/empty/non-string. */
export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new BadRequestError(`"${field}" is required.`);
  }
  return value;
}

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
  // Client-input faults are not server faults — return 400 without the
  // console.error noise that would otherwise bury real incidents.
  if (err instanceof BadRequestError) {
    return NextResponse.json({ error: err.message, kind: "bad_request" }, { status: 400 });
  }

  console.error(`[${context}]`, err);

  const message = err instanceof Error ? err.message : String(err);

  // An outbound call we aborted on our own timeout (see fetchWithTimeout).
  // The upstream is slow, not broken — distinct from our DB being unreachable.
  if (err instanceof Error && err.name === "AbortError") {
    return NextResponse.json(
      { error: "An upstream service timed out. Please try again.", kind: "upstream_timeout" },
      { status: 504 }
    );
  }

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
