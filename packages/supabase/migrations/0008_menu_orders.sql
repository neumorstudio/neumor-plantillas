-- Menu items and online orders schema

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

-- ============================================
-- ORDER SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS order_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    pickup_start_time TIME NOT NULL DEFAULT '12:00',
    pickup_end_time TIME NOT NULL DEFAULT '22:00',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(website_id)
);

ALTER TABLE order_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view order settings"
    ON order_settings FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own order settings"
    ON order_settings FOR ALL
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

CREATE TRIGGER update_order_settings_updated_at
    BEFORE UPDATE ON order_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    website_id UUID REFERENCES websites(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'failed', 'refunded')),
    currency TEXT DEFAULT 'eur',
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    stripe_payment_intent_id TEXT,
    stripe_payment_status TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_website_id ON orders(website_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    TO authenticated
    USING (
        website_id IN (
            SELECT websites.id
            FROM websites
            JOIN clients ON clients.id = websites.client_id
            WHERE clients.auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (
        website_id IN (
            SELECT websites.id
            FROM websites
            JOIN clients ON clients.id = websites.client_id
            WHERE clients.auth_user_id = auth.uid()
        )
    );

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id),
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
    total_price INTEGER NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        order_id IN (
            SELECT orders.id
            FROM orders
            WHERE orders.website_id IN (
                SELECT websites.id
                FROM websites
                JOIN clients ON clients.id = websites.client_id
                WHERE clients.auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own order items"
    ON order_items FOR UPDATE
    TO authenticated
    USING (
        order_id IN (
            SELECT orders.id
            FROM orders
            WHERE orders.website_id IN (
                SELECT websites.id
                FROM websites
                JOIN clients ON clients.id = websites.client_id
                WHERE clients.auth_user_id = auth.uid()
            )
        )
    );
