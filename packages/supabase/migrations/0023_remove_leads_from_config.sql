-- ============================================================================
-- Migration: remove_leads_from_config
-- Description: Eliminar referencias a leads de business_type_config
-- Reason: La seccion de leads ha sido eliminada del panel admin
-- ============================================================================

-- Actualizar todas las configuraciones para eliminar 'leads' de visible_sections
-- y 'leads_new' de dashboard_widgets

UPDATE business_type_config
SET
  visible_sections = array_remove(visible_sections, 'leads'),
  dashboard_widgets = array_remove(dashboard_widgets, 'leads_new'),
  updated_at = now();

-- Verificacion (ejecutar manualmente):
-- SELECT business_type, visible_sections, dashboard_widgets
-- FROM business_type_config;
