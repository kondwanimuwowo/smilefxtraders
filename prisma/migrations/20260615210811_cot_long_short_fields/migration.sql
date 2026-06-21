/*
  Warnings:

  - Made the column `slug` on table `courses` required. This step will fail if there are existing NULL values in that column.
  - Made the column `slug` on table `lessons` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "cot_reports" ADD COLUMN     "commercial_long" INTEGER,
ADD COLUMN     "commercial_short" INTEGER,
ADD COLUMN     "large_spec_long" INTEGER,
ADD COLUMN     "large_spec_short" INTEGER,
ADD COLUMN     "small_spec_long" INTEGER,
ADD COLUMN     "small_spec_short" INTEGER;

-- AlterTable
ALTER TABLE "courses" ALTER COLUMN "slug" SET NOT NULL;

-- AlterTable
ALTER TABLE "lessons" ALTER COLUMN "slug" SET NOT NULL;
