# External Integrations
**Analysis Date:** 2026-07-11

## APIs & External Services (per category: service, what for, SDK/client package, auth env var NAME only)

### Authentication & Identity
- **Supabase Auth** — user signup/login/password reset, email verification, OAuth
  - SDK: `@supabase/supabase-js` 2.107.0, `@supabase/ssr` 0.10.3
  - Auth env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Implementation: `src/proxy.ts` (middleware), `src/app/(auth)/`, `src/app/auth/callback/route.ts` (post-login redirect)

### AI & Machine Learning
- **Anthropic Claude API** — AI trade review (Gavo trading coach persona)
  - SDK: `@anthropic-ai/sdk` 0.100.1
  - Auth env var: `ANTHROPIC_API_KEY`
  - Endpoint: `src/app/api/review/route.ts` (POST)
  - Usage: SMC and Supply & Demand trade journal review with prompt caching (ephemeral cache for system prompts)
  - Model: `claude-sonnet-4-6`

### Market Data & Pricing
- **Twelve Data** — live price quotes and WebSocket streaming for forex/commodities/indices
  - SDK: fetch (no SDK; native WebSocket and REST)
  - Auth env var: `TWELVE_DATA_API_KEY`
  - Endpoints:
    - `src/app/api/prices/route.ts` (GET) — REST quote snapshot
    - `src/app/api/prices/stream/route.ts` (GET) — Server-Sent Events (SSE) stream via WebSocket
  - Symbols: EURUSD, GBPUSD, USDJPY, USDCHF, AUDUSD, NZDUSD, USDCAD, XAUUSD, NAS100, DXY
  - Rate limit: 60 req/min (free tier)

### Economic Calendar & Macro News
- **Finnhub** — economic calendar events, news feed, fundamental data
  - SDK: fetch (REST API wrapper in `src/lib/finnhub.ts`)
  - Auth env vars: `FINNHUB_API_KEY`, `FINNHUB_WEBHOOK_SECRET`
  - Endpoints:
    - Calendar sync: `src/app/api/calendar/sync/route.ts` (POST, cron-protected)
    - News sync: `src/app/api/macro/news/sync/route.ts` (POST, cron-protected)
    - Webhook: `src/app/api/webhooks/finnhub/route.ts` (POST) — push delivery of calendar events
  - Rate limit: 60 req/min (free tier); self-throttled in `src/lib/finnhub.ts` (MIN_INTERVAL_MS = 1100ms)
  - Stored in DB: `EconomicEvent` and `NewsItem` tables

- **FRED (Federal Reserve Economic Data)** — US and OECD macro indicators (interest rates, CPI, GDP, employment, etc.)
  - SDK: fetch (REST API wrapper in `src/lib/fred.ts`)
  - Auth env var: `FRED_API_KEY` (optional; throws `FredNotConfiguredError` if missing)
  - Endpoint: `src/app/api/macro/indicators/sync/route.ts` (POST, cron-protected)
  - Usage: MacroEdge Phase 2 (indicator snapshots for fundamental analysis)
  - Stored in DB: `MacroIndicatorSnapshot` table

- **World Bank Open Data** — annual macro indicators by country (GDP growth, debt, trade balance, etc.)
  - SDK: fetch (REST API wrapper in `src/lib/worldbank.ts`)
  - Auth: none (public API)
  - Endpoint: `src/app/api/macro/indicators/sync/route.ts` (shared with FRED)
  - Stored in DB: `MacroIndicatorSnapshot` table with `source: "WORLD_BANK"`

### Commodity & Derivatives Data
- **CFTC (Commodity Futures Trading Commission)** — Commitments of Traders (COT) reports via Socrata API
  - SDK: fetch (REST API)
  - Auth: none (public API)
  - Endpoint: `src/app/api/cot/sync/route.ts` (POST, cron-protected)
  - Usage: large spec, commercial, small spec positioning by pair
  - Stored in DB: `CotReport` table (weekly updates, typically Fridays)
  - Cron: daily at 21:30 UTC (picks up late CFTC releases)

