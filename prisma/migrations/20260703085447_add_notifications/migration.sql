-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INSTRUCTOR_ALERT', 'POST_LIKE', 'POST_COMMENT', 'PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'PLAN_CANCELLED', 'PLAN_EXPIRING', 'PLAN_EXPIRED', 'COURSE_COMPLETED', 'COURSE_PUBLISHED', 'SYSTEM');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "welcome_email_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT 'notifications_active',
    "tone" TEXT NOT NULL DEFAULT 'teal',
    "href" TEXT,
    "dedupe_key" TEXT,
    "visible_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_visible_at_idx" ON "notifications"("user_id", "visible_at" DESC);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_user_id_dedupe_key_key" ON "notifications"("user_id", "dedupe_key");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
