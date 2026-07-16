-- Adds two nullable demographic fields captured during onboarding.
ALTER TABLE "users" ADD COLUMN "trading_duration" TEXT;
ALTER TABLE "users" ADD COLUMN "goal" TEXT;
