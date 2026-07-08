-- Hand-written (not `prisma migrate dev`-generated) — see the note in
-- 20260708060000_add_economic_event/migration.sql for why `migrate dev` is
-- permanently blocked for this project (Supabase's auth.users trigger has no
-- shadow-DB equivalent). Applied via `db execute --file` then
-- `migrate resolve --applied`, same as that migration.

-- CreateEnum
CREATE TYPE "DataSource" AS ENUM ('FINNHUB', 'FRED', 'WORLD_BANK', 'MANUAL');

-- CreateTable
CREATE TABLE "macro_indicator_snapshots" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "indicator_type" "IndicatorType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "period_date" TIMESTAMP(3) NOT NULL,
    "source" "DataSource" NOT NULL,
    "release_event_id" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "macro_indicator_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "current_currency_scores" (
    "currency" TEXT NOT NULL,
    "total_score" DOUBLE PRECISION NOT NULL,
    "breakdown" JSONB NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL,
    "input_hash" TEXT NOT NULL,

    CONSTRAINT "current_currency_scores_pkey" PRIMARY KEY ("currency")
);

-- CreateIndex
CREATE UNIQUE INDEX "macro_indicator_snapshots_currency_indicator_type_period_d_key" ON "macro_indicator_snapshots"("currency", "indicator_type", "period_date");

-- CreateIndex
CREATE INDEX "macro_indicator_snapshots_currency_indicator_type_period_d_idx" ON "macro_indicator_snapshots"("currency", "indicator_type", "period_date" DESC);
