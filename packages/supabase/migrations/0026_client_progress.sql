-- ============================================
-- CLIENT PROGRESS TABLE
-- Registro de progreso del cliente (medidas, fotos, etc.)
-- ============================================

CREATE TABLE IF NOT EXISTS client_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Medidas corporales
  weight_kg DECIMAL(5,2),              -- Peso en kg
  body_fat_percent DECIMAL(4,1),       -- % grasa corporal
  muscle_mass_kg DECIMAL(5,2),         -- Masa muscular en kg

  -- Medidas en cm
  chest_cm DECIMAL(5,1),               -- Pecho
  waist_cm DECIMAL(5,1),               -- Cintura
  hips_cm DECIMAL(5,1),                -- Cadera
  arm_left_cm DECIMAL(5,1),            -- Brazo izquierdo
  arm_right_cm DECIMAL(5,1),           -- Brazo derecho
  thigh_left_cm DECIMAL(5,1),          -- Muslo izquierdo
  thigh_right_cm DECIMAL(5,1),         -- Muslo derecho
  calf_cm DECIMAL(5,1),                -- Gemelo

  -- Fotos (URLs)
  photos JSONB DEFAULT '[]',           -- [{url, type: 'front'|'side'|'back', caption}]

  -- Notas
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_progress_website ON client_progress(website_id);
CREATE INDEX IF NOT EXISTS idx_client_progress_customer ON client_progress(customer_id);
CREATE INDEX IF NOT EXISTS idx_client_progress_date ON client_progress(customer_id, recorded_at DESC);

-- RLS
ALTER TABLE client_progress ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver progreso de clientes de sus websites
CREATE POLICY "Users can view own client progress"
  ON client_progress FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden insertar progreso
CREATE POLICY "Users can insert own client progress"
  ON client_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden actualizar progreso
CREATE POLICY "Users can update own client progress"
  ON client_progress FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden eliminar progreso
CREATE POLICY "Users can delete own client progress"
  ON client_progress FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_client_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_progress_updated_at
  BEFORE UPDATE ON client_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_client_progress_updated_at();

-- ============================================
-- CLIENT RECORDS TABLE
-- PRs / Logros personales del cliente
-- ============================================

CREATE TABLE IF NOT EXISTS client_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,           -- "Sentadilla", "Press Banca", "Peso Muerto", etc.
  record_value DECIMAL(8,2) NOT NULL,    -- Valor del récord
  record_unit TEXT NOT NULL DEFAULT 'kg', -- "kg", "reps", "segundos", "metros"
  previous_value DECIMAL(8,2),           -- Valor anterior (para mostrar mejora)
  achieved_at DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_records_website ON client_records(website_id);
CREATE INDEX IF NOT EXISTS idx_client_records_customer ON client_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_client_records_exercise ON client_records(customer_id, exercise_name);

-- RLS
ALTER TABLE client_records ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver récords de clientes de sus websites
CREATE POLICY "Users can view own client records"
  ON client_records FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden insertar récords
CREATE POLICY "Users can insert own client records"
  ON client_records FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden actualizar récords
CREATE POLICY "Users can update own client records"
  ON client_records FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden eliminar récords
CREATE POLICY "Users can delete own client records"
  ON client_records FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );
