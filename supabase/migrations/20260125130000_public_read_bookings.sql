-- Allow public read of bookings to block occupied slots

DROP POLICY IF EXISTS "Public can view bookings" ON public.bookings;

CREATE POLICY "Public can view bookings"
  ON public.bookings
  FOR SELECT
  TO anon
  USING (
    website_id IN (SELECT id FROM public.websites)
  );
