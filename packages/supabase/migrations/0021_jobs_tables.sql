-- ============================================================================
-- Migration: jobs, job_tasks, job_photos
-- Description: Sistema de gestión de trabajos para negocios tipo repairs
-- ============================================================================

-- Tipo enum para estados de trabajo
CREATE TYPE job_status AS ENUM ('pending', 'in_progress', 'waiting_material', 'completed', 'cancelled');

-- Tipo enum para tipo de foto
CREATE TYPE job_photo_type AS ENUM ('before', 'progress', 'after');

-- Tabla principal de trabajos
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  -- Datos del cliente (denormalizados para histórico)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  address TEXT,
  -- Detalles del trabajo
  description TEXT,
  status job_status NOT NULL DEFAULT 'pending',
  estimated_end_date DATE,
  actual_end_date DATE,
  notes TEXT,
  total_amount INTEGER, -- céntimos
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para jobs
CREATE INDEX idx_jobs_website_id ON jobs(website_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_quote_id ON jobs(quote_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE jobs IS 'Trabajos/proyectos derivados de presupuestos aceptados';
COMMENT ON COLUMN jobs.quote_id IS 'Referencia al presupuesto original (lead con lead_type=quote)';
COMMENT ON COLUMN jobs.total_amount IS 'Importe total en céntimos';

-- ============================================================================
-- Tabla de tareas (checklist) por trabajo
-- ============================================================================

CREATE TABLE job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_job_tasks_job_id ON job_tasks(job_id);
CREATE INDEX idx_job_tasks_sort_order ON job_tasks(job_id, sort_order);

-- Comentarios
COMMENT ON TABLE job_tasks IS 'Checklist de tareas dentro de un trabajo';

-- ============================================================================
-- Tabla de fotos de trabajos (antes/durante/después)
-- ============================================================================

CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type job_photo_type NOT NULL,
  description TEXT,
  taken_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);
CREATE INDEX idx_job_photos_type ON job_photos(job_id, type);

-- Comentarios
COMMENT ON TABLE job_photos IS 'Fotos de antes/durante/después del trabajo';
COMMENT ON COLUMN job_photos.type IS 'Tipo de foto: before (antes), progress (durante), after (después)';

-- ============================================================================
-- RLS para jobs
-- ============================================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
  ON jobs FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own jobs"
  ON jobs FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own jobs"
  ON jobs FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own jobs"
  ON jobs FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS para job_tasks (hereda permisos del job padre)
-- ============================================================================

ALTER TABLE job_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own job_tasks"
  ON job_tasks FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      INNER JOIN websites w ON j.website_id = w.id
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own job_tasks"
  ON job_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT j.id FROM jobs j
      INNER JOIN websites w ON j.website_id = w.id
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own job_tasks"
  ON job_tasks FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      INNER JOIN websites w ON j.website_id = w.id
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own job_tasks"
  ON job_tasks FOR DELETE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      INNER JOIN websites w ON j.website_id = w.id
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS para job_photos (hereda permisos del job padre)
-- ============================================================================

ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own job_photos"
  ON job_photos FOR SELECT
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      INNER JOIN websites w ON j.website_id = w.id
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own job_photos"
  ON job_photos FOR INSERT
  TO authenticated
  WITH CHECK (
    job_id IN (
      SELECT j.id FROM jobs j
      INNER JOIN websites w ON j.website_id = w.id
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own job_photos"
  ON job_photos FOR UPDATE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      INNER JOIN websites w ON j.website_id = w.id
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own job_photos"
  ON job_photos FOR DELETE
  TO authenticated
  USING (
    job_id IN (
      SELECT j.id FROM jobs j
      INNER JOIN websites w ON j.website_id = w.id
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );
