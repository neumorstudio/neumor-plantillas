-- ============================================================================
-- Seed: Datos de prueba para clientes del gym FitPro
-- ============================================================================

-- Website ID: bbbbbbbb-0001-0001-0001-000000000001 (FitPro Gym)

-- ============================================================================
-- 1. Crear datos para el usuario 1 (neumorstudio02@gmail.com)
-- ============================================================================

-- Bookings (sesiones de gym)
INSERT INTO bookings (
  id, website_id, customer_id, customer_name, customer_email, customer_phone, booking_date, booking_time, status, services, notes
)
SELECT
  gen_random_uuid(),
  'bbbbbbbb-0001-0001-0001-000000000001',
  c.id,
  COALESCE(c.name, 'Cliente'),
  COALESCE(c.email, 'cliente@example.com'),
  COALESCE(c.phone, '+34 600 000 000'),
  (CURRENT_DATE - (n * INTERVAL '3 days'))::date,
  CASE n % 4
    WHEN 0 THEN '07:00'::time
    WHEN 1 THEN '09:00'::time
    WHEN 2 THEN '18:00'::time
    ELSE '19:00'::time
  END,
  CASE
    WHEN n < 3 THEN 'confirmed'
    WHEN n < 6 THEN 'completed'
    ELSE 'cancelled'
  END,
  to_jsonb(ARRAY[
    CASE n % 6
      WHEN 0 THEN 'CrossFit'
      WHEN 1 THEN 'Spinning'
      WHEN 2 THEN 'Yoga'
      WHEN 3 THEN 'HIIT'
      WHEN 4 THEN 'Pilates'
      ELSE 'Boxeo'
    END
  ]),
  'Sesion de entrenamiento'
FROM customers c
CROSS JOIN generate_series(0, 9) AS n
WHERE c.website_id = 'bbbbbbbb-0001-0001-0001-000000000001'
  AND c.email = 'neumorstudio02@gmail.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. Crear segundo usuario de prueba
-- ============================================================================

INSERT INTO customers (
  id, website_id, name, email, phone, created_at
)
VALUES (
  'cccccccc-0002-0002-0002-000000000002',
  'bbbbbbbb-0001-0001-0001-000000000001',
  'Usuario Prueba 2',
  'testuser2@example.com',
  '+34 600 000 002',
  CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Bookings para usuario 2
INSERT INTO bookings (
  id, website_id, customer_id, customer_name, customer_email, customer_phone, booking_date, booking_time, status, services, notes
)
SELECT
  gen_random_uuid(),
  'bbbbbbbb-0001-0001-0001-000000000001',
  'cccccccc-0002-0002-0002-000000000002',
  'Usuario Prueba 2',
  'testuser2@example.com',
  '+34 600 000 002',
  (CURRENT_DATE - (n * INTERVAL '2 days'))::date,
  CASE n % 3
    WHEN 0 THEN '10:00'::time
    WHEN 1 THEN '16:00'::time
    ELSE '20:00'::time
  END,
  CASE
    WHEN n < 2 THEN 'confirmed'
    ELSE 'completed'
  END,
  to_jsonb(ARRAY[
    CASE n % 3
      WHEN 0 THEN 'Pilates'
      WHEN 1 THEN 'Yoga'
      ELSE 'Spinning'
    END
  ]),
  'Sesion usuario 2'
FROM generate_series(0, 5) AS n
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. Verificar datos creados
-- ============================================================================

SELECT 'Customers' as tabla, count(*) as total FROM customers WHERE website_id = 'bbbbbbbb-0001-0001-0001-000000000001'
UNION ALL
SELECT 'Bookings', count(*) FROM bookings WHERE website_id = 'bbbbbbbb-0001-0001-0001-000000000001';
