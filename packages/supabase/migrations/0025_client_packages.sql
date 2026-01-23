-- ============================================
-- CLIENT PACKAGES TABLE
-- Paquetes/Bonos de sesiones vendidos a clientes
-- ============================================

CREATE TABLE IF NOT EXISTS client_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- "Bono 10 sesiones", "Mensual ilimitado"
  total_sessions INTEGER,                -- NULL = ilimitado
  used_sessions INTEGER DEFAULT 0,
  remaining_sessions INTEGER GENERATED ALWAYS AS (
    CASE WHEN total_sessions IS NULL THEN NULL
    ELSE total_sessions - used_sessions END
  ) STORED,
  price_cents INTEGER NOT NULL,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE,                      -- Fecha de expiración
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_client_packages_website ON client_packages(website_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_customer ON client_packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_status ON client_packages(website_id, status);
CREATE INDEX IF NOT EXISTS idx_client_packages_expiring ON client_packages(valid_until) WHERE status = 'active';

-- RLS
ALTER TABLE client_packages ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios pueden ver paquetes de sus websites
CREATE POLICY "Users can view own client packages"
  ON client_packages FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden insertar paquetes
CREATE POLICY "Users can insert own client packages"
  ON client_packages FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden actualizar paquetes
CREATE POLICY "Users can update own client packages"
  ON client_packages FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Política: Usuarios pueden eliminar paquetes
CREATE POLICY "Users can delete own client packages"
  ON client_packages FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_client_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_packages_updated_at
  BEFORE UPDATE ON client_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_client_packages_updated_at();

-- Función para marcar paquetes expirados automáticamente
CREATE OR REPLACE FUNCTION check_expired_packages()
RETURNS void AS $$
BEGIN
  UPDATE client_packages
  SET status = 'expired'
  WHERE status = 'active'
    AND valid_until IS NOT NULL
    AND valid_until < CURRENT_DATE;

  UPDATE client_packages
  SET status = 'completed'
  WHERE status = 'active'
    AND total_sessions IS NOT NULL
    AND used_sessions >= total_sessions;
END;
$$ LANGUAGE plpgsql;
