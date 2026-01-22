-- ============================================================================
-- Migration: customers
-- Description: CRM básico universal para todos los tipos de negocio
-- ============================================================================

-- Tabla de clientes unificada
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(website_id, email)
);

-- Índices
CREATE INDEX idx_customers_website_id ON customers(website_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers(name);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE customers IS 'CRM básico: clientes unificados de todos los orígenes (reservas, leads, trabajos)';

-- Añadir columna customer_id a tablas existentes para vincular clientes
ALTER TABLE bookings ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE SET NULL;

-- Índices para las nuevas columnas
CREATE INDEX idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX idx_leads_customer_id ON leads(customer_id);

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- SELECT: usuarios autenticados pueden ver clientes de sus websites
CREATE POLICY "Users can view own customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- INSERT: usuarios autenticados pueden crear clientes en sus websites
CREATE POLICY "Users can insert own customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

-- UPDATE: usuarios autenticados pueden actualizar clientes de sus websites
CREATE POLICY "Users can update own customers"
  ON customers FOR UPDATE
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

-- DELETE: usuarios autenticados pueden eliminar clientes de sus websites
CREATE POLICY "Users can delete own customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );
