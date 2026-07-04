-- Standard Supabase auth/profile linkage, applied to the existing public.users
-- table (this project has no separate "profiles" table — public.users IS the
-- profile row). Two pieces:
--
-- 1. FK cascade: if an auth.users row is ever hard-deleted directly (e.g. via
--    the Supabase Studio "Delete user" button, bypassing the app's own
--    ban-instead-of-delete self-service flow in src/app/api/user/delete),
--    the orphaned public.users row — and everything that cascades off it
--    (trades, posts, notifications, etc.) — is cleaned up automatically
--    instead of being left dangling.
--
-- 2. Auto-create trigger: guarantees every auth.users row gets a matching
--    public.users row the instant it's created, regardless of which code
--    path created the auth user (signup form, OAuth, magic link, an admin
--    invite, or a future flow nobody's written yet). This is a safety net
--    UNDER the app's own explicit creation logic in actions.ts/callback
--    route/layout.tsx, not a replacement for it — those paths still run and
--    upsert the real submitted name/username/email over this trigger's
--    placeholder values (see the accompanying app-code changes).
--
-- NOTE for future schema changes: schema.prisma does not model auth.users
-- (Prisma doesn't manage that schema), so this FK/trigger pair is invisible
-- to `prisma migrate dev`'s diffing. It will NOT be dropped by normal
-- `migrate dev`/`migrate deploy` runs (those only add new migrations), but
-- `prisma db push` fully reconciles the DB against schema.prisma and could
-- drop unknown constraints — avoid running `db push` on this database.

-- auth.users.id is uuid; supabase_id was text (Prisma's String maps to text
-- by default with no @db.Uuid annotation). A FK requires matching types, so
-- convert the column first — every existing value is already valid UUID
-- text, so this is a lossless conversion. Prisma's String client type still
-- works fine against a uuid-typed Postgres column, no schema.prisma change
-- needed.
ALTER TABLE "users"
  ALTER COLUMN "supabase_id" TYPE uuid USING "supabase_id"::uuid;

ALTER TABLE "users"
  ADD CONSTRAINT "users_supabase_id_fkey"
  FOREIGN KEY ("supabase_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username text;
BEGIN
  base_username := coalesce(
    nullif(regexp_replace(lower(split_part(new.email, '@', 1)), '[^a-z0-9_]', '', 'g'), ''),
    'trader'
  );

  INSERT INTO public.users (id, supabase_id, name, username, email, instruments)
  VALUES (
    gen_random_uuid()::text,
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', base_username),
    base_username || '_' || substr(new.id::text, 1, 8),
    new.email,
    '{}'
  )
  ON CONFLICT ("supabase_id") DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
