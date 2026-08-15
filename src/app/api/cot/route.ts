import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-error";
import { loadCotOverview } from "@/lib/cot/overview";

// GET /api/cot — overview cards. Computation lives in lib/cot/overview.ts,
// shared with the page's server prefetch. Translates the loader's `locked`
// result back into the 403 shape CotReports' lock screen expects.

export async function GET() {
  try {
    const result = await loadCotOverview();
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
