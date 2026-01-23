-- ============================================================================
-- Migration: payments
-- Description: Sistema de gestión de pagos y cobros
-- ============================================================================

-- Tipo enum para métodos de pago
CREATE TYPE payment_method AS ENUM ('cash', 'transfer', 'bizum', 'card');

-- Tipo enum para estados de pago
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'partial');

-- Tabla de pagos
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  -- Datos del cliente (denormalizados para histórico)
  client_name TEXT NOT NULL,
  -- Datos del pago
  amount INTEGER NOT NULL, -- céntimos
  method payment_method,
  status payment_status NOT NULL DEFAULT 'pending',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_payments_website_id ON payments(website_id);
CREATE INDEX idx_payments_job_id ON payments(job_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE payments IS 'Registro de pagos y cobros';
COMMENT ON COLUMN payments.amount IS 'Importe en céntimos';
COMMENT ON COLUMN payments.method IS 'Método de pago: cash (efectivo), transfer (transferencia), bizum, card (tarjeta)';
COMMENT ON COLUMN payments.status IS 'Estado: pending (pendiente), paid (pagado), partial (pago parcial)';

-- ============================================================================
-- RLS para payments
-- ============================================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
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

CREATE POLICY "Users can delete own payments"
  ON payments FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT w.id FROM websites w
      INNER JOIN clients c ON w.client_id = c.id
      WHERE c.auth_user_id = auth.uid()
    )
  );
