-- ============================================================================
-- Migration: customer_auth
-- Description: Añade soporte para login de clientes con Google OAuth
-- ============================================================================

-- Añadir columna auth_user_id a customers para vincular con auth.users
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Índice único para evitar duplicados (un auth_user solo puede estar en un customer por website)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_website_auth
  ON customers(website_id, auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- Índice para búsquedas por auth_user_id
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id
  ON customers(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- ============================================================================
-- RLS Policies para clientes autenticados
-- ============================================================================

-- Los clientes pueden ver su propio registro
CREATE POLICY "Customers can view own customer record"
  ON customers FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Los clientes pueden actualizar su propio perfil (solo ciertos campos)
CREATE POLICY "Customers can update own profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ============================================================================
-- Policies para tablas relacionadas - Los clientes ven sus propios datos
-- ============================================================================

-- Bookings: clientes pueden ver sus propias reservas
CREATE POLICY "Customers can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- Client_packages: clientes pueden ver sus propios paquetes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_packages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_packages' AND policyname = 'Customers can view own packages') THEN
      EXECUTE 'CREATE POLICY "Customers can view own packages"
        ON public.client_packages FOR SELECT
        TO authenticated
        USING (
          customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
          )
        )';
    END IF;
  END IF;
END $$;

-- Client_progress: clientes pueden ver su propio progreso
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'client_progress') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_progress' AND policyname = 'Customers can view own progress') THEN
      EXECUTE 'CREATE POLICY "Customers can view own progress"
        ON public.client_progress FOR SELECT
        TO authenticated
        USING (
          customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
          )
        )';
    END IF;
  END IF;
END $$;

-- Payments: clientes pueden ver sus propios pagos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Customers can view own payments') THEN
      EXECUTE 'CREATE POLICY "Customers can view own payments"
        ON public.payments FOR SELECT
        TO authenticated
        USING (
          customer_id IN (
            SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
          )
        )';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Función para vincular/crear customer después de login con Google
-- ============================================================================

CREATE OR REPLACE FUNCTION link_or_create_customer(
  p_website_id UUID,
  p_auth_user_id UUID,
  p_email TEXT,
  p_name TEXT
) RETURNS UUID AS $$
DECLARE
  v_customer_id UUID;
BEGIN
  -- Primero intentar encontrar un customer existente por email
  SELECT id INTO v_customer_id
  FROM customers
  WHERE website_id = p_website_id
    AND email = p_email
    AND auth_user_id IS NULL
  LIMIT 1;

  IF v_customer_id IS NOT NULL THEN
    -- Vincular el auth_user_id al customer existente
    UPDATE customers
    SET auth_user_id = p_auth_user_id,
        updated_at = now()
    WHERE id = v_customer_id;
  ELSE
    -- Verificar si ya existe un customer con este auth_user_id
    SELECT id INTO v_customer_id
    FROM customers
    WHERE website_id = p_website_id
      AND auth_user_id = p_auth_user_id
    LIMIT 1;

    IF v_customer_id IS NULL THEN
      -- Crear nuevo customer
      INSERT INTO customers (website_id, auth_user_id, email, name)
      VALUES (p_website_id, p_auth_user_id, p_email, p_name)
      RETURNING id INTO v_customer_id;
    END IF;
  END IF;

  RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que usuarios autenticados llamen a esta función
GRANT EXECUTE ON FUNCTION link_or_create_customer TO authenticated;

-- Comentarios
COMMENT ON COLUMN customers.auth_user_id IS 'UUID del usuario en auth.users para login de clientes';
COMMENT ON FUNCTION link_or_create_customer IS 'Vincula un auth.user con un customer existente por email, o crea uno nuevo';
