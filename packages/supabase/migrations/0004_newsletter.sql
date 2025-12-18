-- Tabla para plantillas de newsletter
CREATE TABLE newsletter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,

  -- Contenido
  name TEXT NOT NULL, -- Nombre interno de la plantilla
  subject TEXT NOT NULL, -- Asunto del email
  preview_text TEXT, -- Texto de preview en bandeja
  html_content TEXT NOT NULL, -- Contenido HTML del email

  -- Estado
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para campanas enviadas
CREATE TABLE newsletter_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
  template_id UUID REFERENCES newsletter_templates(id) ON DELETE SET NULL,

  -- Info de la campana
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,

  -- Audiencia
  audience_type TEXT NOT NULL DEFAULT 'all_customers', -- 'all_customers', 'recent_customers', 'custom'
  audience_filter JSONB DEFAULT '{}', -- Filtros personalizados

  -- Estado
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Metricas
  total_recipients INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,

  -- Errores
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla para suscriptores (opcional, podemos usar bookings.customer_email)
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE,

  email TEXT NOT NULL,
  name TEXT,

  -- Estado
  is_subscribed BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,

  -- Origen
  source TEXT DEFAULT 'booking', -- 'booking', 'form', 'manual', 'import'

  -- Datos de booking (para segmentacion)
  last_booking_date DATE,
  total_bookings INTEGER DEFAULT 0,

  -- Metricas
  emails_received INTEGER DEFAULT 0,
  emails_opened INTEGER DEFAULT 0,
  last_email_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(website_id, email)
);

-- Indices
CREATE INDEX idx_newsletter_templates_website ON newsletter_templates(website_id);
CREATE INDEX idx_newsletter_campaigns_website ON newsletter_campaigns(website_id);
CREATE INDEX idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX idx_newsletter_subscribers_website ON newsletter_subscribers(website_id);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- RLS
ALTER TABLE newsletter_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Politicas RLS
CREATE POLICY "Users can view their newsletter templates"
ON newsletter_templates FOR SELECT
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can manage their newsletter templates"
ON newsletter_templates FOR ALL
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can view their newsletter campaigns"
ON newsletter_campaigns FOR SELECT
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can manage their newsletter campaigns"
ON newsletter_campaigns FOR ALL
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can view their newsletter subscribers"
ON newsletter_subscribers FOR SELECT
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can manage their newsletter subscribers"
ON newsletter_subscribers FOR ALL
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

-- Triggers para updated_at
CREATE TRIGGER update_newsletter_templates_updated_at
  BEFORE UPDATE ON newsletter_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_campaigns_updated_at
  BEFORE UPDATE ON newsletter_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_subscribers_updated_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Tabla para configuracion de automatizacion de newsletter
CREATE TABLE newsletter_automation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES websites(id) ON DELETE CASCADE UNIQUE,

  -- Estado
  is_enabled BOOLEAN DEFAULT false,

  -- Frecuencia
  frequency TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'biweekly', 'monthly'
  day_of_week INTEGER DEFAULT 1, -- 0=domingo, 1=lunes... (para weekly/biweekly)
  day_of_month INTEGER DEFAULT 1, -- 1-28 (para monthly)
  send_time TIME DEFAULT '10:00:00', -- Hora de envio
  timezone TEXT DEFAULT 'Europe/Madrid',

  -- Contenido automatico
  auto_content_type TEXT DEFAULT 'template', -- 'template', 'ai_generated', 'rss'
  default_template_id UUID REFERENCES newsletter_templates(id) ON DELETE SET NULL,

  -- Audiencia automatica
  auto_audience TEXT DEFAULT 'all', -- 'all', 'recent_30d', 'recent_60d', 'inactive_30d'

  -- Filtros adicionales
  min_bookings INTEGER DEFAULT 0, -- Minimo de reservas para recibir
  exclude_recent_days INTEGER DEFAULT 7, -- No enviar si recibio email hace X dias

  -- Metricas
  last_sent_at TIMESTAMPTZ,
  next_scheduled_at TIMESTAMPTZ,
  total_campaigns_sent INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice
CREATE INDEX idx_newsletter_automation_website ON newsletter_automation(website_id);
CREATE INDEX idx_newsletter_automation_next ON newsletter_automation(next_scheduled_at) WHERE is_enabled = true;

-- RLS
ALTER TABLE newsletter_automation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their newsletter automation"
ON newsletter_automation FOR SELECT
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

CREATE POLICY "Users can manage their newsletter automation"
ON newsletter_automation FOR ALL
TO authenticated
USING (website_id IN (
  SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
));

