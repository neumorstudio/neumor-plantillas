-- Allow public read for special day slots (templates)

ALTER TABLE public.special_day_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read special day slots" ON public.special_day_slots;
CREATE POLICY "Public read special day slots"
  ON public.special_day_slots
  FOR SELECT
  TO anon
  USING (true);

GRANT SELECT ON public.special_day_slots TO anon;
