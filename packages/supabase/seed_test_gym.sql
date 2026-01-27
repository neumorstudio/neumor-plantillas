-- =====================================================
-- SEED: Test Gym Website para desarrollo local
-- Ejecutar en: https://supabase.com/dashboard/project/jekrqkdvgcwruhghtgkj/sql
-- =====================================================

-- 1. Primero actualizar el constraint para aceptar 'gym' y 'store'
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_business_type_check;
ALTER TABLE clients ADD CONSTRAINT clients_business_type_check
  CHECK (business_type IN ('restaurant', 'clinic', 'salon', 'shop', 'fitness', 'realestate', 'repairs', 'gym', 'store'));

-- 2. Crear cliente de prueba (gym)
INSERT INTO clients (id, email, business_name, business_type, phone)
VALUES (
  'aaaaaaaa-0001-0001-0001-000000000001',
  'test-gym@neumorstudio.com',
  'FitPro Gym',
  'gym',
  '+34 600 000 001'
)
ON CONFLICT (email) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  business_type = EXCLUDED.business_type;

-- 3. Crear website de prueba
INSERT INTO websites (id, client_id, domain, subdomain, theme, config, is_active, domain_status)
VALUES (
  'bbbbbbbb-0001-0001-0001-000000000001',
  'aaaaaaaa-0001-0001-0001-000000000001',
  'fitprogym.neumorstudio.com',
  'fitprogym',
  'neuglass',
  '{
    "businessName": "FitPro Gym",
    "tagline": "Tu mejor versión empieza aquí",
    "heroTitle": "Transforma tu cuerpo",
    "heroSubtitle": "Entrena con los mejores profesionales",
    "phone": "+34 600 000 001",
    "email": "info@fitprogym.com",
    "address": "Calle Fitness 123, Madrid",
    "variants": {
      "hero": "centered",
      "footer": "minimal"
    }
  }'::jsonb,
  true,
  'subdomain'
)
ON CONFLICT (domain) DO UPDATE SET
  subdomain = EXCLUDED.subdomain,
  theme = EXCLUDED.theme,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active;

-- 4. Ver resultado
SELECT
  c.business_name,
  c.business_type,
  w.subdomain,
  w.is_active
FROM clients c
JOIN websites w ON w.client_id = c.id
WHERE c.email = 'test-gym@neumorstudio.com';
