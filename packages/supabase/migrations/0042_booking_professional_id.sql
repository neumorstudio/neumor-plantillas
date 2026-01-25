-- Link bookings to professionals
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_professional
  ON public.bookings(professional_id);
