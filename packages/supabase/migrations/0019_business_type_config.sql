-- ============================================================================
-- Migration: business_type_config
-- Description: Configuración dinámica de secciones y widgets por tipo de negocio
-- ============================================================================

-- Tabla de configuración por tipo de negocio
CREATE TABLE business_type_config (
  business_type TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  visible_sections TEXT[] NOT NULL,
  dashboard_widgets TEXT[] NOT NULL,
  default_section TEXT DEFAULT 'dashboard',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_business_type_config_updated_at
  BEFORE UPDATE ON business_type_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE business_type_config IS 'Configuración de secciones y widgets del panel admin por tipo de negocio';
COMMENT ON COLUMN business_type_config.visible_sections IS 'Array de slugs de secciones visibles en el sidebar';
COMMENT ON COLUMN business_type_config.dashboard_widgets IS 'Array de IDs de widgets a mostrar en el dashboard';

-- Datos iniciales para todos los tipos de negocio existentes
INSERT INTO business_type_config (business_type, label, visible_sections, dashboard_widgets, icon) VALUES
  (
    'repairs',
    'Reformas y Reparaciones',
    ARRAY['dashboard', 'presupuestos', 'trabajos', 'clientes', 'pagos', 'leads', 'configuracion'],
    ARRAY['quotes_pending', 'quotes_accepted', 'jobs_active', 'payments_pending'],
    'wrench'
  ),
  (
    'restaurant',
    'Restaurante',
    ARRAY['dashboard', 'reservas', 'leads', 'presupuestos', 'newsletter', 'clientes', 'personalizacion', 'configuracion'],
    ARRAY['bookings_today', 'bookings_month', 'leads_new', 'bookings_pending'],
    'utensils'
  ),
  (
    'salon',
    'Salón de Belleza',
    ARRAY['dashboard', 'reservas', 'leads', 'newsletter', 'clientes', 'personalizacion', 'configuracion'],
    ARRAY['bookings_today', 'bookings_month', 'leads_new', 'bookings_pending'],
    'scissors'
  ),
  (
    'clinic',
    'Clínica',
    ARRAY['dashboard', 'reservas', 'leads', 'newsletter', 'clientes', 'personalizacion', 'configuracion'],
    ARRAY['bookings_today', 'bookings_month', 'leads_new', 'bookings_pending'],
    'stethoscope'
  ),
  (
    'shop',
    'Tienda',
    ARRAY['dashboard', 'leads', 'presupuestos', 'newsletter', 'clientes', 'personalizacion', 'configuracion'],
    ARRAY['leads_new', 'quotes_pending', 'revenue_month'],
    'shopping-bag'
  ),
  (
    'fitness',
    'Gimnasio',
    ARRAY['dashboard', 'reservas', 'leads', 'newsletter', 'clientes', 'personalizacion', 'configuracion'],
    ARRAY['bookings_today', 'bookings_month', 'leads_new'],
    'dumbbell'
  ),
  (
    'realestate',
    'Inmobiliaria',
    ARRAY['dashboard', 'leads', 'presupuestos', 'clientes', 'personalizacion', 'configuracion'],
    ARRAY['quotes_pending', 'quotes_accepted', 'leads_new'],
    'building'
  );

-- RLS: La configuración es pública de solo lectura (no contiene datos sensibles)
ALTER TABLE business_type_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business type config is readable by all authenticated users"
  ON business_type_config FOR SELECT
  TO authenticated
  USING (true);
