-- Fix insert policies for bookings and leads to match tenant model

DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated can insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated can insert own leads" ON public.leads;

CREATE POLICY "Authenticated can insert own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated can insert own leads"
  ON public.leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

-- Verification (run manually):
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE tablename IN ('bookings','leads') AND cmd = 'INSERT';
--
-- SELECT has_table_privilege('authenticated', 'public.bookings', 'INSERT');
-- SELECT has_table_privilege('authenticated', 'public.leads', 'INSERT');
