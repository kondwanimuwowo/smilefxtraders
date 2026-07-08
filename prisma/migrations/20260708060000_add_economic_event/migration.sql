-- Hand-written (not `prisma migrate dev`-generated): the shadow database
-- `migrate dev` normally validates against can't apply the earlier
-- 20260704120000_auth_user_trigger_and_cascade migration (it references
-- Supabase's auth.users schema, which only exists on the real managed
-- Postgres instance, never on a fresh shadow DB) — so `migrate dev` is
-- permanently blocked for this project once that migration exists in
-- history. Applied via `prisma migrate resolve --applied` after running
-- this SQL directly, matching the pattern the auth-trigger migration
-- itself already established.

-- CreateEnum
CREATE TYPE "IndicatorType" AS ENUM ('INTEREST_RATE', 'CPI', 'GDP', 'EMPLOYMENT', 'RETAIL_SALES', 'MANUFACTURING_PMI', 'CONSUMER_CONFIDENCE', 'TRADE_BALANCE', 'BOND_YIELD_10Y');

-- CreateTable
CREATE TABLE "economic_events" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "IndicatorType",
    "impact" TEXT NOT NULL,
    "actual" TEXT,
    "forecast" TEXT,
    "previous" TEXT,
    "event_time" TIMESTAMP(3) NOT NULL,
    "released_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "economic_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "economic_events_external_id_key" ON "economic_events"("external_id");

-- CreateIndex
CREATE INDEX "economic_events_currency_event_time_idx" ON "economic_events"("currency", "event_time" DESC);

-- CreateIndex
CREATE INDEX "economic_events_event_time_idx" ON "economic_events"("event_time");