-- Trigger updated_at
CREATE TRIGGER update_newsletter_automation_updated_at
  BEFORE UPDATE ON newsletter_automation
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Funcion para calcular proxima fecha de envio
CREATE OR REPLACE FUNCTION calculate_next_newsletter_send(
  p_frequency TEXT,
  p_day_of_week INTEGER,
  p_day_of_month INTEGER,
  p_send_time TIME,
  p_timezone TEXT
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_next TIMESTAMPTZ;
  v_target_date DATE;
BEGIN
  v_now := NOW() AT TIME ZONE p_timezone;

  CASE p_frequency
    WHEN 'daily' THEN
      -- Manana a la hora configurada
      v_target_date := (v_now::DATE + INTERVAL '1 day')::DATE;

    WHEN 'weekly' THEN
      -- Proximo dia de la semana configurado
      v_target_date := v_now::DATE + ((p_day_of_week - EXTRACT(DOW FROM v_now)::INTEGER + 7) % 7 + 1)::INTEGER;
      IF v_target_date = v_now::DATE AND v_now::TIME > p_send_time THEN
        v_target_date := v_target_date + 7;
      END IF;

    WHEN 'biweekly' THEN
      -- Cada 2 semanas
      v_target_date := v_now::DATE + ((p_day_of_week - EXTRACT(DOW FROM v_now)::INTEGER + 7) % 7 + 1)::INTEGER;
      IF v_target_date = v_now::DATE AND v_now::TIME > p_send_time THEN
        v_target_date := v_target_date + 14;
      ELSE
        v_target_date := v_target_date + 7;
      END IF;

    WHEN 'monthly' THEN
      -- Dia del mes configurado
      IF EXTRACT(DAY FROM v_now) < p_day_of_month OR
         (EXTRACT(DAY FROM v_now) = p_day_of_month AND v_now::TIME <= p_send_time) THEN
        v_target_date := DATE_TRUNC('month', v_now)::DATE + (p_day_of_month - 1);
      ELSE
        v_target_date := (DATE_TRUNC('month', v_now) + INTERVAL '1 month')::DATE + (p_day_of_month - 1);
      END IF;

    ELSE
      v_target_date := v_now::DATE + 7; -- Default: 1 semana
  END CASE;

  v_next := (v_target_date || ' ' || p_send_time)::TIMESTAMP AT TIME ZONE p_timezone;

  RETURN v_next;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar next_scheduled_at cuando cambia la config
CREATE OR REPLACE FUNCTION update_next_scheduled()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_enabled THEN
    NEW.next_scheduled_at := calculate_next_newsletter_send(
      NEW.frequency,
      NEW.day_of_week,
      NEW.day_of_month,
      NEW.send_time,
      NEW.timezone
    );
  ELSE
    NEW.next_scheduled_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_newsletter_next_scheduled
  BEFORE INSERT OR UPDATE OF is_enabled, frequency, day_of_week, day_of_month, send_time, timezone
  ON newsletter_automation
  FOR EACH ROW
  EXECUTE FUNCTION update_next_scheduled();

-- Funcion RPC para obtener newsletters pendientes de envio (llamada desde n8n)
CREATE OR REPLACE FUNCTION get_pending_newsletters()
RETURNS SETOF newsletter_automation AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM newsletter_automation
  WHERE is_enabled = true
    AND next_scheduled_at IS NOT NULL
    AND next_scheduled_at <= NOW()
    AND default_template_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para marcar newsletter como enviado y calcular proxima fecha
CREATE OR REPLACE FUNCTION mark_newsletter_sent(p_automation_id UUID)
RETURNS void AS $$
DECLARE
  v_automation newsletter_automation;
BEGIN
  SELECT * INTO v_automation FROM newsletter_automation WHERE id = p_automation_id;

  IF v_automation IS NULL THEN
    RETURN;
  END IF;

  UPDATE newsletter_automation
  SET
    last_sent_at = NOW(),
    total_campaigns_sent = total_campaigns_sent + 1,
    next_scheduled_at = calculate_next_newsletter_send(
      v_automation.frequency,
      v_automation.day_of_week,
      v_automation.day_of_month,
      v_automation.send_time,
      v_automation.timezone
    )
  WHERE id = p_automation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para obtener suscriptores segun tipo de audiencia
CREATE OR REPLACE FUNCTION get_newsletter_audience(
  p_website_id UUID,
  p_audience_type TEXT
)
RETURNS TABLE (email TEXT, name TEXT) AS $$
BEGIN
  IF p_audience_type = 'recent_30d' THEN
    RETURN QUERY
    SELECT ns.email, ns.name
    FROM newsletter_subscribers ns
    WHERE ns.website_id = p_website_id
      AND ns.is_subscribed = true
      AND ns.last_booking_date >= CURRENT_DATE - INTERVAL '30 days';

  ELSIF p_audience_type = 'recent_60d' THEN
    RETURN QUERY
    SELECT ns.email, ns.name
    FROM newsletter_subscribers ns
    WHERE ns.website_id = p_website_id
      AND ns.is_subscribed = true
      AND ns.last_booking_date >= CURRENT_DATE - INTERVAL '60 days';

  ELSIF p_audience_type = 'inactive_30d' THEN
    RETURN QUERY
    SELECT ns.email, ns.name
    FROM newsletter_subscribers ns
    WHERE ns.website_id = p_website_id
      AND ns.is_subscribed = true
      AND (ns.last_booking_date IS NULL OR ns.last_booking_date < CURRENT_DATE - INTERVAL '30 days');

  ELSE -- 'all'
    RETURN QUERY
    SELECT ns.email, ns.name
    FROM newsletter_subscribers ns
    WHERE ns.website_id = p_website_id
      AND ns.is_subscribed = true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcion para sincronizar suscriptores desde bookings
CREATE OR REPLACE FUNCTION sync_booking_to_newsletter()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo si el booking tiene email
  IF NEW.customer_email IS NOT NULL AND NEW.customer_email != '' THEN
    INSERT INTO newsletter_subscribers (
      website_id,
      email,
      name,
      source,
      last_booking_date,
      total_bookings
    ) VALUES (
      NEW.website_id,
      NEW.customer_email,
      NEW.customer_name,
      'booking',
      NEW.booking_date,
      1
    )
    ON CONFLICT (website_id, email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, newsletter_subscribers.name),
      last_booking_date = GREATEST(EXCLUDED.last_booking_date, newsletter_subscribers.last_booking_date),
      total_bookings = newsletter_subscribers.total_bookings + 1,
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar automaticamente
CREATE TRIGGER sync_booking_newsletter
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION sync_booking_to_newsletter();
