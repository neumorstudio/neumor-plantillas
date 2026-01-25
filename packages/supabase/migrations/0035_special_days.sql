-- Special days for salon calendar

CREATE TABLE IF NOT EXISTS public.special_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_open BOOLEAN DEFAULT false,
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '19:00',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (website_id, date)
);

ALTER TABLE public.special_days ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own special days" ON public.special_days;
DROP POLICY IF EXISTS "Users can insert own special days" ON public.special_days;
DROP POLICY IF EXISTS "Users can update own special days" ON public.special_days;
DROP POLICY IF EXISTS "Users can delete own special days" ON public.special_days;

CREATE POLICY "Users can view own special days"
  ON public.special_days
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

CREATE POLICY "Users can insert own special days"
  ON public.special_days
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

CREATE POLICY "Users can update own special days"
  ON public.special_days
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

CREATE POLICY "Users can delete own special days"
  ON public.special_days
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

DROP TRIGGER IF EXISTS special_days_updated_at ON public.special_days;
CREATE TRIGGER special_days_updated_at
  BEFORE UPDATE ON public.special_days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
