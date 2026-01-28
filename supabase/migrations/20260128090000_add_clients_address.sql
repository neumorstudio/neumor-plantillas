-- Add address field to clients for business location
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS address TEXT;
