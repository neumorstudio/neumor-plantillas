-- ============================================================================
-- Seed: Datos base para FitPro Gym (cliente y website)
-- Ejecutar PRIMERO despues de limpiar la BD
-- ============================================================================

-- 1. Crear el cliente (dueño del negocio)
INSERT INTO clients (
  id,
  email,
  business_name,
  business_type,
  phone,
  created_at
)
VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'admin@fitprogym.com',
  'FitPro Gym',
  'fitness',
  '+34 600 000 001',
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 2. Crear el website
INSERT INTO websites (
  id,
  client_id,
  domain,
  subdomain,
  theme,
  config,
  is_active,
  created_at
)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'fitprogym.neumorstudio.com',
  'fitprogym',
  'neuglass',
  '{
    "businessName": "FitPro Gym",
    "businessType": "fitness",
    "logo": "/logo.png",
    "primaryColor": "#10b981",
    "secondaryColor": "#14b8a6"
  }'::jsonb,
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO NOTHING;

-- 3. Verificar
SELECT 'clients' as tabla, count(*) as total FROM clients
UNION ALL
SELECT 'websites', count(*) FROM websites;

-- Mostrar el website creado
SELECT id, subdomain, domain, is_active FROM websites;
