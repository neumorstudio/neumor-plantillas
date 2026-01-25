-- Business hour slots for split shifts

CREATE TABLE IF NOT EXISTS public.business_hour_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_hour_slots_website
  ON public.business_hour_slots(website_id);

CREATE INDEX IF NOT EXISTS idx_business_hour_slots_day
  ON public.business_hour_slots(website_id, day_of_week, sort_order);

ALTER TABLE public.business_hour_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own business hour slots" ON public.business_hour_slots;
DROP POLICY IF EXISTS "Users can insert own business hour slots" ON public.business_hour_slots;
DROP POLICY IF EXISTS "Users can update own business hour slots" ON public.business_hour_slots;
DROP POLICY IF EXISTS "Users can delete own business hour slots" ON public.business_hour_slots;

CREATE POLICY "Users can view own business hour slots"
  ON public.business_hour_slots
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

CREATE POLICY "Users can insert own business hour slots"
  ON public.business_hour_slots
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

CREATE POLICY "Users can update own business hour slots"
  ON public.business_hour_slots
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

CREATE POLICY "Users can delete own business hour slots"
  ON public.business_hour_slots
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

DROP TRIGGER IF EXISTS business_hour_slots_updated_at ON public.business_hour_slots;
CREATE TRIGGER business_hour_slots_updated_at
  BEFORE UPDATE ON public.business_hour_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
