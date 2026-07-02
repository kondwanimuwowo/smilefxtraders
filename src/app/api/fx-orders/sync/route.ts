import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FxImageExtraction } from "@/types/fx-orders";

const client = new Anthropic();

// ── URL builder ───────────────────────────────────────────────────────────────

const MONTHS = [
  "january","february","march","april","may","june",
  "july","august","september","october","november","december",
];

function buildInvestingLiveUrl(date: Date): string {
  const day   = date.getUTCDate();
  const month = MONTHS[date.getUTCMonth()];
  const y     = date.getUTCFullYear();
  const mm    = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd    = String(date.getUTCDate()).padStart(2, "0");
  return `https://investinglive.com/Orders/fx-option-expiries-for-${day}-${month}-10am-new-york-cut-${y}${mm}${dd}/`;
}

// ── Trading-day sequence ──────────────────────────────────────────────────────

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

// Returns up to `count` trading days (Mon–Fri) starting from `from`.
function tradingDaySequence(from: Date, count: number): Date[] {
  const days: Date[] = [];
  let cursor = utcMidnight(from);
  while (days.length < count) {
    if (!isWeekend(cursor)) days.push(new Date(cursor));
    cursor = new Date(cursor);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

// ── Claude Vision extraction prompt ──────────────────────────────────────────
// Vision is only asked to count rows and extract price levels.
// Dates are never read from the image — Vision returns a 0-based rowIndex,
// and we map rowIndex → tradingDays[rowIndex] entirely in server code.
// This eliminates all OCR digit-confusion on dates (5↔2, 6↔8, etc.).

function buildExtractionPrompt(tradingDays: Date[]): string {
  const WEEKDAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const rowList = tradingDays
    .map((d, i) => {
      const name = WEEKDAY_NAMES[d.getUTCDay()];
      const dd   = String(d.getUTCDate()).padStart(2, "0");
      const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
      return `  Row ${i} → ${name} ${dd}/${mm}`;
    })
    .join("\n");

  return `This image shows a table of FX option expiries at the 10am New York Cut published by InvestingLive.

Extract ALL price level data and return ONLY a valid JSON object — no markdown fences, no explanation.

Table structure:
- Row 0 (header): pair names — EUR/USD, USD/JPY, GBP/USD, USD/CHF, USD/CAD, AUD/USD, NZD/USD, EUR/GBP, etc.
- Row 1: Spot Price for each pair
- Rows 2+: one trading-day band per row, containing option expiry levels per pair

For the trading-day bands (rows 2 onwards), the date label in the image is for reference only.
Your output MUST use these 0-based row indices instead (0 = first trading-day band, top of table):
${rowList}

The image may show anywhere from 1 to ${tradingDays.length} trading-day bands.
Only include entries for bands that actually appear in the image.

Each level cell contains entries like "- 1.1470 (€580m)":
  price = 1.1470, currency = €, notional = 580, unit = m
  "large": true if the entry is BOLD

Return this exact JSON shape:
{
  "spotPrices": { "EURUSD": "1.1545", "USDJPY": "160.14" },
  "days": [
    {
      "rowIndex": 0,
      "levels": {
        "EURUSD": [
          { "price": "1.1470", "notional": "580", "currency": "€", "unit": "m", "large": false },
          { "price": "1.1570", "notional": "1.1", "currency": "€", "unit": "bn", "large": true }
        ]
      }
    },
    {
      "rowIndex": 1,
      "levels": {
        "USDJPY": [
          { "price": "158.00", "notional": "2.2", "currency": "$", "unit": "bn", "large": false }
        ]
      }
    }
  ]
}

Rules:
- Normalize pair names: remove slash — EUR/USD → EURUSD, GBP/USD → GBPUSD, etc.
- Only include pairs with actual level data (skip grey/empty cells entirely)
- "large": true only for BOLD entries
- Currency symbols: € for EUR notional, $ for USD, £ for GBP, A$ for AUD/USD, NZ$ for NZD/USD
- DO NOT include "dayName" or "date" fields — only "rowIndex" and "levels"
- spotPrices keys use normalized pair names`;
}

// ── Image extraction from InvestingLive page ──────────────────────────────────

async function extractImageUrl(pageHtml: string): Promise<string | null> {
  const patterns = [
    /data-src="(https:\/\/images\.investinglive\.com\/images\/FXO[^"]+_size900\.jpg)"/,
    /data-src="(https:\/\/images\.investinglive\.com\/images\/FXO[^"]+\.jpg)"/,
    /og:image[^>]*content="(https:\/\/images\.investinglive\.com\/images\/FXO[^"]+\.jpg)"/,
  ];
  for (const pattern of patterns) {
    const m = pageHtml.match(pattern);
    if (m?.[1]) return m[1];
  }
  return null;
}

