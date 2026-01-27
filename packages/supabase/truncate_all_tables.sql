-- ============================================================================
-- Script: Borrar todos los datos de todas las tablas
-- PRECAUCIÓN: Esto eliminará TODOS los datos de la base de datos
-- ============================================================================

-- Primero, ver qué tablas existen (ejecutar esto solo para ver)
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ============================================================================
-- Opción 1: TRUNCATE todas las tablas automáticamente
-- ============================================================================

DO $$
DECLARE
  r RECORD;
  tables_truncated TEXT := '';
BEGIN
  -- Desactivar temporalmente las restricciones de foreign key
  SET session_replication_role = 'replica';

  FOR r IN (
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE '_prisma%'
    ORDER BY tablename
  ) LOOP
    BEGIN
      EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE';
      tables_truncated := tables_truncated || r.tablename || ', ';
      RAISE NOTICE 'Truncated: %', r.tablename;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not truncate %: %', r.tablename, SQLERRM;
    END;
  END LOOP;

  -- Reactivar las restricciones de foreign key
  SET session_replication_role = 'origin';

  RAISE NOTICE 'Tables truncated: %', tables_truncated;
END $$;

-- ============================================================================
-- Verificar que las tablas están vacías
-- ============================================================================

SELECT
  schemaname,
  relname as table_name,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
