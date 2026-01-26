-- Special day slots (multiple time ranges per date)

CREATE TABLE IF NOT EXISTS public.special_day_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  special_day_id UUID REFERENCES public.special_days(id) ON DELETE CASCADE,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.special_day_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own special day slots" ON public.special_day_slots;
DROP POLICY IF EXISTS "Users can insert own special day slots" ON public.special_day_slots;
DROP POLICY IF EXISTS "Users can update own special day slots" ON public.special_day_slots;
DROP POLICY IF EXISTS "Users can delete own special day slots" ON public.special_day_slots;

CREATE POLICY "Users can view own special day slots"
  ON public.special_day_slots
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.special_days sd
      JOIN public.websites w ON w.id = sd.website_id
      JOIN public.clients c ON c.id = w.client_id
      WHERE sd.id = public.special_day_slots.special_day_id
        AND c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own special day slots"
  ON public.special_day_slots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.special_days sd
      JOIN public.websites w ON w.id = sd.website_id
      JOIN public.clients c ON c.id = w.client_id
      WHERE sd.id = public.special_day_slots.special_day_id
        AND c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own special day slots"
  ON public.special_day_slots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.special_days sd
      JOIN public.websites w ON w.id = sd.website_id
      JOIN public.clients c ON c.id = w.client_id
      WHERE sd.id = public.special_day_slots.special_day_id
        AND c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own special day slots"
  ON public.special_day_slots
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.special_days sd
      JOIN public.websites w ON w.id = sd.website_id
      JOIN public.clients c ON c.id = w.client_id
      WHERE sd.id = public.special_day_slots.special_day_id
        AND c.auth_user_id = auth.uid()
    )
  );

INSERT INTO public.special_day_slots (special_day_id, open_time, close_time, sort_order)
SELECT sd.id, sd.open_time, sd.close_time, 0
FROM public.special_days sd
WHERE sd.is_open = true
  AND NOT EXISTS (
    SELECT 1
    FROM public.special_day_slots sds
    WHERE sds.special_day_id = sd.id
  );

DROP TRIGGER IF EXISTS special_day_slots_updated_at ON public.special_day_slots;
CREATE TRIGGER special_day_slots_updated_at
  BEFORE UPDATE ON public.special_day_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
