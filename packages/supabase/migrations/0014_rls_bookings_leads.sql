-- Tighten public insert policies for bookings and leads

DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;

-- Verification (run manually):
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('bookings','leads') AND cmd = 'INSERT';
