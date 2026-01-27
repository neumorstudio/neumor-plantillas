-- Fix fitness/gym business type: add personalizacion, remove servicios
-- This restores the personalization section that was removed in 0027_fitness_enhancements.sql

UPDATE business_type_config
SET visible_sections = ARRAY[
  'dashboard',
  'sesiones',
  'clientes',
  'progreso',
  'paquetes',
  'pagos',
  'personalizacion',
  'configuracion'
]
WHERE business_type = 'fitness';
