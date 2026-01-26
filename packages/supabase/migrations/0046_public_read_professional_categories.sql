-- Allow public read for professional categories (templates)

ALTER TABLE public.professional_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read professional categories" ON public.professional_categories;
CREATE POLICY "Public read professional categories"
  ON public.professional_categories
  FOR SELECT
  TO anon
  USING (true);

GRANT SELECT ON public.professional_categories TO anon;
