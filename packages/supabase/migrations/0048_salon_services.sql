-- ============================================
-- Salon Services: categories and service items
-- ============================================

CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0),
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_categories_website ON service_categories(website_id);
CREATE INDEX IF NOT EXISTS idx_service_categories_active ON service_categories(website_id, is_active);
CREATE INDEX IF NOT EXISTS idx_service_items_website ON service_items(website_id);
CREATE INDEX IF NOT EXISTS idx_service_items_category ON service_items(category_id);
CREATE INDEX IF NOT EXISTS idx_service_items_active ON service_items(website_id, is_active);

ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_items ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users manage their own website data
CREATE POLICY "Users can view own service categories"
  ON service_categories FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own service categories"
  ON service_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own service categories"
  ON service_categories FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own service categories"
  ON service_categories FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own service items"
  ON service_items FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own service items"
  ON service_items FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own service items"
  ON service_items FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own service items"
  ON service_items FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Public read for active services (website-specific filtering happens in queries)
CREATE POLICY "Public can view active service categories"
  ON service_categories FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Public can view active service items"
  ON service_items FOR SELECT
  TO anon
  USING (is_active = true);

-- updated_at triggers
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_service_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_categories_updated_at
  BEFORE UPDATE ON service_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_service_categories_updated_at();

CREATE TRIGGER service_items_updated_at
  BEFORE UPDATE ON service_items
  FOR EACH ROW
  EXECUTE FUNCTION update_service_items_updated_at();

-- Salon config: add "servicios" section if missing
UPDATE business_type_config
SET
  visible_sections = CASE
    WHEN NOT (visible_sections @> ARRAY['servicios']) THEN visible_sections || ARRAY['servicios']
    ELSE visible_sections
  END,
  updated_at = now()
WHERE business_type = 'salon';
