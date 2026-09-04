import { NextResponse } from "next/server";
import { isWaitlistMode } from "@/lib/site-gate";

// Public, tiny, no auth. The one client component that needs the site-gate
// flag (MarketingNav) fetches this on mount, mirroring the existing pattern
// it already uses for auth state -- a plain (non-NEXT_PUBLIC_) env var isn't
// readable from client code, and this keeps the flag flip effective
// immediately (read fresh per-request) rather than baked in at build time.
export async function GET() {
  return NextResponse.json({ waitlistMode: isWaitlistMode() });
}
