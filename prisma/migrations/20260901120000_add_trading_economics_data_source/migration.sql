-- Adds TRADING_ECONOMICS as a DataSource. Hand-written rather than generated
-- by `prisma migrate dev` — that tool's shadow-database validation fails on
-- this project's migration history (an earlier migration creates a trigger
-- on Supabase's auth.users table, which the ephemeral shadow database has no
-- auth schema to replay against). `migrate deploy` applies migration files
-- directly with no shadow database, so it is unaffected. See the
-- 20260825120000_add_eurostat_data_source migration for the same note, the
-- first time this came up.
ALTER TYPE "DataSource" ADD VALUE 'TRADING_ECONOMICS';
