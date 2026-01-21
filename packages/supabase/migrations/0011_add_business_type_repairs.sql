-- Add repairs business type to clients
ALTER TABLE public.clients
  DROP CONSTRAINT IF EXISTS clients_business_type_check;

ALTER TABLE public.clients
  ADD CONSTRAINT clients_business_type_check
  CHECK (business_type IN ('restaurant', 'clinic', 'salon', 'shop', 'fitness', 'realestate', 'repairs'));
