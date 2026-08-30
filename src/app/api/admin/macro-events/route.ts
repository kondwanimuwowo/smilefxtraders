import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireInstructor } from "@/lib/admin-guard";
import { handleApiError, readJsonBody, parseDate, requireString, BadRequestError } from "@/lib/api-error";
import { IndicatorType } from "@/generated/prisma/client";
import { TRACKED_CURRENCIES } from "@/lib/macro/indicatorMap";

// Manual entry for the two series no automated source covers cleanly: GBP
// CPI (ONS's new API only exposes CPIH, a different measure the BoE doesn't
// target) and NZD CPI (Stats NZ's API returned 502 on every endpoint tried).
// Stored as EconomicEvent rows, not MacroIndicatorSnapshot — with both
// actual and forecast populated, scoring.ts's buildIndicatorReading picks
// these up via the same "surprise" path a real calendar release uses
// (classifySurprise() → "high" confidence), so no changes to the scoring or
// confidence layers were needed for this to slot in cleanly.
//
// `externalId` has no source-specific constraint in the schema (just a
// unique string), so manual rows are tagged "manual:<uuid>" — this route
// only ever touches rows with that prefix, never a real Finnhub-sourced one.

const MANUAL_PREFIX = "manual:";

function assertManual(externalId: string) {
  if (!externalId.startsWith(MANUAL_PREFIX)) {
    throw new BadRequestError("This entry did not come from manual entry and cannot be edited here.");
  }
}

export async function GET() {
  try {
    await requireInstructor();
    const events = await prisma.economicEvent.findMany({
      where: { externalId: { startsWith: MANUAL_PREFIX } },
      orderBy: { eventTime: "desc" },
    });
    return NextResponse.json(events);
  } catch (err) {
    return handleApiError("admin/macro-events:GET", err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireInstructor();
    const body = await readJsonBody<Record<string, unknown>>(req);

    const currency = requireString(body.currency, "currency").toUpperCase();
    if (!TRACKED_CURRENCIES.includes(currency as (typeof TRACKED_CURRENCIES)[number])) {
      throw new BadRequestError(`"currency" must be one of ${TRACKED_CURRENCIES.join(", ")}.`);
    }
    const title = requireString(body.title, "title");
    const category = body.category as IndicatorType | null;
    if (category && !Object.values(IndicatorType).includes(category)) {
      throw new BadRequestError(`"category" must be a valid indicator type.`);
    }
    const impact = requireString(body.impact, "impact");
    const eventTime = parseDate(body.eventTime, "eventTime");
    if (!eventTime) throw new BadRequestError(`"eventTime" is required.`);

    const actual = (body.actual as string | null) || null;
    const forecast = (body.forecast as string | null) || null;
    const previous = (body.previous as string | null) || null;

    const event = await prisma.economicEvent.create({
      data: {
        externalId: `${MANUAL_PREFIX}${randomUUID()}`,
        currency,
        title,
        category,
        impact,
        actual,
        forecast,
        previous,
        eventTime,
        releasedAt: actual ? new Date() : null,
      },
    });

    if (actual && forecast) {
      void fetch(`${req.nextUrl.origin}/api/macro/scores/recompute?currency=${currency}`, {
        method: "POST",
        headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
      }).catch((err) => console.error("[admin/macro-events] recompute trigger failed", err));
    }

    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return handleApiError("admin/macro-events:POST", err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireInstructor();
    const body = await readJsonBody<Record<string, unknown>>(req);
    const id = requireString(body.id, "id");

    const existing = await prisma.economicEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    assertManual(existing.externalId);

    const currency = body.currency ? requireString(body.currency, "currency").toUpperCase() : existing.currency;
    const eventTime = body.eventTime !== undefined ? parseDate(body.eventTime, "eventTime") : existing.eventTime;
    const actual = body.actual !== undefined ? ((body.actual as string | null) || null) : existing.actual;
    const forecast = body.forecast !== undefined ? ((body.forecast as string | null) || null) : existing.forecast;

    const event = await prisma.economicEvent.update({
      where: { id },
      data: {
        currency,
        title: body.title !== undefined ? requireString(body.title, "title") : undefined,
        category: body.category !== undefined ? (body.category as IndicatorType | null) : undefined,
        impact: body.impact !== undefined ? requireString(body.impact, "impact") : undefined,
        actual,
        forecast,
        previous: body.previous !== undefined ? ((body.previous as string | null) || null) : undefined,
        eventTime: eventTime ?? undefined,
        releasedAt: actual && !existing.releasedAt ? new Date() : undefined,
      },
    });

    if (actual && forecast) {
      void fetch(`${req.nextUrl.origin}/api/macro/scores/recompute?currency=${currency}`, {
        method: "POST",
        headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
      }).catch((err) => console.error("[admin/macro-events] recompute trigger failed", err));
    }

    return NextResponse.json(event);
  } catch (err) {
    return handleApiError("admin/macro-events:PATCH", err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireInstructor();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const existing = await prisma.economicEvent.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    assertManual(existing.externalId);

    await prisma.economicEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError("admin/macro-events:DELETE", err);
  }
}
