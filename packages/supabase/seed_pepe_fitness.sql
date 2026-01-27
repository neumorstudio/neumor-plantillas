-- ============================================================================
-- SEED DATA: Pepe (cliente fitness)
-- Ejecutar en Supabase SQL Editor
-- ============================================================================

-- IMPORTANTE: Reemplaza este UUID con el website_id de tu cuenta fitness
-- Puedes obtenerlo con: SELECT id FROM websites WHERE client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid());
DO $$
DECLARE
  v_website_id UUID;
  v_customer_id UUID;
  v_service_personal_id UUID;
  v_service_evaluacion_id UUID;
  v_service_online_id UUID;
  v_service_grupal_id UUID;
  v_package_10_id UUID;
  v_package_mensual_id UUID;
BEGIN

  -- Obtener website_id del usuario autenticado (ajustar si es necesario)
  SELECT w.id INTO v_website_id
  FROM websites w
  INNER JOIN clients c ON w.client_id = c.id
  WHERE c.email LIKE '%fitness%' OR c.business_type = 'fitness'
  LIMIT 1;

  -- Si no lo encuentra, usar uno especifico (REEMPLAZAR CON TU UUID)
  IF v_website_id IS NULL THEN
    RAISE EXCEPTION 'No se encontro un website fitness. Reemplaza el UUID manualmente.';
  END IF;

  RAISE NOTICE 'Website ID encontrado: %', v_website_id;

  -- ============================================================================
  -- 1. TRAINER SERVICES (Tipos de sesion)
  -- ============================================================================

  INSERT INTO trainer_services (id, website_id, name, description, duration_minutes, price_cents, is_online, is_active, sort_order)
  VALUES
    (gen_random_uuid(), v_website_id, 'Entrenamiento Personal', 'Sesion 1-on-1 presencial en gimnasio', 60, 4000, false, true, 1),
    (gen_random_uuid(), v_website_id, 'Evaluacion Fisica Inicial', 'Medidas corporales, test de fuerza y planificacion', 90, 6000, false, true, 2),
    (gen_random_uuid(), v_website_id, 'Sesion Online', 'Entrenamiento por videollamada', 45, 2500, true, true, 3),
    (gen_random_uuid(), v_website_id, 'Clase Grupal', 'Sesion para grupos pequeños (max 4)', 60, 1500, false, true, 4)
  ON CONFLICT DO NOTHING;

  -- Obtener IDs de servicios (LIMIT 1 por si hay duplicados)
  SELECT id INTO v_service_personal_id FROM trainer_services WHERE website_id = v_website_id AND name = 'Entrenamiento Personal' LIMIT 1;
  SELECT id INTO v_service_evaluacion_id FROM trainer_services WHERE website_id = v_website_id AND name = 'Evaluacion Fisica Inicial' LIMIT 1;
  SELECT id INTO v_service_online_id FROM trainer_services WHERE website_id = v_website_id AND name = 'Sesion Online' LIMIT 1;
  SELECT id INTO v_service_grupal_id FROM trainer_services WHERE website_id = v_website_id AND name = 'Clase Grupal' LIMIT 1;

  -- ============================================================================
  -- 2. CUSTOMER (Pepe)
  -- ============================================================================

  INSERT INTO customers (
    id, website_id, name, email, phone, address, notes,
    fitness_goals, injuries, medical_notes, start_date, birth_date, gender, height_cm, trainer_notes
  )
  VALUES (
    gen_random_uuid(),
    v_website_id,
    'Pepe',
    'pepe@gmail.com',
    '1234566789',
    'Calle Falsa 123',
    'Cliente de prueba para testing completo del admin',
    'Perder grasa, ganar masa muscular, mejorar resistencia cardiovascular',
    'Molestia leve en rodilla izquierda (antigua lesion de futbol)',
    'Sin alergias. Tension arterial normal.',
    CURRENT_DATE - INTERVAL '3 months',
    '1990-05-15',
    'male',
    178,
    'Cliente muy motivado. Viene 3 veces por semana. Prefiere entrenar por las tardes.'
  )
  ON CONFLICT (website_id, email) DO UPDATE SET name = EXCLUDED.name
  RETURNING id INTO v_customer_id;

  -- Si ya existia, obtener su ID
  IF v_customer_id IS NULL THEN
    SELECT id INTO v_customer_id FROM customers WHERE website_id = v_website_id AND email = 'pepe@gmail.com' LIMIT 1;
  END IF;

  RAISE NOTICE 'Customer ID (Pepe): %', v_customer_id;

  -- ============================================================================
  -- 3. CLIENT PACKAGES (Bonos)
  -- ============================================================================

  -- Bono de 10 sesiones (activo, con algunas usadas)
  INSERT INTO client_packages (
    id, website_id, customer_id, name, total_sessions, used_sessions, price_cents,
    valid_from, valid_until, status, notes
  )
  VALUES (
    gen_random_uuid(),
    v_website_id,
    v_customer_id,
    'Bono 10 Sesiones',
    10,
    3,
    35000,  -- 350€
    CURRENT_DATE - INTERVAL '1 month',
    CURRENT_DATE + INTERVAL '5 months',
    'active',
    'Bono comprado con descuento promocional'
  )
  RETURNING id INTO v_package_10_id;

  -- Bono mensual ilimitado (completado)
  INSERT INTO client_packages (
    id, website_id, customer_id, name, total_sessions, used_sessions, price_cents,
    valid_from, valid_until, status, notes
  )
  VALUES (
    gen_random_uuid(),
    v_website_id,
    v_customer_id,
    'Mensual Ilimitado - Enero',
    NULL,  -- ilimitado
    12,
    20000,  -- 200€
    CURRENT_DATE - INTERVAL '2 months',
    CURRENT_DATE - INTERVAL '1 month',
    'expired',
    'Primer mes de prueba'
  )
  RETURNING id INTO v_package_mensual_id;

  -- ============================================================================
  -- 4. BOOKINGS/SESSIONS (Sesiones de entrenamiento)
  -- ============================================================================

  -- Sesion COMPLETADA hace 1 semana
  INSERT INTO bookings (
    website_id, customer_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, status, source,
    service_id, package_id, session_notes, workout_summary, duration_minutes, is_paid
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 'pepe@gmail.com', '1234566789',
    CURRENT_DATE - INTERVAL '7 days', '10:00:00', 'completed', 'other',
    v_service_personal_id, v_package_10_id,
    'Primera sesion de la semana - enfoque en pierna',
    'Sentadillas 4x10 @ 60kg, Prensa 3x12 @ 100kg, Zancadas 3x10, Curl femoral 3x12, Extension cuadriceps 3x12. Buen rendimiento general.',
    60, true
  );

  -- Sesion COMPLETADA hace 5 dias
  INSERT INTO bookings (
    website_id, customer_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, status, source,
    service_id, package_id, session_notes, workout_summary, duration_minutes, is_paid
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 'pepe@gmail.com', '1234566789',
    CURRENT_DATE - INTERVAL '5 days', '18:00:00', 'completed', 'other',
    v_service_personal_id, v_package_10_id,
    'Torso - empuje',
    'Press banca 4x8 @ 70kg (PR!), Press militar 3x10 @ 35kg, Aperturas 3x12, Fondos 3x12, Triceps polea 3x15. Nuevo PR en press banca!',
    60, true
  );

  -- Sesion COMPLETADA hace 3 dias
  INSERT INTO bookings (
    website_id, customer_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, status, source,
    service_id, package_id, session_notes, workout_summary, duration_minutes, is_paid
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 'pepe@gmail.com', '1234566789',
    CURRENT_DATE - INTERVAL '3 days', '10:00:00', 'completed', 'other',
    v_service_personal_id, v_package_10_id,
    'Torso - tiron',
    'Dominadas 4x8, Remo con barra 4x10 @ 50kg, Jalon al pecho 3x12, Face pulls 3x15, Curl biceps 3x12. Buena conexion mente-musculo.',
    55, true
  );

  -- Sesion CONFIRMADA para hoy
  INSERT INTO bookings (
    website_id, customer_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, status, source,
    service_id, package_id, session_notes, duration_minutes, is_paid
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 'pepe@gmail.com', '1234566789',
    CURRENT_DATE, '17:00:00', 'confirmed', 'other',
    v_service_personal_id, v_package_10_id,
    'Pierna - enfoque glúteos y femorales',
    60, false
  );

  -- Sesion PENDIENTE para mañana
  INSERT INTO bookings (
    website_id, customer_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, status, source,
    service_id, package_id, session_notes, duration_minutes, is_paid
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 'pepe@gmail.com', '1234566789',
    CURRENT_DATE + INTERVAL '1 day', '10:00:00', 'pending', 'other',
    v_service_personal_id, v_package_10_id,
    'Full body - circuito metabolico',
    60, false
  );

  -- Sesion CONFIRMADA para pasado mañana
  INSERT INTO bookings (
    website_id, customer_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, status, source,
    service_id, package_id, session_notes, duration_minutes, is_paid
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 'pepe@gmail.com', '1234566789',
    CURRENT_DATE + INTERVAL '2 days', '18:00:00', 'confirmed', 'other',
    v_service_personal_id, v_package_10_id,
    'Torso - empuje. Intentar subir peso en press banca.',
    60, false
  );

  -- Sesion CANCELADA (para mostrar en historico)
  INSERT INTO bookings (
    website_id, customer_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, status, source,
    service_id, session_notes, duration_minutes, is_paid
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 'pepe@gmail.com', '1234566789',
    CURRENT_DATE - INTERVAL '10 days', '10:00:00', 'cancelled', 'other',
    v_service_personal_id,
    'Cancelada por enfermedad del cliente',
    60, false
  );

  -- Sesion ONLINE completada
  INSERT INTO bookings (
    website_id, customer_id, customer_name, customer_email, customer_phone,
    booking_date, booking_time, status, source,
    service_id, session_notes, workout_summary, duration_minutes, is_paid
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 'pepe@gmail.com', '1234566789',
    CURRENT_DATE - INTERVAL '14 days', '20:00:00', 'completed', 'other',
    v_service_online_id,
    'Sesion online - estaba de viaje',
    'Entrenamiento con peso corporal: burpees, sentadillas, flexiones, planchas. 4 rondas de circuito.',
    45, true
  );

  -- ============================================================================
  -- 5. CLIENT PROGRESS (Registro de progreso)
  -- ============================================================================

  -- Medidas iniciales (hace 3 meses)
  INSERT INTO client_progress (
    website_id, customer_id, recorded_at,
    weight_kg, body_fat_percent, muscle_mass_kg,
    chest_cm, waist_cm, hips_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm,
    notes
  )
  VALUES (
    v_website_id, v_customer_id, CURRENT_DATE - INTERVAL '3 months',
    85.5, 22.0, 35.2,
    102.0, 92.0, 100.0, 34.0, 34.5, 58.0, 58.5,
    'Medidas iniciales. Objetivo: bajar a 18% grasa y subir masa muscular.'
  );

  -- Medidas mes 1
  INSERT INTO client_progress (
    website_id, customer_id, recorded_at,
    weight_kg, body_fat_percent, muscle_mass_kg,
    chest_cm, waist_cm, hips_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm,
    notes
  )
  VALUES (
    v_website_id, v_customer_id, CURRENT_DATE - INTERVAL '2 months',
    84.0, 20.5, 35.8,
    102.5, 89.0, 99.0, 34.5, 35.0, 58.5, 59.0,
    'Buen progreso! Bajando grasa y subiendo musculo. Cintura -3cm.'
  );

  -- Medidas mes 2
  INSERT INTO client_progress (
    website_id, customer_id, recorded_at,
    weight_kg, body_fat_percent, muscle_mass_kg,
    chest_cm, waist_cm, hips_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm,
    notes
  )
  VALUES (
    v_website_id, v_customer_id, CURRENT_DATE - INTERVAL '1 month',
    83.2, 19.0, 36.5,
    103.0, 86.5, 98.0, 35.0, 35.5, 59.0, 59.5,
    'Excelente! Ya casi en el objetivo de grasa. Brazos y piernas creciendo.'
  );

  -- Medidas actuales
  INSERT INTO client_progress (
    website_id, customer_id, recorded_at,
    weight_kg, body_fat_percent, muscle_mass_kg,
    chest_cm, waist_cm, hips_cm, arm_left_cm, arm_right_cm, thigh_left_cm, thigh_right_cm,
    notes
  )
  VALUES (
    v_website_id, v_customer_id, CURRENT_DATE - INTERVAL '3 days',
    82.5, 18.2, 37.0,
    103.5, 84.0, 97.5, 35.5, 36.0, 59.5, 60.0,
    'OBJETIVO CONSEGUIDO! 18% grasa. Ahora enfocamos en seguir ganando musculo.'
  );

  -- ============================================================================
  -- 6. CLIENT RECORDS (PRs / Logros)
  -- ============================================================================

  INSERT INTO client_records (website_id, customer_id, exercise_name, record_value, record_unit, previous_value, achieved_at, notes)
  VALUES
    (v_website_id, v_customer_id, 'Press Banca', 75, 'kg', 70, CURRENT_DATE - INTERVAL '5 days', 'PR! Subio 5kg'),
    (v_website_id, v_customer_id, 'Sentadilla', 80, 'kg', 70, CURRENT_DATE - INTERVAL '2 weeks', 'Buena tecnica mantenida'),
    (v_website_id, v_customer_id, 'Peso Muerto', 100, 'kg', 90, CURRENT_DATE - INTERVAL '3 weeks', 'Primer triple digito!'),
    (v_website_id, v_customer_id, 'Dominadas', 12, 'reps', 8, CURRENT_DATE - INTERVAL '1 month', 'Sin lastre, estrictas'),
    (v_website_id, v_customer_id, 'Plancha', 120, 'segundos', 90, CURRENT_DATE - INTERVAL '2 months', '2 minutos aguantando');

  -- ============================================================================
  -- 7. PAYMENTS (Pagos)
  -- ============================================================================

  -- Pago del bono 10 sesiones
  INSERT INTO payments (
    website_id, customer_id, client_name, amount, method, status, paid_at, notes
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 35000, 'transfer', 'paid',
    (CURRENT_DATE - INTERVAL '1 month')::timestamptz,
    'Pago del Bono 10 Sesiones - Transferencia bancaria'
  );

  -- Pago del mensual anterior
  INSERT INTO payments (
    website_id, customer_id, client_name, amount, method, status, paid_at, notes
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 20000, 'bizum', 'paid',
    (CURRENT_DATE - INTERVAL '2 months')::timestamptz,
    'Pago Mensual Ilimitado Enero - Bizum'
  );

  -- Pago pendiente (sesion suelta futura)
  INSERT INTO payments (
    website_id, customer_id, client_name, amount, method, status, due_date, notes
  )
  VALUES (
    v_website_id, v_customer_id, 'Pepe', 6000, NULL, 'pending',
    CURRENT_DATE + INTERVAL '1 week',
    'Evaluacion fisica trimestral programada'
  );

  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATOS DE PRUEBA CREADOS PARA PEPE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Customer ID: %', v_customer_id;
  RAISE NOTICE 'Website ID: %', v_website_id;
  RAISE NOTICE '';
  RAISE NOTICE 'Creados:';
  RAISE NOTICE '- 4 Servicios del entrenador';
  RAISE NOTICE '- 2 Paquetes/Bonos (1 activo, 1 expirado)';
  RAISE NOTICE '- 8 Sesiones (3 completadas, 1 hoy, 2 futuras, 1 cancelada, 1 online)';
  RAISE NOTICE '- 4 Registros de progreso (medidas mensuales)';
  RAISE NOTICE '- 5 Records personales (PRs)';
  RAISE NOTICE '- 3 Pagos (2 completados, 1 pendiente)';
  RAISE NOTICE '============================================';

END $$;

-- Verificar datos creados
SELECT 'Servicios' as tabla, count(*) as total FROM trainer_services WHERE website_id IN (SELECT w.id FROM websites w JOIN clients c ON w.client_id = c.id WHERE c.business_type = 'fitness')
UNION ALL
SELECT 'Customers', count(*) FROM customers WHERE email = 'pepe@gmail.com'
UNION ALL
SELECT 'Paquetes', count(*) FROM client_packages WHERE customer_id IN (SELECT id FROM customers WHERE email = 'pepe@gmail.com')
UNION ALL
SELECT 'Sesiones', count(*) FROM bookings WHERE customer_email = 'pepe@gmail.com'
UNION ALL
SELECT 'Progreso', count(*) FROM client_progress WHERE customer_id IN (SELECT id FROM customers WHERE email = 'pepe@gmail.com')
UNION ALL
SELECT 'Records', count(*) FROM client_records WHERE customer_id IN (SELECT id FROM customers WHERE email = 'pepe@gmail.com')
UNION ALL
SELECT 'Pagos', count(*) FROM payments WHERE customer_id IN (SELECT id FROM customers WHERE email = 'pepe@gmail.com');
