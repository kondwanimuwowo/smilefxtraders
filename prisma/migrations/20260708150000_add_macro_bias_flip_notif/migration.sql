-- Hand-written (not `prisma migrate dev`-generated) — see the note in
-- 20260708060000_add_economic_event/migration.sql. Single ADD VALUE, applied
-- outside the migration that will use it (same pattern as
-- 20260613112137_alert_status_sl_cancelled/migration.sql).

ALTER TYPE "NotificationType" ADD VALUE 'MACRO_BIAS_FLIP';
