-- Add phone column (nullable: existing users predate this field; new users
-- set it during onboarding).
ALTER TABLE "users" ADD COLUMN "phone" TEXT;

-- Stop auto-creating a public.users row on every auth.users signup. A
-- profile row should only be created when the user completes onboarding
-- (saveOnboardingAction), so bots that create an auth.users row (e.g. via
-- OAuth or password signup) but never finish onboarding never get a
-- community/profile presence. The trigger stays attached (harmless) but the
-- function is now a no-op; the FK cascade from users.supabase_id to
-- auth.users is unaffected.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN new;
END;
$$;
