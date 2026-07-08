import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapCountryToCurrency, mapEventTitleToIndicator, TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";

// Finnhub push webhook — economic calendar event updates. Finnhub disables
// the endpoint if it fails to acknowledge (2xx) over consecutive days, so
// this ALWAYS returns 2xx once the secret is verified, regardless of what
// happens while processing the payload. Acknowledge first, do real work after
// (per Finnhub's own instructions), and never let a parse/DB error surface as
// a non-2xx.
//
// The exact payload shape for calendar push events hasn't been observed live
// yet (no real event has landed since registering this endpoint) — this
// defensively tries a few plausible shapes and logs the raw body on anything
// unrecognized so the shape can be confirmed/adjusted from real traffic.

interface KnownEventShape {
  event?: string;
  country?: string;
  actual?: number | string | null;
  estimate?: number | string | null;
  prev?: number | string | null;
  impact?: string;
  time?: string;
}

function tryExtractCalendarEvent(body: unknown): KnownEventShape | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  // Shape A: bare event object at top level
  if (typeof b.event === "string" && typeof b.country === "string") {
    return b as KnownEventShape;
  }
  // Shape B: { type: "economicCalendar", data: {...} }
  if (b.data && typeof b.data === "object") {
    const d = b.data as Record<string, unknown>;
    if (typeof d.event === "string" && typeof d.country === "string") {
      return d as KnownEventShape;
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("X-Finnhub-Secret");
  if (secret !== process.env.FINNHUB_WEBHOOK_SECRET) {
    // Not our webhook / bad secret — safe to reject, this isn't the
    // consecutive-failure case Finnhub warns about (that's for OUR endpoint
    // failing to ack THEIR legitimate pushes).
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    // Unparseable body — still ack so the endpoint doesn't get disabled.
    console.warn("[webhooks/finnhub] non-JSON payload received");
    return NextResponse.json({ ok: true });
  }

  // Acknowledge immediately, then process. Any failure below is logged, never
  // thrown back as a non-2xx.
  const ack = NextResponse.json({ ok: true });

  void (async () => {
    try {
      const ev = tryExtractCalendarEvent(raw);
      if (!ev || !ev.event || !ev.country || !ev.time) {
        console.warn("[webhooks/finnhub] unrecognized payload shape:", JSON.stringify(raw).slice(0, 500));
        return;
      }

      const currency = mapCountryToCurrency(ev.country);
      if (!currency || !TRACKED_CURRENCIES.includes(currency as (typeof TRACKED_CURRENCIES)[number])) {
        return;
      }

      const category = mapEventTitleToIndicator(ev.event);
      const externalId = `finnhub:${ev.country}:${ev.event}:${ev.time}`;
      const eventTime = new Date(ev.time.replace(" ", "T") + (ev.time.includes("Z") ? "" : "Z"));
      const actual = ev.actual !== undefined && ev.actual !== null ? String(ev.actual) : null;

      const data = {
        externalId,
        currency,
        title: ev.event,
        category: category ?? undefined,
        impact: (ev.impact ?? "medium").toLowerCase(),
        actual,
        forecast: ev.estimate !== undefined && ev.estimate !== null ? String(ev.estimate) : null,
        previous: ev.prev !== undefined && ev.prev !== null ? String(ev.prev) : null,
        eventTime,
        releasedAt: actual !== null ? new Date() : null,
      };

      await prisma.economicEvent.upsert({ where: { externalId }, create: data, update: data });
      console.log(`[webhooks/finnhub] upserted ${externalId}`);
    } catch (err) {
      console.error("[webhooks/finnhub] processing failed", err);
    }
  })();

  return ack;
}
