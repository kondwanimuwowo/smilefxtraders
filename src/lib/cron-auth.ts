import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

function matches(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Accepts CRON_SECRET as either `x-cron-secret` or `Authorization: Bearer`.
// Fails closed: an unset secret rejects every request, and a missing Origin
// header never bypasses the check.
export function requireCronSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  const ok = matches(req.headers.get("x-cron-secret"), expected) || matches(bearer, expected);
  return ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
