import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { loadCotOverview } from "@/lib/cot/overview";

// GET /api/cot — overview cards. Computation lives in lib/cot/overview.ts,
// shared with the page's server prefetch. Translates the loader's `locked`
// result back into the 403 shape CotReports' lock screen expects.

export async function GET() {
  try {
    const result = await loadCotOverview();
    // Before the locked check: "couldn't verify you" must not be answered with
    // the upgrade wall a paying member would then be staring at. 503 is
    // retryable and the client retries it; 403 is treated as settled.
    if (result.unavailable) {
      return NextResponse.json(
        { error: "Could not verify your session. Please try again.", retry: true },
        { status: 503 },
      );
    }
    if (result.locked) {
      return NextResponse.json(
        { error: "COT Reports requires an Edge or Pro plan.", upgrade: true },
        { status: 403 },
      );
    }
    return NextResponse.json(result.entries);
  } catch (err) {
    return handleApiError("cot", err);
  }
}
