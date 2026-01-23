-- ============================================
-- FITNESS ENHANCEMENTS
-- Campos adicionales para entrenadores personales
-- ============================================

-- Añadir campos fitness a customers
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS fitness_goals TEXT,         -- Objetivos: perder peso, ganar músculo, etc.
  ADD COLUMN IF NOT EXISTS injuries TEXT,              -- Lesiones/limitaciones físicas
  ADD COLUMN IF NOT EXISTS medical_notes TEXT,         -- Notas médicas relevantes
  ADD COLUMN IF NOT EXISTS start_date DATE,            -- Fecha inicio entrenamiento
  ADD COLUMN IF NOT EXISTS birth_date DATE,            -- Fecha de nacimiento
  ADD COLUMN IF NOT EXISTS gender TEXT,                -- Género (para cálculos de composición)
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,          -- Altura en cm
  ADD COLUMN IF NOT EXISTS trainer_notes TEXT;         -- Notas privadas del entrenador

-- Añadir campos a bookings para sesiones de entrenamiento
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES trainer_services(id),
  ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES client_packages(id),
  ADD COLUMN IF NOT EXISTS session_notes TEXT,         -- Notas de la sesión
  ADD COLUMN IF NOT EXISTS workout_summary TEXT,       -- Resumen del entrenamiento realizado
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,   -- Duración real de la sesión
  ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;

-- Índices para los nuevos campos
CREATE INDEX IF NOT EXISTS idx_bookings_service ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package ON bookings(package_id);

-- ============================================
-- ACTUALIZAR BUSINESS_TYPE_CONFIG PARA FITNESS
-- ============================================

UPDATE business_type_config
SET
  label = 'Entrenador Personal',
  visible_sections = ARRAY[
    'dashboard',
    'sesiones',      -- Renombrado de reservas
    'clientes',
    'progreso',      -- NUEVO
    'paquetes',      -- NUEVO
    'servicios',     -- NUEVO
    'pagos',         -- Reutilizado de repairs
    'configuracion'
  ],
  dashboard_widgets = ARRAY[
    'sessions_today',
    'sessions_week',
    'active_clients',
    'revenue_month',
    'expiring_packages'
  ],
  icon = 'dumbbell',
  updated_at = now()
WHERE business_type = 'fitness';

-- Si no existe, insertarlo
INSERT INTO business_type_config (
  business_type,
  label,
  visible_sections,
  dashboard_widgets,
  default_section,
  icon
)
SELECT
  'fitness',
  'Entrenador Personal',
  ARRAY['dashboard', 'sesiones', 'clientes', 'progreso', 'paquetes', 'servicios', 'pagos', 'configuracion'],
  ARRAY['sessions_today', 'sessions_week', 'active_clients', 'revenue_month', 'expiring_packages'],
  'dashboard',
  'dumbbell'
WHERE NOT EXISTS (
  SELECT 1 FROM business_type_config WHERE business_type = 'fitness'
);
