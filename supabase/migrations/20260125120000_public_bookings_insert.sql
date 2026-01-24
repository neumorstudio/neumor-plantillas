-- Allow public booking inserts from template reservation form

DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;

CREATE POLICY "Public can insert bookings"
  ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (
    website_id IN (SELECT id FROM public.websites)
  );
