-- ============================================
-- Auto-create Client and Website on User Sign Up
-- ============================================

-- Función que se ejecuta cada vez que se crea un usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. Crear el Cliente vinculado al Auth User
  -- Usamos el ID del usuario de Auth como ID del cliente para simplificar la relación 1:1
  INSERT INTO public.clients (id, email, business_name, business_type)
  VALUES (
    NEW.id, -- Usar el mismo UUID que auth.users
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'business_name', 'Mi Negocio'), -- Un nombre por defecto o metadata
    COALESCE(NEW.raw_user_meta_data->>'business_type', 'shop') -- Un tipo por defecto
  );

  -- 2. Crear el Website para ese Cliente
  INSERT INTO public.websites (client_id, domain)
  VALUES (
    NEW.id, -- Referencia al cliente recién creado (que es el mismo ID que auth.users)
    'sitio-' || substring(NEW.id::text from 1 for 8) || '.neumor.app' -- Dominio temporal único
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que dispara la función después de insertar en auth.users
-- Primero borramos si existe para evitar duplicados en re-runs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
