-- ============================================================================
-- Script: Limpiar TODOS los datos de usuario/prueba
-- Mantiene: business_type_config (configuración del sistema)
-- ============================================================================

-- IMPORTANTE: Ejecutar en Supabase SQL Editor
-- Este script borra TODOS los datos de clientes, webs, reservas, etc.

-- ============================================================================
-- 1. Primero borrar tablas dependientes (hijas)
-- ============================================================================

-- Tablas de trabajos/jobs
TRUNCATE TABLE job_photos CASCADE;
TRUNCATE TABLE job_tasks CASCADE;
TRUNCATE TABLE jobs CASCADE;

-- Tablas de pedidos
TRUNCATE TABLE order_items CASCADE;
TRUNCATE TABLE orders CASCADE;
TRUNCATE TABLE order_settings CASCADE;

-- Tablas de newsletter
TRUNCATE TABLE newsletter_automation CASCADE;
TRUNCATE TABLE newsletter_campaigns CASCADE;
TRUNCATE TABLE newsletter_subscribers CASCADE;
TRUNCATE TABLE newsletter_templates CASCADE;

-- Tablas de servicios/profesionales
TRUNCATE TABLE service_items CASCADE;
TRUNCATE TABLE service_categories CASCADE;
TRUNCATE TABLE trainer_services CASCADE;
TRUNCATE TABLE professional_categories CASCADE;
TRUNCATE TABLE professionals CASCADE;

-- Tablas de horarios
TRUNCATE TABLE special_day_slots CASCADE;
TRUNCATE TABLE special_days CASCADE;
TRUNCATE TABLE business_hour_slots CASCADE;
TRUNCATE TABLE business_hours CASCADE;

-- Tablas de clientes y reservas
TRUNCATE TABLE client_progress CASCADE;
TRUNCATE TABLE client_packages CASCADE;
TRUNCATE TABLE client_records CASCADE;
TRUNCATE TABLE payments CASCADE;
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE customers CASCADE;

-- Tablas de leads y actividad
TRUNCATE TABLE leads CASCADE;
TRUNCATE TABLE activity_log CASCADE;

-- Tablas de integraciones
TRUNCATE TABLE scheduled_posts CASCADE;
TRUNCATE TABLE google_reviews_cache CASCADE;
TRUNCATE TABLE google_business_locations CASCADE;
TRUNCATE TABLE social_accounts CASCADE;

-- Tablas de menú (restaurantes)
TRUNCATE TABLE menu_items CASCADE;
TRUNCATE TABLE restaurants CASCADE;

-- Configuración de notificaciones
TRUNCATE TABLE notification_settings CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;

-- ============================================================================
-- 2. Borrar websites (sitios web de clientes)
-- ============================================================================
TRUNCATE TABLE websites CASCADE;

-- ============================================================================
-- 3. Borrar clients (clientes admin de NeumorStudio)
-- ============================================================================
TRUNCATE TABLE clients CASCADE;

-- ============================================================================
-- 4. NO TOCAR business_type_config (configuración del sistema)
-- ============================================================================
-- SELECT * FROM business_type_config; -- Solo para verificar que sigue intacta

-- ============================================================================
-- 5. Verificar que todo está limpio
-- ============================================================================
SELECT 'clients' as tabla, count(*) as filas FROM clients
UNION ALL SELECT 'websites', count(*) FROM websites
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'bookings', count(*) FROM bookings
UNION ALL SELECT 'leads', count(*) FROM leads
UNION ALL SELECT 'payments', count(*) FROM payments
UNION ALL SELECT 'business_type_config', count(*) FROM business_type_config;
