-- =====================================================
-- Política para permitir lectura pública del business_type de clientes
-- Necesario para el middleware multi-tenant
-- =====================================================

-- Permitir que usuarios anónimos lean business_type de clientes con websites activos
CREATE POLICY "Public can view client business_type via active website"
ON public.clients FOR SELECT
TO anon
USING (
  id IN (
    SELECT client_id FROM public.websites WHERE is_active = true
  )
);

-- Asegurar que RLS está habilitado
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
