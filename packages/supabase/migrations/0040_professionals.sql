-- Professionals for salon bookings

CREATE TABLE IF NOT EXISTS public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_professionals_website
  ON public.professionals(website_id);

CREATE INDEX IF NOT EXISTS idx_professionals_order
  ON public.professionals(website_id, sort_order);

ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own professionals" ON public.professionals;
DROP POLICY IF EXISTS "Users can insert own professionals" ON public.professionals;
DROP POLICY IF EXISTS "Users can update own professionals" ON public.professionals;
DROP POLICY IF EXISTS "Users can delete own professionals" ON public.professionals;

CREATE POLICY "Users can view own professionals"
  ON public.professionals
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

CREATE POLICY "Users can insert own professionals"
  ON public.professionals
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

CREATE POLICY "Users can update own professionals"
  ON public.professionals
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

CREATE POLICY "Users can delete own professionals"
  ON public.professionals
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

DROP TRIGGER IF EXISTS professionals_updated_at ON public.professionals;
CREATE TRIGGER professionals_updated_at
  BEFORE UPDATE ON public.professionals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
