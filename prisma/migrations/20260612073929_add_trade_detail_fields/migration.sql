/*
  Warnings:

  - You are about to alter the column `close_price` on the `trades` table. The data in that column could be lost. The data in that column will be cast from `Decimal(18,6)` to `DoublePrecision`.

*/
-- AlterTable
ALTER TABLE "trades" ALTER COLUMN "close_price" SET DATA TYPE DOUBLE PRECISION,
ALTER COLUMN "closed_at" SET DATA TYPE TIMESTAMP(3);
