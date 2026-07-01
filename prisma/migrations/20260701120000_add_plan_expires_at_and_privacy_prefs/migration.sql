-- Add plan grace period and privacy prefs to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_expires_at" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "privacy_prefs" JSONB;
