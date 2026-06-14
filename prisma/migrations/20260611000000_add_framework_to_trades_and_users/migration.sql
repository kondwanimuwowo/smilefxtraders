-- AddColumn: framework to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "framework" TEXT NOT NULL DEFAULT 'SMC';

-- AddColumn: framework to trades
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "framework" TEXT NOT NULL DEFAULT 'SMC';
