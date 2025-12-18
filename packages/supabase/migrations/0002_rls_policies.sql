-- NeumorStudio Row Level Security Policies
-- Each client can only access their own data

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CLIENTS policies
-- Users can only see/edit their own client record
-- ============================================
CREATE POLICY "Users can view own client"
    ON clients FOR SELECT
    USING (auth.uid()::TEXT = id::TEXT);

CREATE POLICY "Users can update own client"
    ON clients FOR UPDATE
    USING (auth.uid()::TEXT = id::TEXT);

-- ============================================
-- WEBSITES policies
-- Users can only access websites linked to their client
-- ============================================
CREATE POLICY "Users can view own website"
    ON websites FOR SELECT
    USING (client_id::TEXT = auth.uid()::TEXT);

CREATE POLICY "Users can update own website"
    ON websites FOR UPDATE
    USING (client_id::TEXT = auth.uid()::TEXT);

-- ============================================
-- BOOKINGS policies
-- Users can access bookings for their website
-- Public can insert bookings (for reservation forms)
-- ============================================
CREATE POLICY "Users can view own bookings"
    ON bookings FOR SELECT
    USING (
        website_id IN (
            SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
        )
    );

CREATE POLICY "Users can update own bookings"
    ON bookings FOR UPDATE
    USING (
        website_id IN (
            SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
        )
    );

CREATE POLICY "Public can insert bookings"
    ON bookings FOR INSERT
    WITH CHECK (true);

-- ============================================
-- LEADS policies
-- Users can access leads for their website
-- Public can insert leads (for contact forms)
-- ============================================
CREATE POLICY "Users can view own leads"
    ON leads FOR SELECT
    USING (
        website_id IN (
            SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
        )
    );

CREATE POLICY "Users can update own leads"
    ON leads FOR UPDATE
    USING (
        website_id IN (
            SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
        )
    );

CREATE POLICY "Public can insert leads"
    ON leads FOR INSERT
    WITH CHECK (true);

-- ============================================
-- NOTIFICATION_SETTINGS policies
-- Users can manage settings for their website
-- ============================================
CREATE POLICY "Users can view own notification settings"
    ON notification_settings FOR SELECT
    USING (
        website_id IN (
            SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
        )
    );

CREATE POLICY "Users can update own notification settings"
    ON notification_settings FOR UPDATE
    USING (
        website_id IN (
            SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
        )
    );

CREATE POLICY "Users can insert own notification settings"
    ON notification_settings FOR INSERT
    WITH CHECK (
        website_id IN (
            SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
        )
    );

-- ============================================
-- ACTIVITY_LOG policies
-- Users can view activity for their website (read-only)
-- ============================================
CREATE POLICY "Users can view own activity"
    ON activity_log FOR SELECT
    USING (
        website_id IN (
            SELECT id FROM websites WHERE client_id::TEXT = auth.uid()::TEXT
        )
    );

-- Service role can insert activity logs (from n8n webhooks)
CREATE POLICY "Service can insert activity"
    ON activity_log FOR INSERT
    WITH CHECK (true);
