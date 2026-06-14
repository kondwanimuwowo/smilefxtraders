# Cron Jobs — Smile FX Traders

All cron jobs run via **cron-jobs.org** (free tier). Each job hits a protected API route using a shared secret stored in `.env.local`.

---

## Setup — one-time

### 1. Set `CRON_SECRET` in `.env.local`

Generate a strong random secret and add it:

```
CRON_SECRET=your_random_secret_here
```

Generate one in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Deploy your app so the routes are reachable from the internet

cron-jobs.org needs a public URL. Either deploy to Vercel or expose via ngrok for local testing.

---

## Jobs

---

### Job 1 — COT Reports Sync

**Route:** `POST /api/cot/sync`
**Schedule:** Every **Friday at 16:30 ET (21:30 UTC)**
CFTC publishes Commitments of Traders data every Friday at ~15:30 ET. Sync runs one hour after to ensure data is available.

**cron-jobs.org settings:**
| Field | Value |
|---|---|
| Title | Smile FX — COT Sync |
| URL | `https://your-domain.com/api/cot/sync` |
| Request method | POST |
| Schedule | Every Friday · 21:30 UTC |
| Header name | `Authorization` |
| Header value | `Bearer your_secret_here` |
| Timeout | 30 seconds |
| On failure | Notify by email |

**What it does:**
Fetches the latest CFTC COT data for all 10 instruments (EURUSD, GBPUSD, AUDUSD, NZDUSD, USDJPY, USDCHF, USDCAD, XAUUSD, NAS100, DXY) and upserts into `cot_reports`.

**Manual trigger (test in terminal):**
```bash
curl -X POST https://your-domain.com/api/cot/sync \
  -H "Authorization: Bearer your_secret_here"
```

---

### Job 2 — FX Option Expiries Sync

**Route:** `POST /api/fx-orders/sync`
**Schedule:** Every **weekday (Mon–Fri) at 09:00 ET (14:00 UTC)**
InvestingLive posts the daily FX option expiry table each morning before the 10am NY Cut. Syncing at 9am ET gives traders ~1 hour to review before expiry.

**cron-jobs.org settings:**
| Field | Value |
|---|---|
| Title | Smile FX — FX Orders Sync |
| URL | `https://your-domain.com/api/fx-orders/sync` |
| Request method | POST |
| Schedule | Mon–Fri · 14:00 UTC |
| Header name | `x-cron-secret` |
| Header value | `your_secret_here` |
| Timeout | 60 seconds (Claude Vision takes ~10–20s) |
| On failure | Notify by email |

**What it does:**
1. Fetches today's InvestingLive FX option expiries page
2. Extracts the FXO table image URL from the HTML
3. Sends the image to Claude Vision (Haiku 4.5) for structured extraction
4. Upserts all `(date, pair)` records into `fx_option_expiries`

**Manual trigger (test in terminal):**
```bash
curl -X POST https://your-domain.com/api/fx-orders/sync \
  -H "x-cron-secret: your_secret_here"
```

**Sync a specific past date:**
```bash
curl -X POST "https://your-domain.com/api/fx-orders/sync?date=2026-06-09" \
  -H "x-cron-secret: your_secret_here"
```

**Manual image upload (parse an existing screenshot):**
```bash
curl -X PUT https://your-domain.com/api/fx-orders/sync \
  -F "image=@/path/to/FXO-screenshot.jpg" \
  -F "date=2026-06-09"
```
The `date` field is optional — if omitted, today's date is used. The image is sent to Claude Vision and the extracted levels are stored. No auth header required for PUT (it is user-initiated from within the authenticated app).

**Note:** If InvestingLive hasn't posted the table yet (before ~7:30am ET), the sync will return a 422 error and no data will be stored. The cron-jobs.org retry setting can handle this — set 1 retry after 30 minutes.

**Past date protection:** Records for dates strictly before today (UTC midnight) are never overwritten by a sync. If InvestingLive publishes a weekly image on Monday that contains levels for Tue–Fri, those future dates are stored. When each day's dedicated image is published, that day's records are updated. Once a day has passed, its records are locked — even if a future image references that date, the existing data is preserved.

---

### Job 3 — Subscription Renewal / Expiry

**Route:** `POST /api/subscriptions/renew`
**Schedule:** Every **day at 02:00 UTC**
Runs once a day in the early hours to catch any subscriptions whose `renewsAt` date has passed.

**cron-jobs.org settings:**
| Field | Value |
|---|---|
| Title | Smile FX — Subscription Renewal |
| URL | `https://your-domain.com/api/subscriptions/renew` |
| Request method | POST |
| Schedule | Daily · 02:00 UTC |
| Header name | `Authorization` |
| Header value | `Bearer your_secret_here` |
| Timeout | 30 seconds |
| On failure | Notify by email |

**What it does:**
Finds every `ACTIVE` subscription where `renewsAt < now`, marks it `EXPIRED`, and downgrades the user's plan to `FREE`. No charge is initiated server-side — Lenco handles re-billing. When the next payment clears, the Lenco webhook reactivates the subscription and upgrades the plan automatically.

**Response (success):**
```json
{ "expired": 2, "users": [{ "userId": "...", "plan": "PRO" }, ...] }
```
If no subscriptions are overdue: `{ "expired": 0, "message": "No overdue subscriptions." }`

**Manual trigger (test in terminal):**
```bash
curl -X POST https://your-domain.com/api/subscriptions/renew \
  -H "Authorization: Bearer your_secret_here"
```

---

## Claude API usage

Both the FX option sync and the AI trade review use the **same `ANTHROPIC_API_KEY`** already set in `.env.local`. No additional API key is needed.

| Feature | Route | Model | When called |
|---|---|---|---|
| AI Trade Review | `POST /api/review` | `claude-sonnet-4-6` | On demand (user clicks Review) |
| FX Option Sync | `POST /api/fx-orders/sync` | `claude-haiku-4-5-20251001` | Daily via cron |

**Estimated daily cost for FX option sync:**
- Claude Haiku 4.5 image input: ~1,000–2,000 tokens per image
- At Haiku pricing (~$0.00025 per 1K input tokens): **< $0.01 per day**
- Monthly: **< $0.30**

The FX sync uses Haiku (not Sonnet or Opus) intentionally — the table extraction task is straightforward and Haiku handles it reliably at a fraction of the cost.

---

## Summary

| Job | Route | Auth header | Schedule |
|---|---|---|---|
| COT Sync | `POST /api/cot/sync` | `Authorization: Bearer <secret>` | Fri 21:30 UTC |
| FX Orders Sync | `POST /api/fx-orders/sync` | `x-cron-secret: <secret>` | Mon–Fri 14:00 UTC |
| Subscription Renewal | `POST /api/subscriptions/renew` | `Authorization: Bearer <secret>` | Daily 02:00 UTC |
| Weekly Email Report | `POST /api/emails/weekly-report` | `Authorization: Bearer <secret>` | Sun 08:00 UTC |
