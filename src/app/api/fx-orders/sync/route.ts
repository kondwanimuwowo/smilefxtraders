import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchWithTimeout } from "@/lib/http";
import type { FxImageExtraction } from "@/types/fx-orders";

const client = new Anthropic();

const FETCH_HEADERS = {
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
};

// ── URL builder ───────────────────────────────────────────────────────────────

const MONTHS = [
  "january","february","march","april","may","june",
  "july","august","september","october","november","december",
];

// Every post-URL shape InvestingLive has used, newest first. They rotate
// slug formats every so often, so rather than guessing one we try each in
// turn (see fetchPostPage). To support a new shape, add an entry here.
const POST_SLUG_FORMATS: ((date: Date) => string)[] = [
  // Current (confirmed 2026-09-29): fx-option-expiries-for-29-september-10am-new-york-cut/
  (d) => `fx-option-expiries-for-${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}-10am-new-york-cut/`,
  // Until ~2026-07: same slug with a trailing -YYYYMMDD.
  (d) => {
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `fx-option-expiries-for-${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}-10am-new-york-cut-${d.getUTCFullYear()}${mm}${dd}/`;
  },
];

// Candidate post URLs for `date`, best first. The orders index is the most
// reliable source because it reflects whatever slug InvestingLive is using
// right now (path casing doesn't matter — /Orders/ and /orders/ resolve to
// the same page). The constructed slugs cover older dates that have
// scrolled off the index, or an index that can't be fetched.
async function findPostUrls(date: Date): Promise<string[]> {
  const candidates: string[] = [];
  const slugFragment = `fx-option-expiries-for-${date.getUTCDate()}-${MONTHS[date.getUTCMonth()]}-10am-new-york-cut`;

  try {
    const res = await fetchWithTimeout("https://investinglive.com/orders", { headers: FETCH_HEADERS }, 15_000);
    if (res.ok) {
      const html = await res.text();
      const match = html.match(new RegExp(`href="(?:https://investinglive\\.com)?(/orders/${slugFragment}[^"]*)"`, "i"));
      if (match?.[1]) candidates.push(`https://investinglive.com${match[1]}`);
    }
  } catch (err) {
    console.warn("[fx-orders/sync] orders index lookup failed, falling back to constructed URLs:", err);
  }

  for (const slug of POST_SLUG_FORMATS) {
    const url = `https://investinglive.com/orders/${slug(date)}`;
    if (!candidates.includes(url)) candidates.push(url);
  }
  return candidates;
}

