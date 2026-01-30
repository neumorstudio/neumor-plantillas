-- Menu items schema (orders functionality removed)

-- ============================================
-- MENU ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    category TEXT NOT NULL,
    tag TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_menu_items_website_id ON menu_items(website_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(website_id, category);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Public read for menu data
CREATE POLICY "Public can view menu items"
    ON menu_items FOR SELECT
    USING (true);

-- Owners manage their menu items
CREATE POLICY "Users can manage own menu items"
    ON menu_items FOR ALL
    TO authenticated
    USING (
        website_id IN (
            SELECT websites.id
            FROM websites
            JOIN clients ON clients.id = websites.client_id
            WHERE clients.auth_user_id = auth.uid()
        )
    )
    WITH CHECK (
        website_id IN (
            SELECT websites.id
            FROM websites
            JOIN clients ON clients.id = websites.client_id
            WHERE clients.auth_user_id = auth.uid()
        )
    );

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