- **InvestingLive** — FX option expiry levels (web scraping + image parsing)
  - SDK: Anthropic SDK for image extraction (multimodal vision)
  - Endpoint: `src/app/api/fx-orders/[date]/route.ts`, `src/app/api/fx-orders/sync/route.ts` (POST, cron-protected)
  - Usage: daily FX option strike levels at NY cut
  - Stored in DB: `FxOptionExpiry` table with JSON levels and image URL
  - Note: URL format changed in 2026-07 (dropped -YYYYMMDD suffix); sync route recovers via index lookup

### Payment Processing & Billing
- **Lenco** — mobile money payment gateway (ZMW/USD, African payment processing)
  - SDK: fetch (REST API)
  - Auth env vars: `LENCO_WEBHOOK_SECRET`
  - Endpoints:
    - Checkout: `src/app/api/checkout/mobile-money/route.ts` (POST) — initiate payment
    - Verification: `src/app/api/checkout/verify/route.ts` (POST) — poll payment status
    - Cancellation: `src/app/api/checkout/cancel/route.ts` (POST)
    - Webhook: `src/app/api/webhooks/lenco/route.ts` (POST) — HMAC-SHA256 verified updates (`collection.successful`, `collection.failed`)
  - Stored in DB: `Subscription` table with `lencoReference` field
  - Webhooks trigger: payment notifications, email receipts, plan activation/cancellation

### Email & Transactional Messaging
- **Resend** — transactional email (signup, password reset, billing receipts, weekly reports)
  - SDK: `resend` 6.12.4
  - Auth env var: `RESEND_API_KEY`
  - Lazy singleton in `src/lib/email/resend.ts`
  - Senders:
    - `accounts@smilefxtraders.com` — account/auth emails
    - `hello@smilefxtraders.com` — platform/billing/reports
    - `kondwani@smilefxtraders.com` — instructor personal emails
    - `support@smilefxtraders.com` — support flows
  - Templates: `src/lib/email/templates/`
  - Endpoints:
    - Send: `src/lib/email/send.ts`
    - Preview: `src/app/api/emails/preview/route.ts` (dev-only)
    - Weekly reports: `src/app/api/emails/weekly-report/route.ts` (POST, cron-protected)

### Caching & Background Jobs
- **Upstash Redis** — optional distributed cache (session tokens, rate-limiting, debounce)
  - SDK: `@upstash/redis` 1.38.0
  - Auth env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (optional)
  - Implementation: `src/lib/redis.ts` (singleton, returns null if not configured)
  - Falls back gracefully if Upstash not available (local dev / free tier)

## Data Storage (Databases: type/provider, connection env var NAME, client/ORM; File Storage; Caching)

### Primary Database
- **PostgreSQL** (Supabase-managed or self-hosted)
  - Connection env vars: `DATABASE_URL` (read+write via PgBouncer/pooling), `DIRECT_URL` (direct connection for migrations)
  - Client/ORM: Prisma 7.8.0 with `@prisma/adapter-pg` (pooled connections)
  - Schema: `prisma/schema.prisma` (59 models: users, trades, alerts, notifications, subscriptions, posts, courses, COT reports, FX options, macro indicators, bias scores, etc.)
  - Singleton lazy-loaded proxy: `src/lib/prisma.ts`

### File Storage
- **Supabase Storage** — chart images (trade journal screenshots)
  - Stored path: `trades/{userId}/{tradeId}/chart.png` (inferred)
  - Accessed via: `Trade.chartUrl` (full Supabase Storage URL)

### In-Memory / Session Cache
- **Zustand** — client-side state store (no persistence)
  - Store: `src/lib/store.ts`
  - Slices: trades, feed, journaledAlerts, priceAlerts, notifs, user, toast
  - Derived: stats (netR, winRate, equity history, models win-rate)

## Authentication & Identity (provider, implementation approach)

- **Supabase Auth**
  - Provider: Supabase (magic links, email/password, OAuth)
  - Implementation:
    - Middleware proxy (`src/proxy.ts`) — fast JWT validation from cookie (no network round-trip)
    - SSR adapter (`@supabase/ssr`) — server-side client for DB lookups and API access
    - Client library (`@supabase/supabase-js`) — browser-based auth flows
    - Post-login redirect (`src/app/auth/callback/route.ts`) — handles Supabase callback with PKCE code or token_hash
    - Route groups: `(auth)` for public auth pages, `(app)` for protected routes
  - Session: JWT stored in `sb-{project-ref}-auth-token` cookie (httpOnly in production)
  - Gating: plan-based (FREE, PRO, FUNDED) via `User.plan` field

