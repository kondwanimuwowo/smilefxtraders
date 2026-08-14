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
