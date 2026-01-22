-- Restrict activity_log inserts to backend role only

DROP POLICY IF EXISTS "Service can insert activity" ON public.activity_log;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE POLICY "Service can insert activity"
      ON public.activity_log
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;
