-- Add calendario section to fitness business type
-- This allows personal trainers to have a calendar view of their sessions

UPDATE business_type_config
SET visible_sections = ARRAY[
  'dashboard',
  'sesiones',
  'calendario',
  'clientes',
  'progreso',
  'paquetes',
  'pagos',
  'personalizacion',
  'configuracion'
]
WHERE business_type = 'fitness';
