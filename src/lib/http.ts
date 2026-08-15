// ── Client-side fetch ────────────────────────────────────────────────────────

/**
 * Browser-side `fetch` that retries a failed *read* a few times.
 *
 * The connection stalls investigated on 2026-08-15 fail at the server's
 * timeout and then succeed on a fresh attempt in ~190ms, so most 5xx a user
 * sees are recoverable by simply asking again. React Query call sites get this
 * for free via the defaults in lib/providers.tsx; this covers the places that
 * still use a bare fetch in a useEffect, where a single 503 otherwise puts an
 * error card in front of a paying user for a blip that would have cleared
 * itself.
 *
 * GET-shaped only: never point this at a POST/PATCH, where replaying a request
 * that may already have applied risks duplicates.
 *
 * A 4xx is returned as-is and never retried — it will not fix itself, and
 * callers rely on reading specific statuses such as 403 (plan-gated).
 */
export async function fetchWithRetry(
  input: string,
  init: RequestInit = {},
  attempts = 3
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, Math.min(250 * 2 ** (i - 1), 1_000)));
    try {
      const res = await fetch(input, init);
      if (res.ok || res.status < 500) return res;
      lastError = new Error(`${input} responded ${res.status}`);
      if (i === attempts - 1) return res;
    } catch (err) {
      lastError = err;
      if (i === attempts - 1) throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${input} failed`);
}

// ── Outbound HTTP ────────────────────────────────────────────────────────────

/**
 * `fetch` with a hard timeout.
 *
 * On Workers an outbound fetch with no AbortSignal hangs until the platform
 * kills the whole invocation, which surfaces to the user as a bare 500 with
 * no log line to trace it back to — see the 2026-08-14 audit, where 14 of 21
 * outbound calls (including both Lenco payment calls) were untimed.
 *
 * Aborts surface as an `AbortError`, which handleApiError maps to a 504.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  ms = 10_000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
