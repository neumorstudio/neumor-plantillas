-- Business hours for salon calendar

CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN DEFAULT true,
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '19:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (website_id, day_of_week)
);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Users can insert own business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Users can update own business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Users can delete own business hours" ON public.business_hours;

CREATE POLICY "Users can view own business hours"
  ON public.business_hours
  FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own business hours"
  ON public.business_hours
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

CREATE POLICY "Users can update own business hours"
  ON public.business_hours
  FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own business hours"
  ON public.business_hours
  FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS business_hours_updated_at ON public.business_hours;
CREATE TRIGGER business_hours_updated_at
  BEFORE UPDATE ON public.business_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
