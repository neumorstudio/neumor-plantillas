-- Allow authenticated users to insert bookings for their own website

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can insert bookings" ON public.bookings;
CREATE POLICY "Admin can insert bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id
      FROM public.websites w
      JOIN public.clients c ON c.id = w.client_id
      WHERE c.auth_user_id = auth.uid()
    )
  );
