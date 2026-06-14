# Agent Handoff & Production Readiness Walkthrough

> [!IMPORTANT]
> This document is designed as a comprehensive handoff for another AI agent. It details the project context, specific architectural nuances, root causes of resolved bugs, and explicit action items required for the production launch.

## 1. Project Context & Architecture

- **App Name:** Smile FX Traders
- **Domain:** Desktop-first community trading platform for forex traders utilizing ICT/SMC concepts.
- **Tech Stack:** Next.js 16 (App Router), Prisma (v7 with `PrismaPg` adapter), Supabase (Postgres + Auth), TanStack Query (React Query), Zustand.
- **Payment Integration:** Lenco (mobile money for ZMW/USD). Webhooks are secured via SHA256 HMAC signature verification.
- **Database Connection Strategy (CRITICAL):**
  - **App Queries:** Uses Supabase's transaction-mode pooler (port `6543`) via `DATABASE_URL`. Connections are short-lived.
  - **Migrations & Scripts:** Must use Supabase's session-mode pooler (port `5432`) via `DIRECT_URL`. Long-running scripts (like seeding) will fail with `EAUTHTIMEOUT` if run against the transaction pooler.

---

## 2. Completed Work (Bug Fixes & Readiness)

### A. Middleware Webhook Blocking (Critical Fix)
- **File Modified:** `src/proxy.ts`
- **The Bug:** The Next.js auth middleware was redirecting all unauthenticated requests to `/login`. Lenco's webhook server does not have a session cookie, resulting in a `307 Temporary Redirect` instead of a `200 OK`. This would have silently broken all subscription activations in production.
- **The Fix:** Added `/api` to the `PUBLIC_PATHS` array (`const PUBLIC_PATHS = ["/login", "/signup", "/onboarding", "/api"];`). API routes self-authenticate (via HMAC, API keys, or cron secrets) and must bypass session-based redirect logic.

### B. Prisma Context Crash in Webhook Route
- **File Modified:** `src/app/api/webhooks/lenco/route.ts`
- **The Bug:** The webhook route threw a `500` error: `TypeError: Cannot read properties of undefined (reading 'findFirst')`. The shared Prisma singleton (`src/lib/prisma.ts`) was being evaluated *before* Next.js injected environment variables in the App Router Edge/Node context, causing `DATABASE_URL` to be undefined and the `PrismaClient` initialization to fail silently.
- **The Fix:** Replaced the shared singleton import in the webhook route with an inline, lazily-initialized `PrismaClient` (`getDb()`) using a local global cache (`globalForDb`). This guarantees `DATABASE_URL` is read at request time.
- **Validation:** An end-to-end audit script (`prisma/test-webhook.ts`) confirmed the fix. Tampered signatures return `401`, valid payloads activate subscriptions (`status: ACTIVE`, `plan: PRO`), and duplicates return `200` without side effects.

### C. Resilient Database Seeding for COT Data
- **Files Modified:** `prisma/seed-cot.ts`, `prisma/seed-cot-patch.ts`
- **The Bug:** The initial seed script failed with `EAUTHTIMEOUT` because it used `DATABASE_URL` (transaction pooler) and performed individual `upsert` queries, saturating the connection pool over the ~40-year dataset.
- **The Fix:**
  - Switched the connection string to use `DIRECT_URL ?? DATABASE_URL` (session mode).
  - Refactored the insert logic to use `createMany({ skipDuplicates: true })` in chunks of 500, achieving a 10-50x speedup.
  - Implemented per-chunk retry logic (3 attempts, 2s backoff).
- **Current State:** 8 out of 10 instruments successfully seeded (~14,000 rows). `NAS100` and `DXY` failed due to transient timeouts from the CFTC API itself.

### D. Comprehensive Environment Variable Audit
- **File Modified:** `.env.local`
- **Action:** Scanned the codebase for all `process.env` references and updated `.env.local` with documented placeholders for every required variable.
- **Result:** The environment file now clearly delineates between database URLs, third-party API keys (Twelve Data, Trading Economics, Lenco, Resend), and internal secrets (`CRON_SECRET`).

---

## 3. Outstanding Pre-Launch Tasks (Action Items)

> [!CAUTION]
> The following steps MUST be completed before the application is considered fully production-ready.

1. **Backfill Missing COT Data:**
   - **Command:** `npx tsx prisma/seed-cot-patch.ts`
   - **Details:** This targeted script will attempt to fetch only the missing `NAS100` and `DXY` data from the CFTC API. The CFTC publishes weekly data on Tuesdays; retry this script if it times out again. **Do not run `seed-cot.ts` as it will wipe the existing data.**

2. **Configure Production Environment Variables:**
   - Ensure the Vercel production environment contains all variables documented in `.env.local`.
   - **Crucial Additions Needed:**
     - `NEXT_PUBLIC_APP_URL`: Must be set to the final Vercel production domain (e.g., `https://smilefxtraders.com`).
     - `RESEND_API_KEY`: Required to send welcome emails upon subscription activation.
     - `TRADING_ECONOMICS_API_KEY`: Required to populate the high-impact economic calendar.

3. **Register Scheduled Tasks (Cron Jobs):**
   - Use a service like [cron-jobs.org](https://cron-jobs.org) to register the following API endpoints:
     - **COT Sync:** `POST /api/cot/sync` (Schedule: Weekly)
     - **Subscription Renewals:** `POST /api/subscriptions/renew` (Schedule: Daily or Weekly depending on billing logic)
   - **Authentication:** Both cron jobs MUST include the header `Authorization: Bearer <value_of_CRON_SECRET>`.

4. **Final Smoke Testing:**
   - Perform a manual UI walkthrough of the onboarding flow, login, and logging a simulated trade. Verify that the React Query state updates instantly and that the transaction pooler handles the requests smoothly.
