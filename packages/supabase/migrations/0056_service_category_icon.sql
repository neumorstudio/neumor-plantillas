-- ============================================
-- Add icon field to service_categories
-- ============================================

ALTER TABLE service_categories ADD COLUMN IF NOT EXISTS icon TEXT;
