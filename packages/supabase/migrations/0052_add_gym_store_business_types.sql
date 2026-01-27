-- Añadir 'gym' y 'store' como tipos de negocio válidos
-- Estos son alias más intuitivos para 'fitness' y 'shop'

ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_business_type_check;
ALTER TABLE clients ADD CONSTRAINT clients_business_type_check
  CHECK (business_type IN ('restaurant', 'clinic', 'salon', 'shop', 'fitness', 'realestate', 'repairs', 'gym', 'store'));

COMMENT ON CONSTRAINT clients_business_type_check ON clients IS 'Tipos de negocio válidos: gym=fitness center, store=tienda online, salon=peluquería/estética, restaurant, clinic, repairs';
