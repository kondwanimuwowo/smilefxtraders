import { NextResponse, type NextRequest } from "next/server";
import { createClient, getAuthState } from "@/lib/supabase/server";
import { getInstruments } from "@/lib/server/getInstruments";
import { getCandles, CandlesError } from "@/lib/spotware/candles";
import { TRENDBAR_PERIOD, PERIOD_SECONDS, type TrendbarPeriod } from "@/lib/spotware/messages";
import { handleApiError, AuthUnavailableError } from "@/lib/api-error";

// Historical candles for the trade and alert charts.
//
//   GET /api/candles?pair=EURUSD&period=H1&from=<iso>&to=<iso>[&count=]
//
// Unlike /api/fx-orders/spot this is gated: it costs a broker request against a
// 5/sec budget and there is no anonymous use for it. That gate is only safe
// because getAuthState now separates "signed out" from "could not verify" —
// see 2171efb, where collapsing the two showed paying members an upgrade wall.

const MAX_BARS = 14_000;

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const auth = await getAuthState(supabase);
    if (auth.state === "unknown") throw new AuthUnavailableError();
    if (auth.state === "anonymous") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = req.nextUrl.searchParams;
    const pair   = (params.get("pair") ?? "").toUpperCase();
    const period = params.get("period") as TrendbarPeriod | null;
    const fromP  = params.get("from");
    const toP    = params.get("to");
    const countP = params.get("count");

    if (!period || !(period in TRENDBAR_PERIOD)) {
      return NextResponse.json(
        { error: `"period" must be one of ${Object.keys(TRENDBAR_PERIOD).join(", ")}` },
        { status: 400 },
      );
    }

    // Check the pair against our own instruments before spending a broker
    // request on it — an arbitrary string would otherwise reach the socket.
    const instruments = await getInstruments().catch(() => []);
    if (instruments.length && !instruments.some((i) => i.symbol === pair)) {
      return NextResponse.json({ error: `Unknown pair "${pair}"` }, { status: 404 });
    }

    const from = fromP ? new Date(fromP) : null;
    const to   = toP   ? new Date(toP)   : null;
    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
      return NextResponse.json({ error: '"from" and "to" must be dates with to > from' }, { status: 400 });
    }

    const count = countP == null ? undefined : Number(countP);
    if (count != null && (!Number.isInteger(count) || count < 1 || count > MAX_BARS)) {
      return NextResponse.json({ error: `"count" must be 1..${MAX_BARS}` }, { status: 400 });
    }

    // Reject a window that could never fit in one response rather than letting
    // the broker silently truncate it and the chart quietly lose its left edge.
    const requested = Math.ceil((to.getTime() - from.getTime()) / (PERIOD_SECONDS[period] * 1_000));
    if (requested > MAX_BARS) {
      return NextResponse.json(
        { error: `That range is ${requested} ${period} bars; the maximum is ${MAX_BARS}.` },
        { status: 400 },
      );
    }

    const result = await getCandles({ symbol: pair, period, from, to, count });

    // Closed bars never change. A window ending in the past can be held by the
    // browser; one running up to now is only good until the forming bar closes.
    const maxAge = to.getTime() <= Date.now() ? 86_400 : PERIOD_SECONDS[period];

    return NextResponse.json(result, {
      headers: { "Cache-Control": `private, max-age=${maxAge}` },
    });
  } catch (err) {
    if (err instanceof CandlesError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return handleApiError("candles", err);
  }
}
