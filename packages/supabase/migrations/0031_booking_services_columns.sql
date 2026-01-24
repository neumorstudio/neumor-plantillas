-- Add service details to bookings

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS services JSONB,
  ADD COLUMN IF NOT EXISTS total_price_cents INTEGER,
  ADD COLUMN IF NOT EXISTS total_duration_minutes INTEGER;
