-- Add quote fields to leads
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS lead_type TEXT NOT NULL DEFAULT 'general' CHECK (lead_type IN ('general', 'quote')),
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;
