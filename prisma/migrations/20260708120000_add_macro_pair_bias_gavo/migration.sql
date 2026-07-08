-- Hand-written (not `prisma migrate dev`-generated) — see the note in
-- 20260708060000_add_economic_event/migration.sql for why `migrate dev` is
-- permanently blocked for this project. Applied via `db execute --file` then
-- `migrate resolve --applied`, same as the two prior MacroEdge migrations.

-- CreateEnum
CREATE TYPE "BiasLabel" AS ENUM ('STRONG_BUY', 'BUY', 'NEUTRAL', 'SELL', 'STRONG_SELL');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('PAIR', 'CURRENCY');

-- CreateTable
CREATE TABLE "current_pair_biases" (
    "pair" TEXT NOT NULL,
    "base_currency" TEXT NOT NULL,
    "quote_currency" TEXT NOT NULL,
    "base_score" DOUBLE PRECISION NOT NULL,
    "quote_score" DOUBLE PRECISION NOT NULL,
    "differential" DOUBLE PRECISION NOT NULL,
    "bias_label" "BiasLabel" NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL,
    "input_hash" TEXT NOT NULL,

    CONSTRAINT "current_pair_biases_pkey" PRIMARY KEY ("pair")
);

-- CreateTable
CREATE TABLE "gavo_macro_explanations" (
    "id" TEXT NOT NULL,
    "subject_type" "SubjectType" NOT NULL,
    "subject_key" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gavo_macro_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gavo_macro_explanations_subject_type_subject_key_key" ON "gavo_macro_explanations"("subject_type", "subject_key");