// ── Claude Vision call ────────────────────────────────────────────────────────

type ImageSource =
  | { type: "url";    url: string }
  | { type: "base64"; media_type: "image/jpeg" | "image/png"; data: string };

async function extractFromImage(
  tradingDays: Date[],
  source:      ImageSource,
): Promise<FxImageExtraction> {
  const prompt = buildExtractionPrompt(tradingDays);

  const response = await client.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: [
        { type: "image", source },
        { type: "text",  text: prompt },
      ],
    }],
  });

  const text  = response.content[0].type === "text" ? response.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON found in Claude response: ${text.slice(0, 200)}`);

  const extraction = JSON.parse(match[0]) as FxImageExtraction;

  // Log the raw extraction so we can verify row mapping in dev
  console.log("[fx-orders/sync] raw extraction days:", JSON.stringify(extraction.days.map(d => ({
    rowIndex: d.rowIndex,
    pairs:    Object.keys(d.levels),
  }))));

  return extraction;
}

// ── Upsert records to DB ──────────────────────────────────────────────────────
// Date assignment is fully deterministic: tradingDays[day.rowIndex].
// We never ask Vision to parse or return dates — rowIndex is the only coupling.

async function storeExtraction(
  extraction:  FxImageExtraction,
  tradingDays: Date[],
  sourceUrl:   string,
  imageUrl:    string,
): Promise<number> {
  let count = 0;

  const todayUtc = utcMidnight(new Date());

  for (const day of extraction.days) {
    const expiryDate = tradingDays[day.rowIndex];

    if (!expiryDate) {
      console.warn(`[fx-orders/sync] rowIndex ${day.rowIndex} out of bounds (max ${tradingDays.length - 1}) — skipped`);
      continue;
    }
    // Sanity-check: trading-day sequence never includes weekends, but guard anyway.
    if (isWeekend(expiryDate)) {
      console.warn(`[fx-orders/sync] rowIndex ${day.rowIndex} resolved to weekend ${expiryDate.toISOString().slice(0,10)} — skipped`);
      continue;
    }

    const isPast = expiryDate < todayUtc;

    for (const [pair, levels] of Object.entries(day.levels)) {
      if (!levels.length) continue;

      const spotPrice  = extraction.spotPrices?.[pair] ?? null;
      const levelsJson = levels as unknown as Parameters<typeof prisma.fxOptionExpiry.create>[0]["data"]["levels"];

      if (isPast) {
        const existing = await prisma.fxOptionExpiry.findUnique({
          where:  { expiryDate_pair: { expiryDate, pair } },
          select: { id: true },
        });
        if (!existing) {
          await prisma.fxOptionExpiry.create({
            data: { expiryDate, pair, spotPrice, levels: levelsJson, sourceUrl, imageUrl },
          });
          count++;
        }
      } else {
        await prisma.fxOptionExpiry.upsert({
          where:  { expiryDate_pair: { expiryDate, pair } },
          create: { expiryDate, pair, spotPrice, levels: levelsJson, sourceUrl, imageUrl },
          update: { spotPrice, levels: levelsJson, imageUrl, fetchedAt: new Date() },
        });
        count++;
      }
    }
  }

  return count;
}

// ── Route: POST (auto-sync from InvestingLive) ────────────────────────────────

export async function POST(req: NextRequest) {
  const secret    = req.headers.get("x-cron-secret");
  const origin    = req.headers.get("origin");
  const host      = req.headers.get("host");
  const sameOrigin = origin ? origin.includes(host ?? "") : true;

  if (process.env.CRON_SECRET && !sameOrigin && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const force     = searchParams.get("force") === "1";

    const targetDate = dateParam
      ? new Date(`${dateParam}T12:00:00.000Z`)
      : new Date();

    const tradingDays = tradingDaySequence(targetDate, 7);
    const pageUrl     = buildInvestingLiveUrl(targetDate);

    console.log("[fx-orders/sync] Fetching page:", pageUrl);

    const pageRes = await fetch(pageUrl, {
      headers: {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control":   "no-cache",
        "Pragma":          "no-cache",
        "Referer":         "https://www.google.com/",
        "Sec-Fetch-Dest":  "document",
        "Sec-Fetch-Mode":  "navigate",
        "Sec-Fetch-Site":  "cross-site",
      },
    });

    if (!pageRes.ok) {
      const hint =
        pageRes.status === 403 ? "InvestingLive is blocking automated requests (bot protection). Use the Upload Image button instead — download the FXO image from InvestingLive manually and upload it here." :
        pageRes.status === 404 ? `Page not found — today's FXO post may not have been published yet. Try again after 07:00 EST. URL tried: ${pageUrl}` :
        pageRes.status === 429 ? "Rate limited by InvestingLive. Wait a few minutes before retrying." :
        `InvestingLive returned HTTP ${pageRes.status}. Use Upload Image as a fallback.`;
      return NextResponse.json({ error: hint, status: pageRes.status, url: pageUrl }, { status: 502 });
    }

    const html     = await pageRes.text();
    const imageUrl = await extractImageUrl(html);

    if (!imageUrl) {
      return NextResponse.json({ error: "Could not find FXO image URL in page HTML", url: pageUrl }, { status: 422 });
    }

    console.log("[fx-orders/sync] Extracted image URL:", imageUrl);

    // Short-circuit: InvestingLive image URLs are unique per post, so if any
    // stored record already came from this exact image, the table hasn't
    // changed since the last sync — skip the Claude Vision call entirely.
    // A re-post with updated levels gets a new image URL and syncs normally.
    // Bypass with ?force=1.
    if (!force) {
      const alreadySynced = await prisma.fxOptionExpiry.findFirst({
        where:  { imageUrl },
        select: { id: true },
      });
      if (alreadySynced) {
        console.log("[fx-orders/sync] Image already synced — skipping Claude call.");
        return NextResponse.json({
          ok:      true,
          skipped: true,
          reason:  "This image has already been synced. Pass ?force=1 to re-extract.",
          date:    targetDate.toISOString().slice(0, 10),
          imageUrl,
        });
      }
    }

    const extraction = await extractFromImage(tradingDays, { type: "url", url: imageUrl });

    console.log("[fx-orders/sync] Extracted days:", extraction.days.length);

    const saved = await storeExtraction(extraction, tradingDays, pageUrl, imageUrl);

    return NextResponse.json({
      ok:       true,
      date:     targetDate.toISOString().slice(0, 10),
      imageUrl,
      days:     extraction.days.map((d) => ({
        rowIndex: d.rowIndex,
        date:     tradingDays[d.rowIndex]?.toISOString().slice(0, 10) ?? "unknown",
        pairs:    Object.keys(d.levels),
      })),
      saved,
    });
  } catch (err) {
    console.error("[fx-orders/sync]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Sync failed" }, { status: 500 });
  }
}

// ── Route: PUT (manual image upload) ─────────────────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const form      = await req.formData();
    const imageFile = form.get("image") as File | null;
    const dateParam = form.get("date") as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const targetDate  = dateParam ? new Date(`${dateParam}T12:00:00.000Z`) : new Date();
    const tradingDays = tradingDaySequence(targetDate, 7);

    const buffer    = await imageFile.arrayBuffer();
    const base64    = Buffer.from(buffer).toString("base64");
    const mediaType = (imageFile.type || "image/jpeg") as "image/jpeg" | "image/png";

    const extraction = await extractFromImage(
      tradingDays,
      { type: "base64", media_type: mediaType, data: base64 },
    );
    const saved = await storeExtraction(extraction, tradingDays, "manual-upload", "manual-upload");

    return NextResponse.json({
      ok:   true,
      days: extraction.days.map((d) => ({
        rowIndex: d.rowIndex,
        date:     tradingDays[d.rowIndex]?.toISOString().slice(0, 10) ?? "unknown",
        pairs:    Object.keys(d.levels),
      })),
      saved,
    });
  } catch (err) {
    console.error("[fx-orders/sync PUT]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
