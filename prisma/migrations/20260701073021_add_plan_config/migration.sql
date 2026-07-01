-- CreateTable
CREATE TABLE "plan_configs" (
    "plan_id" TEXT NOT NULL,
    "monthly_zmw" INTEGER NOT NULL DEFAULT 0,
    "annual_zmw" INTEGER NOT NULL DEFAULT 0,
    "monthly_usd" INTEGER NOT NULL DEFAULT 0,
    "annual_usd" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_configs_pkey" PRIMARY KEY ("plan_id")
);
