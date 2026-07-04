-- Fixes two bugs in handle_new_auth_user() (see 20260704120000_auth_user_trigger_and_cascade):
--
-- 1. The INSERT omitted "updated_at", which is NOT NULL with no DB-level
--    default (@updatedAt is managed by Prisma's query engine, not Postgres).
--    Confirmed via Postgres logs: "null value in column \"updated_at\" of
--    relation \"users\" violates not-null constraint" — this broke every
--    invite sent through /api/admin/invite, since inviteUserByEmail() creates
--    a real auth.users row that fires this trigger, and the failed INSERT
--    rolled back the whole transaction (including the auth user creation).
--
-- 2. ON CONFLICT ("supabase_id") only caught conflicts on that one column —
--    a conflict on the separately-unique "email" or "username" columns
--    (e.g. inviting an email that already has a public.users row under a
--    different auth identity) would raise instead of being silently
--    skipped. Broadened to a bare ON CONFLICT DO NOTHING, which catches a
--    conflict on any unique/exclusion constraint on the table.

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

  INSERT INTO public.users (id, supabase_id, name, username, email, instruments, updated_at)
  VALUES (
    gen_random_uuid()::text,
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', base_username),
    base_username || '_' || substr(new.id::text, 1, 8),
    new.email,
    '{}',
    now()
  )
  ON CONFLICT DO NOTHING;

  RETURN new;
END;
$$;
