-- Replaces the hand-maintained trend matrix with computed market structure
-- plus expiring instructor overrides. Additive only: trend_matrix stays (it
-- still holds the per-pair notes). Hand-written for the same reason as the
-- rest of this history: see 20260825120000_add_eurostat_data_source.

CREATE TYPE "TrendBias" AS ENUM ('bullish', 'bearish', 'ranging');

CREATE TABLE "trend_structures" (
    "pair" TEXT NOT NULL,
    "tf" TEXT NOT NULL,
    "bias" "TrendBias" NOT NULL,
    "last_break_type" TEXT,
    "last_break_dir" TEXT,
    "last_break_price" DOUBLE PRECISION,
    "last_break_at" TIMESTAMP(3),
    "swing_high" DOUBLE PRECISION,
    "swing_low" DOUBLE PRECISION,
    "bar_time" TIMESTAMP(3),
    "computed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trend_structures_pkey" PRIMARY KEY ("pair","tf")
);

CREATE TABLE "trend_overrides" (
    "pair" TEXT NOT NULL,
    "tf" TEXT NOT NULL,
    "bias" "TrendBias" NOT NULL,
    "set_by" TEXT,
    "set_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trend_overrides_pkey" PRIMARY KEY ("pair","tf")
);
