-- Tabla para cuentas de redes sociales conectadas (Instagram, Facebook, etc.)
CREATE TABLE social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,

  -- Tipo de cuenta
  platform TEXT NOT NULL, -- 'instagram', 'facebook', 'tiktok'

  -- Datos de la cuenta
  account_id TEXT NOT NULL, -- ID de la cuenta en la plataforma
  account_name TEXT, -- Nombre de usuario (@usuario)
  account_image TEXT, -- URL de la foto de perfil

  -- Tokens de acceso
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Permisos otorgados
  scopes TEXT[], -- ['instagram_basic', 'instagram_content_publish', etc.]

  -- Estado
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  -- Meta info
  meta JSONB DEFAULT '{}', -- Info adicional (page_id, etc.)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Una sola cuenta por plataforma por website
  UNIQUE(website_id, platform, account_id)
);

-- Tabla para posts programados
CREATE TABLE scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,

  -- Contenido del post
  content_type TEXT NOT NULL, -- 'image', 'video', 'carousel', 'reel', 'story'
  caption TEXT,
  media_urls TEXT[], -- URLs de las imagenes/videos

  -- Programacion
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Estado
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'publishing', 'published', 'failed'
  error_message TEXT,

  -- Resultado de publicacion
  post_id TEXT, -- ID del post en Instagram
  post_url TEXT, -- URL del post publicado

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_social_accounts_website ON social_accounts(website_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_scheduled_posts_website ON scheduled_posts(website_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled ON scheduled_posts(scheduled_for) WHERE status = 'scheduled';

-- RLS
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Politicas RLS
CREATE POLICY "Users can view their social accounts"
ON social_accounts FOR SELECT
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can manage their social accounts"
ON social_accounts FOR ALL
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can view their scheduled posts"
ON scheduled_posts FOR SELECT
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can manage their scheduled posts"
ON scheduled_posts FOR ALL
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

-- Trigger para updated_at
CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_posts_updated_at
  BEFORE UPDATE ON scheduled_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
