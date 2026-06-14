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

// ── Claude Vision extraction prompt ──────────────────────────────────────────

const EXTRACTION_PROMPT = `This image shows a table of FX option expiries at the 10am New York Cut published by InvestingLive (formerly ForexLive).

Extract ALL data from the table and return ONLY a valid JSON object — no markdown fences, no explanation, nothing else.

Table structure:
- First row: empty cell, then currency pair names as column headers (EUR/USD, USD/JPY, GBP/USD, USD/CHF, USD/CAD, AUD/USD, NZD/USD, EUR/GBP, etc.)
- Second row: "Spot Price" label, then current spot price for each pair
- Remaining rows: day + date label (e.g. "Tuesday 09/06"), then cells with option levels
- Each level entry: "- 1.1470 (€580m)" = price 1.1470, currency €, notional 580, unit m (million)
- Entries shown in BOLD are large/notable expiries
- Grey/dark cells with no text = no expiry for that pair on that day

Return this exact JSON:
{
  "spotPrices": {
    "EURUSD": "1.1545",
    "USDJPY": "160.14"
  },
  "days": [
    {
      "dayName": "Tuesday",
      "date": "09/06",
      "levels": {
        "EURUSD": [
          { "price": "1.1470", "notional": "580", "currency": "€", "unit": "m", "large": false },
          { "price": "1.1570", "notional": "1.1", "currency": "€", "unit": "bn", "large": true }
        ]
      }
    }
  ]
}

Rules:
- Normalize pair names: remove the slash — EUR/USD → EURUSD, USD/JPY → USDJPY, etc.
- Only include pairs that actually have level data in each day's "levels" object (skip empty cells entirely)
- "large": true if the entry appears BOLD or highlighted in the table
- Currency symbols: € for EUR pairs, $ for USD pairs, £ for GBP pairs, A$ for AUD/USD, NZ$ for NZD/USD
- Include ALL days shown (usually 2 — today and next trading day)
- The "spotPrices" keys must use normalized pair names`;

// ── Image extraction from InvestingLive page ──────────────────────────────────

async function extractImageUrl(pageHtml: string): Promise<string | null> {
  // The FXO image is in a <figure class="content-data__image"> with alt="FXO DD-MM"
  // It uses data-src (lazy loaded) and the URL contains "FXO%20" or "FXO "
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

// ── Parse expiry date from "DD/MM" string ─────────────────────────────────────

function parseExpiryDate(dateStr: string, contextYear: number): Date {
  const [dd, mm] = dateStr.split("/").map(Number);
  return new Date(Date.UTC(contextYear, mm - 1, dd));
}

// ── Claude Vision call ────────────────────────────────────────────────────────

async function extractFromImage(imageUrl: string): Promise<FxImageExtraction> {
  const response = await client.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: [
        {
          type:   "image",
          source: { type: "url", url: imageUrl },
        },
        {
          type: "text",
          text: EXTRACTION_PROMPT,
        },
      ],
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON found in Claude response: ${text.slice(0, 200)}`);

  return JSON.parse(match[0]) as FxImageExtraction;
}

// ── Upsert records to DB ──────────────────────────────────────────────────────

async function storeExtraction(
  extraction: FxImageExtraction,
  contextYear: number,
  sourceUrl:   string,
  imageUrl:    string,
): Promise<number> {
  let count = 0;

  // Any date strictly before UTC midnight today is considered "settled" —
  // never overwrite it, even if a new image mentions it as a past entry.
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);

  for (const day of extraction.days) {
    const expiryDate = parseExpiryDate(day.date, contextYear);
    const isPast     = expiryDate < todayUtc;

    for (const [pair, levels] of Object.entries(day.levels)) {
      if (!levels.length) continue;

      const spotPrice  = extraction.spotPrices?.[pair] ?? null;
      const levelsJson = levels as unknown as Parameters<typeof prisma.fxOptionExpiry.create>[0]["data"]["levels"];

      if (isPast) {
        // Past date — only insert if no record exists yet; never overwrite.
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
        // Today or future — always upsert with latest data.
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

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Cron-only protection: only enforce the secret when the request comes from
  // outside the browser (i.e. a cron job). Requests originating from the app
  // itself (same origin, no x-cron-secret header) are allowed through because
  // the page is already guarded by Supabase auth via proxy.ts.
  const secret  = req.headers.get("x-cron-secret");
  const origin  = req.headers.get("origin");
  const host    = req.headers.get("host");
  const sameOrigin = origin ? origin.includes(host ?? "") : true;

  if (process.env.CRON_SECRET && !sameOrigin && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date"); // optional: YYYY-MM-DD

    const targetDate = dateParam
      ? new Date(`${dateParam}T12:00:00.000Z`)
      : new Date();

    const pageUrl  = buildInvestingLiveUrl(targetDate);
    const year     = targetDate.getUTCFullYear();

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
      return NextResponse.json(
        { error: hint, status: pageRes.status, url: pageUrl },
        { status: 502 },
      );
    }

    const html     = await pageRes.text();
    const imageUrl = await extractImageUrl(html);

    if (!imageUrl) {
      return NextResponse.json(
        { error: "Could not find FXO image URL in page HTML", url: pageUrl },
        { status: 422 },
      );
    }

    console.log("[fx-orders/sync] Extracted image URL:", imageUrl);

    const extraction = await extractFromImage(imageUrl);

    console.log("[fx-orders/sync] Extracted days:", extraction.days.length);

    const saved = await storeExtraction(extraction, year, pageUrl, imageUrl);

    return NextResponse.json({
      ok:       true,
      date:     targetDate.toISOString().slice(0, 10),
      imageUrl,
      days:     extraction.days.map((d) => d.date),
      saved,
    });
  } catch (err) {
    console.error("[fx-orders/sync]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}

// Manual image upload: POST /api/fx-orders/sync with multipart form
// Field: image (File), date (YYYY-MM-DD optional)
// Manual upload is user-initiated from the browser — no cron secret needed.
// Auth is handled by the Supabase session (proxy.ts guards the app shell).
export async function PUT(req: NextRequest) {

  try {
    const form       = await req.formData();
    const imageFile  = form.get("image") as File | null;
    const dateParam  = form.get("date") as string | null;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const targetDate = dateParam ? new Date(`${dateParam}T12:00:00.000Z`) : new Date();
    const year       = targetDate.getUTCFullYear();

    // Convert file to base64
    const buffer = await imageFile.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mediaType = (imageFile.type || "image/jpeg") as "image/jpeg" | "image/png";

    const response = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [{
        role: "user",
        content: [
          {
            type:   "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: EXTRACTION_PROMPT },
        ],
      }],
    });

    const text  = response.content[0].type === "text" ? response.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON in response");

    const extraction = JSON.parse(match[0]) as FxImageExtraction;
    const saved      = await storeExtraction(extraction, year, "manual-upload", "manual-upload");

    return NextResponse.json({ ok: true, days: extraction.days.map((d) => d.date), saved });
  } catch (err) {
    console.error("[fx-orders/sync PUT]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 },
    );
  }
}
