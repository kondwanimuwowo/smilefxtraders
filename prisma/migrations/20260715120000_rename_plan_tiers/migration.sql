-- Rename plan tiers: pro -> edge, funded -> pro (pricing restructure).
-- Order matters: rename PRO -> EDGE first to free up "PRO" for the second rename.
ALTER TYPE "Plan" RENAME VALUE 'PRO' TO 'EDGE';
ALTER TYPE "Plan" RENAME VALUE 'FUNDED' TO 'PRO';

-- plan_configs.planId and courses.tier are plain string columns (not the enum) —
-- need explicit UPDATEs. Same ordering constraint applies.
UPDATE "plan_configs" SET "plan_id" = 'edge' WHERE "plan_id" = 'pro';
UPDATE "plan_configs" SET "plan_id" = 'pro' WHERE "plan_id" = 'funded';

UPDATE "courses" SET "tier" = 'edge' WHERE "tier" = 'pro';
UPDATE "courses" SET "tier" = 'pro' WHERE "tier" = 'funded';