## Monitoring & Observability (error tracking, logs)

- **Vercel** — runtime logs (inferred)
- **Prisma logging** — development mode: "query", "error", "warn"; production: "error" only (`src/lib/prisma.ts`)
- **Console logging** — scattered debug logs in sync routes (COT, FX options, Finnhub webhooks)
- Not detected: Sentry, DataDog, New Relic, or other APM tools

## CI/CD & Deployment (hosting, CI pipeline)

- **Vercel** — hosting and deployment (inferred from Next.js 16, env var suggestions, `NEXT_PUBLIC_*` pattern)
- **GitHub** — code repository (inferred from git workflow)
- **Cron Jobs** — external cron service (cron-jobs.org or similar) calling protected API endpoints with `CRON_SECRET` bearer token
  - Daily 21:30 UTC: `POST /api/cot/sync` (COT reports)
  - Daily/on-demand: `POST /api/macro/indicators/sync` (FRED + World Bank)
  - Daily/on-demand: `POST /api/calendar/sync` (Finnhub calendar)
  - Daily/on-demand: `POST /api/macro/news/sync` (Finnhub news)
  - Weekly: `POST /api/emails/weekly-report` (email digest)
  - On-demand: `POST /api/fx-orders/sync` (FX option expiries)

No detected: GitHub Actions CI/CD pipeline; deploy triggers are likely Vercel Git integration (auto-deploy on push).

## Environment Configuration (required env var NAMES, secrets location)

### Public Environment Variables (NEXT_PUBLIC_*)
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `NEXT_PUBLIC_MARKETING_HOST` — marketing domain (default: smilefxtraders.com)
- `NEXT_PUBLIC_APP_HOST` — app subdomain (default: app.smilefxtraders.com)

### Private/Secret Environment Variables
- `DATABASE_URL` — PostgreSQL connection (pooled)
- `DIRECT_URL` — PostgreSQL direct connection (migrations)
- `RESEND_API_KEY` — Resend email API key
- `ANTHROPIC_API_KEY` — Anthropic SDK key
- `TWELVE_DATA_API_KEY` — Twelve Data market data API
- `FINNHUB_API_KEY` — Finnhub calendar/news API
- `FINNHUB_WEBHOOK_SECRET` — Finnhub webhook HMAC secret
- `FRED_API_KEY` — FRED API key (optional)
- `LENCO_WEBHOOK_SECRET` — Lenco payment webhook secret
- `CRON_SECRET` — shared secret for cron-protected routes
- `UPSTASH_REDIS_REST_URL` — Upstash Redis endpoint (optional)
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis token (optional)
- `NODE_ENV` — "development" | "production"

### Secrets Locations
- `.env` — committed defaults (non-sensitive configuration)
- `.env.local` — local overrides, NOT committed (API keys, secrets)
- Vercel Environment Secrets — production/staging secrets configured via Vercel dashboard

## Webhooks & Callbacks (incoming endpoints, outgoing)

### Incoming Webhooks
- **Lenco Payment Webhook** → `POST /api/webhooks/lenco`
  - Events: `collection.successful`, `collection.failed`
  - Auth: HMAC-SHA256 signature verification (`x-lenco-signature` header)
  - Actions: upsert subscription, emit notifications, send billing emails
  - Always returns 2xx after secret verification (ack-first pattern)

- **Finnhub Economic Calendar Webhook** → `POST /api/webhooks/finnhub`
  - Events: economic calendar event releases (actual/forecast updates)
  - Auth: `X-Finnhub-Secret` header verification
  - Actions: upsert `EconomicEvent`, map to `IndicatorType`, tag tracked currencies
  - Defensive parsing (tries multiple payload shapes, logs unrecognized)
  - Always returns 2xx after secret verification (ack-first pattern)

### Outgoing Webhooks (none detected)
- Not detected: no outbound webhook triggers to external services
- Async actions (emails, notifications) triggered by database events or cron jobs, not webhooks

---
*Integration audit: 2026-07-11*
