-- CreateTable
CREATE TABLE "instruments" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pipSize" DOUBLE PRECISION NOT NULL,
    "pipValue" DOUBLE PRECISION NOT NULL,
    "td_symbol" TEXT,
    "cot_contract" TEXT,
    "cot_min52w" DOUBLE PRECISION,
    "cot_max52w" DOUBLE PRECISION,
    "cot_min_c52w" DOUBLE PRECISION,
    "cot_max_c52w" DOUBLE PRECISION,
    "cot_inverted" BOOLEAN NOT NULL DEFAULT false,
    "fxo_tracked" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "instruments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instruments_symbol_key" ON "instruments"("symbol");
