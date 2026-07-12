-- Hand-written (not `prisma migrate dev`-generated) — DB connectivity from
-- this environment is intermittent. Matches the schema.prisma Instrument.tier field.

-- AlterTable
ALTER TABLE "instruments" ADD COLUMN "tier" TEXT NOT NULL DEFAULT 'major';
