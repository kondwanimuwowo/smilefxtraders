-- CreateTable
CREATE TABLE "fx_option_expiries" (
    "id" TEXT NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "pair" TEXT NOT NULL,
    "spot_price" TEXT,
    "levels" JSONB NOT NULL,
    "source_url" TEXT,
    "image_url" TEXT,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fx_option_expiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fx_option_expiries_expiry_date_idx" ON "fx_option_expiries"("expiry_date" DESC);

-- CreateIndex
CREATE INDEX "fx_option_expiries_pair_expiry_date_idx" ON "fx_option_expiries"("pair", "expiry_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "fx_option_expiries_expiry_date_pair_key" ON "fx_option_expiries"("expiry_date", "pair");
