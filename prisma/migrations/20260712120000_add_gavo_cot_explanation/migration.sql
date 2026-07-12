-- Hand-written (not `prisma migrate dev`-generated) — DB unreachable from
-- this environment. Matches the schema.prisma GavoCotExplanation model.

-- CreateTable
CREATE TABLE "gavo_cot_explanations" (
    "id" TEXT NOT NULL,
    "pair" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "input_hash" TEXT NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gavo_cot_explanations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gavo_cot_explanations_pair_key" ON "gavo_cot_explanations"("pair");
