-- ============================================
-- Google Business Profile Integration
-- Migration 0005
-- ============================================

-- Tabla para ubicaciones de Google Business Profile
-- Una cuenta social (social_accounts con platform='google_business') puede tener múltiples ubicaciones
CREATE TABLE google_business_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid REFERENCES social_accounts(id) ON DELETE CASCADE,
  
  -- Identificadores de Google
  account_name text NOT NULL,      -- formato: accounts/{accountId}
  location_name text NOT NULL,     -- formato: locations/{locationId}
  
  -- Datos del negocio
  title text NOT NULL,             -- Nombre visible del negocio
  address text,
  phone text,
  website_url text,
  
  -- Estado
  is_verified boolean DEFAULT false,
  is_selected boolean DEFAULT false,  -- Ubicación activa para gestionar reseñas
  
  -- Metadata adicional de Google
  metadata jsonb DEFAULT '{}',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(social_account_id, location_name)
);

-- Cache de reseñas de Google
-- Almacena reseñas para no llamar constantemente a la API
CREATE TABLE google_reviews_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES google_business_locations(id) ON DELETE CASCADE,
  
  -- Identificador único de la reseña en Google
  review_name text NOT NULL UNIQUE,  -- formato: accounts/.../locations/.../reviews/{reviewId}
  
  -- Datos del reviewer
  reviewer_name text,
  reviewer_photo_url text,
  
  -- Contenido de la reseña
  star_rating integer CHECK (star_rating BETWEEN 1 AND 5),
  comment text,
  
  -- Respuesta del negocio
  reply_comment text,
  reply_updated_at timestamptz,
  
  -- Timestamps de Google
  review_created_at timestamptz,
  review_updated_at timestamptz,
  
  -- Timestamp de cache local
  cached_at timestamptz DEFAULT now()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_gbp_locations_social ON google_business_locations(social_account_id);
CREATE INDEX idx_gbp_locations_selected ON google_business_locations(is_selected) WHERE is_selected = true;
CREATE INDEX idx_reviews_location ON google_reviews_cache(location_id);
CREATE INDEX idx_reviews_rating ON google_reviews_cache(star_rating);
CREATE INDEX idx_reviews_cached_at ON google_reviews_cache(cached_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE google_business_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_reviews_cache ENABLE ROW LEVEL SECURITY;

-- Políticas para ubicaciones
CREATE POLICY "Users can view their google business locations"
ON google_business_locations FOR SELECT TO authenticated
USING (social_account_id IN (
  SELECT id FROM social_accounts WHERE website_id IN (
    SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
  )
));

CREATE POLICY "Users can insert their google business locations"
ON google_business_locations FOR INSERT TO authenticated
WITH CHECK (social_account_id IN (
  SELECT id FROM social_accounts WHERE website_id IN (
    SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
  )
));

CREATE POLICY "Users can update their google business locations"
ON google_business_locations FOR UPDATE TO authenticated
USING (social_account_id IN (
  SELECT id FROM social_accounts WHERE website_id IN (
    SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
  )
));

CREATE POLICY "Users can delete their google business locations"
ON google_business_locations FOR DELETE TO authenticated
USING (social_account_id IN (
  SELECT id FROM social_accounts WHERE website_id IN (
    SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
  )
));

-- Políticas para reviews cache
CREATE POLICY "Users can view their google reviews"
ON google_reviews_cache FOR SELECT TO authenticated
USING (location_id IN (
  SELECT id FROM google_business_locations WHERE social_account_id IN (
    SELECT id FROM social_accounts WHERE website_id IN (
      SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
    )
  )
));

CREATE POLICY "Users can insert their google reviews"
ON google_reviews_cache FOR INSERT TO authenticated
WITH CHECK (location_id IN (
  SELECT id FROM google_business_locations WHERE social_account_id IN (
    SELECT id FROM social_accounts WHERE website_id IN (
      SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
    )
  )
));

CREATE POLICY "Users can update their google reviews"
ON google_reviews_cache FOR UPDATE TO authenticated
USING (location_id IN (
  SELECT id FROM google_business_locations WHERE social_account_id IN (
    SELECT id FROM social_accounts WHERE website_id IN (
      SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
    )
  )
));

CREATE POLICY "Users can delete their google reviews"
ON google_reviews_cache FOR DELETE TO authenticated
USING (location_id IN (
  SELECT id FROM google_business_locations WHERE social_account_id IN (
    SELECT id FROM social_accounts WHERE website_id IN (
      SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
    )
  )
));

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_gbp_locations_updated_at
  BEFORE UPDATE ON google_business_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
