-- Professional categories mapping

CREATE TABLE IF NOT EXISTS public.professional_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (professional_id, category_id)
);

ALTER TABLE public.professional_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own professional categories" ON public.professional_categories;
DROP POLICY IF EXISTS "Users can insert own professional categories" ON public.professional_categories;
DROP POLICY IF EXISTS "Users can update own professional categories" ON public.professional_categories;
DROP POLICY IF EXISTS "Users can delete own professional categories" ON public.professional_categories;

CREATE POLICY "Users can view own professional categories"
  ON public.professional_categories
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

CREATE POLICY "Users can insert own professional categories"
  ON public.professional_categories
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

CREATE POLICY "Users can update own professional categories"
  ON public.professional_categories
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

CREATE POLICY "Users can delete own professional categories"
  ON public.professional_categories
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

INSERT INTO public.professional_categories (website_id, professional_id, category_id)
SELECT p.website_id, p.id, c.id
FROM public.professionals p
JOIN public.service_categories c ON c.website_id = p.website_id
WHERE NOT EXISTS (
  SELECT 1
  FROM public.professional_categories pc
  WHERE pc.professional_id = p.id
    AND pc.category_id = c.id
);
