-- H-07: Lockdown activity_log INSERT to backend only
-- Problem: Original policy in 0002 had WITH CHECK(true) without TO clause,
-- meaning it applied to PUBLIC (all roles). Migration 0015 tried to fix it
-- but didn't revoke table-level privileges.

-- Step 1: Drop ALL existing INSERT policies on activity_log
DROP POLICY IF EXISTS "Service can insert activity" ON public.activity_log;
DROP POLICY IF EXISTS "Anyone can insert activity" ON public.activity_log;
DROP POLICY IF EXISTS "Public can insert activity" ON public.activity_log;
DROP POLICY IF EXISTS "Authenticated can insert activity" ON public.activity_log;

-- Step 2: Revoke INSERT privilege from anon and authenticated at table level
-- (RLS policies are second layer; table privileges are first)
REVOKE INSERT ON public.activity_log FROM anon;
REVOKE INSERT ON public.activity_log FROM authenticated;

-- Step 3: Create INSERT policy exclusively for service_role
-- service_role bypasses RLS by default, but explicit policy documents intent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE POLICY "Backend can insert activity"
      ON public.activity_log
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- VERIFICATION QUERIES (run manually)
-- ============================================
--
-- Check INSERT policies on activity_log:
-- SELECT tablename, policyname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'activity_log' AND cmd = 'INSERT';
-- Expected: Only "Backend can insert activity" for {service_role}
--
-- Check table privileges (should be false for anon/authenticated INSERT):
-- SELECT has_table_privilege('anon', 'public.activity_log', 'INSERT') AS anon_insert;
-- SELECT has_table_privilege('authenticated', 'public.activity_log', 'INSERT') AS auth_insert;
-- Expected: both false
--
-- Check that service_role can still insert:
-- SELECT has_table_privilege('service_role', 'public.activity_log', 'INSERT') AS service_insert;
-- Expected: true
