-- ============================================================
-- PDYE — RLS audit fix (supplements 007_rls_audit.sql)
-- ============================================================
-- The original migration left two legacy permissive policies on
-- public.users in place. PostgreSQL RLS is permissive — these
-- override everything restrictive we added.
--
-- Run once in: Supabase SQL Editor → New query → paste → Run.
-- ============================================================

-- 1) Drop the two legacy "everyone allowed" policies on public.users
DROP POLICY IF EXISTS "Allow read for authenticated users" ON public.users;
DROP POLICY IF EXISTS "allow all"                          ON public.users;

-- 2) Belt-and-braces: drop any other public-role permissive policy
--    on public.users that might be lingering. (We never want a
--    "TO public" policy on this table — every legitimate access is
--    expressed via rls_users_* for "authenticated".)
DO $do$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename  = 'users'
       AND 'public' = ANY(roles)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
  END LOOP;
END
$do$;

-- 3) Reload the PostgREST schema cache so the change takes effect
--    immediately for the public anon key.
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- After running, verify with:
--
--   SELECT policyname, roles, cmd
--     FROM pg_policies
--    WHERE schemaname='public' AND tablename='users'
--    ORDER BY policyname;
--
-- You should see ONLY policies whose names start with `rls_users_`,
-- and every `roles` should be `{authenticated}` (never `{public}`).
-- ============================================================
