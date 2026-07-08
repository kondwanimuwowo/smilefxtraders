-- Hand-written (not `prisma migrate dev`-generated) — see the note in
-- 20260708060000_add_economic_event/migration.sql.

-- CreateTable
CREATE TABLE "news_items" (
    "id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "currency" TEXT,
    "headline" TEXT NOT NULL,
    "summary" TEXT,
    "url" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "published_at" TIMESTAMP(3) NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "news_items_external_id_key" ON "news_items"("external_id");

-- CreateIndex
CREATE INDEX "news_items_currency_published_at_idx" ON "news_items"("currency", "published_at" DESC);