// Fetches the first candidate URL that isn't a 404. Any other status (a 403
// from bot protection, a 5xx) is returned straight away: a different slug
// won't fix those, and hammering the site would only make blocking likelier.
async function fetchPostPage(date: Date): Promise<{ url: string; res: Response }> {
  const candidates = await findPostUrls(date);
  let last!: { url: string; res: Response };
  for (const url of candidates) {
    console.log("[fx-orders/sync] Fetching page:", url);
    const res = await fetchWithTimeout(url, { headers: FETCH_HEADERS }, 15_000);
    last = { url, res };
    if (res.status !== 404) break;
    await res.body?.cancel();
  }
  return last;
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

// Every filename format InvestingLive has used for the daily table image,
// in order of preference. They switch formats periodically, so the sync
// accepts any of them; to support a new one, add an entry here.
//
//  - `filename` is tested against the decoded filename (no path or query).
//  - `dated`: the first capture group is the expiry date, which must equal
//    the date being synced. Dated formats are the safest: they can never pick
//    up the banner or an older post's table from a "related posts" block.
//  - `path`, if set, must also match the full URL.
//
// Never add a catch-all. On 2026-08-10 InvestingLive began serving a
// generic banner ("FXO FX OPTION EXPIRIES.jpg") ahead of the chart, and for
// five straight days the vision model was handed that banner and asked to
// read option levels off it. It duly produced plausible-looking numbers —
// GBPUSD 1.5500 alongside 1.2700, duplicate strikes, spot prices vanishing
// — and nothing flagged it, because fabricated data looks exactly like real
// data once it is in the table.
interface ImageFormat {
  name:     string;
  filename: RegExp;
  dated:    boolean;
  path?:    RegExp;
}

const IMAGE_FORMATS: ImageFormat[] = [
  {
    // Since early 2026-09: "FXO 290926.jpg". Also accepts other separators
    // and date orders (FXO_29-09-2026.png, FXO-20260929.webp, …) — see
    // stampMatchesDate.
    name:     "FXO + date",
    filename: /^FXO[\s_+-]*(\d{1,4}[\s._-]?\d{1,2}[\s._-]?\d{2,4})\.(?:jpe?g|png|webp)$/i,
    dated:    true,
  },
  {
    // 2026-08 → early 2026-09: upload timestamp, e.g. "8-6-2026-1-53-02-pm.jpg".
    name:     "upload timestamp",
    filename: /^\d{1,2}-\d{1,2}-\d{4}-[\d-]+(?:am|pm)\.(?:jpe?g|png)$/i,
    dated:    false,
    path:     /^https:\/\/investinglive\.com\/cms\/media\/images\//i,
  },
  {
    // Before 2026-08 (old image CDN), preferring the 900px rendition.
    name:     "legacy CDN (900px)",
    filename: /^FXO.*_size900\.jpe?g$/i,
    dated:    false,
    path:     /^https:\/\/images\.investinglive\.com\/images\//i,
  },
  {
    name:     "legacy CDN",
    filename: /^FXO.*\.jpe?g$/i,
    dated:    false,
    path:     /^https:\/\/images\.investinglive\.com\/images\//i,
  },
];

// Never the table, whichever format it happens to match.
const BANNER_IMAGE = /FX[\s_-]*OPTION[\s_-]*EXPIRIES/i;

// Whether a filename date stamp denotes `date`. Separated stamps are read
// as D-M-Y or Y-M-D (2- or 4-digit year); bare digit runs as DDMMYY,
// DDMMYYYY, YYYYMMDD or YYMMDD. US month-first order is deliberately not
// accepted: for days 1–12 it's indistinguishable from day-first, and a
// wrong guess would silently file one day's levels under another.
function stampMatchesDate(stamp: string, date: Date): boolean {
  const d  = date.getUTCDate();
  const m  = date.getUTCMonth() + 1;
  const y  = date.getUTCFullYear();
  const p2 = (n: number) => String(n).padStart(2, "0");

  const parts = stamp.split(/[\s._-]+/).filter(Boolean).map(Number);
  if (parts.length === 3) {
    const year = (n: number) => (n < 100 ? 2000 + n : n);
    const [a, b, c] = parts;
    return (a === d && b === m && year(c) === y) || (year(a) === y && b === m && c === d);
  }

  const digits = stamp.replace(/\D/g, "");
  const yy = p2(y % 100);
  return [
    `${p2(d)}${p2(m)}${yy}`,
    `${p2(d)}${p2(m)}${y}`,
    `${y}${p2(m)}${p2(d)}`,
    `${yy}${p2(m)}${p2(d)}`,
  ].includes(digits);
}

// Every image URL referenced from an attribute on the page (src, data-src,
// srcset, og:image content, …), resolved against the page URL, in document
// order. Reads whole attribute values rather than matching URLs with one
// regex because filenames can contain raw spaces ("FXO 290926.jpg").
function findPageImages(pageHtml: string, pageUrl: string): { url: string; filename: string }[] {
  const found: { url: string; filename: string }[] = [];
  const attrs = pageHtml.matchAll(/\b(?:src|data-[\w-]*src|srcset|data-[\w-]*srcset|content|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi);

  for (const a of attrs) {
    const value = (a[1] ?? a[2] ?? "").trim();
    // srcset: "url 900w, url 300w" — split entries, drop width/density descriptors.
    const refs = value.split(/,\s+/).map((r) => r.trim().replace(/\s+\d+(?:\.\d+)?[wx]$/i, ""));

    for (const ref of refs) {
      if (!/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(ref)) continue;
      try {
        const url = new URL(ref.replace(/ /g, "%20"), pageUrl);
        const filename = decodeURIComponent(url.pathname.split("/").pop() ?? "");
        const href = url.toString();
        if (!found.some((f) => f.url === href)) found.push({ url: href, filename });
      } catch {
        // Malformed URL or escape sequence — skip.
      }
    }
  }
  return found;
}

// Picks the table image for `targetDate`: the first image matching the
// most preferred format that has one. Deliberately returns null rather than
// guessing when nothing matches — traders size positions off these levels,
// so publishing nothing (a visible gap) beats publishing invented strikes.
function extractImageUrl(pageHtml: string, pageUrl: string, targetDate: Date): { url: string; format: string } | null {
  const images   = findPageImages(pageHtml, pageUrl).filter((img) => !BANNER_IMAGE.test(img.filename));
  const wrongDay: string[] = [];

  for (const format of IMAGE_FORMATS) {
    for (const img of images) {
      const m = img.filename.match(format.filename);
      if (!m || (format.path && !format.path.test(img.url))) continue;
      if (format.dated && !stampMatchesDate(m[1], targetDate)) {
        wrongDay.push(img.filename);
        continue;
      }
      return { url: img.url, format: format.name };
    }
  }

  console.error(
    `[fx-orders/sync] no image matched a known filename format; refusing to extract. ` +
    (wrongDay.length ? `Dated images for other days: ${wrongDay.join(", ")}. ` : "") +
    `Images on page: ${images.map((i) => i.filename).join(", ") || "none"}`
  );
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
    const { url: pageUrl, res: pageRes } = await fetchPostPage(targetDate);

    if (!pageRes.ok) {
      // A 404 here is routine, not a failure: InvestingLive typically doesn't
      // publish the day's FXO post until ~07:00-07:30 ET, so the 4-hourly
      // cron's overnight/early-morning runs (e.g. 00:00/04:00/08:00 UTC) hit
      // this every day and self-heal on the next run. Returning 200 here
      // (like the "already synced" short-circuit below) keeps cron-jobs.org's
      // health check green for this expected case — previously this returned
      // 502, which made every early-morning run show up as a false-alarm
      // "Bad Gateway" failure in the cron dashboard.
      if (pageRes.status === 404) {
        return NextResponse.json({
          ok: true,
          skipped: true,
          reason: `Today's FXO post not published yet (InvestingLive returned 404) — expected before ~07:00 ET, will retry next run.`,
          url: pageUrl,
        });
      }

      const hint =
        pageRes.status === 403 ? "InvestingLive is blocking automated requests (bot protection). Use the Upload Image button instead: download the FXO image from InvestingLive manually and upload it here." :
        pageRes.status === 429 ? "Rate limited by InvestingLive. Wait a few minutes before retrying." :
        `InvestingLive returned HTTP ${pageRes.status}. Use Upload Image as a fallback.`;
      return NextResponse.json({ error: hint, status: pageRes.status, url: pageUrl }, { status: 502 });
    }

    const html     = await pageRes.text();
    const image = extractImageUrl(html, pageUrl, targetDate);

    if (!image) {
      return NextResponse.json({ error: "Could not find FXO image URL in page HTML", url: pageUrl }, { status: 422 });
    }

    const imageUrl = image.url;
    console.log(`[fx-orders/sync] Extracted image URL (${image.format} format):`, imageUrl);

    // Short-circuit: InvestingLive image URLs are unique per post, so if
    // today's target date already has a record from this exact image, the
    // table hasn't changed since the last sync — skip the Claude Vision call
    // entirely. Scoped to tradingDays[0] (today), not just the imageUrl,
    // because a single image can span multiple day-bands (e.g. a Friday post
    // that also covers Monday over a weekend gap) — an earlier run that only
    // stored one of those bands must not block a later run from storing the
    // other, which a bare imageUrl match would silently do. A re-post with
    // updated levels gets a new image URL and syncs normally. Bypass with
    // ?force=1.
    if (!force) {
      const alreadySynced = await prisma.fxOptionExpiry.findFirst({
        where:  { imageUrl, expiryDate: tradingDays[0] },
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
