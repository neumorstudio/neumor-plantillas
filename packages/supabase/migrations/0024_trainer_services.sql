-- ============================================
-- TRAINER SERVICES TABLE
-- Tipos de entrenamiento/servicios que ofrece el entrenador
-- ============================================

CREATE TABLE IF NOT EXISTS trainer_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Entrenamiento 1-on-1", "Sesión Online", etc.
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,   -- Duración en minutos
  price_cents INTEGER NOT NULL,          -- Precio en céntimos
  is_online BOOLEAN DEFAULT false,       -- Si es sesión online
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,          -- Para ordenar en la web
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_trainer_services_website ON trainer_services(website_id);
CREATE INDEX IF NOT EXISTS idx_trainer_services_active ON trainer_services(website_id, is_active);

-- RLS
ALTER TABLE trainer_services ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden ver servicios de sus websites
CREATE POLICY "Users can view own trainer services"
  ON trainer_services FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden insertar servicios en sus websites
CREATE POLICY "Users can insert own trainer services"
  ON trainer_services FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden actualizar sus servicios
CREATE POLICY "Users can update own trainer services"
  ON trainer_services FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden eliminar sus servicios
CREATE POLICY "Users can delete own trainer services"
  ON trainer_services FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Lectura pública para la web (servicios activos)
CREATE POLICY "Public can view active trainer services"
  ON trainer_services FOR SELECT
  TO anon
  USING (is_active = true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_trainer_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trainer_services_updated_at
  BEFORE UPDATE ON trainer_services
  FOR EACH ROW
  EXECUTE FUNCTION update_trainer_services_updated_at();
