-- Add price detail fields to trades
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "close_price" DECIMAL(18,6);
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "closed_at"   TIMESTAMPTZ;
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "ai_review"   JSONB;
