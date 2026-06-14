-- CreateTable: COT report data from CFTC Legacy Futures-Only report
CREATE TABLE "cot_reports" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "report_date" TIMESTAMP(3) NOT NULL,
    "large_spec_net" INTEGER NOT NULL,
    "commercial_net" INTEGER NOT NULL,
    "small_spec_net" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cot_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: unique per pair + week, and fast range reads per pair
CREATE UNIQUE INDEX "cot_reports_pair_report_date_key" ON "cot_reports"("pair", "report_date");
CREATE INDEX "cot_reports_pair_report_date_idx" ON "cot_reports"("pair", "report_date" DESC);
