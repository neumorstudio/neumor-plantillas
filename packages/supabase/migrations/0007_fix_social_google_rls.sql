-- Fix RLS policies to use clients.auth_user_id for social and Google Business tables

-- ============================================
-- SOCIAL ACCOUNTS
-- ============================================
DROP POLICY IF EXISTS "Users can view their social accounts" ON social_accounts;
DROP POLICY IF EXISTS "Users can manage their social accounts" ON social_accounts;

CREATE POLICY "Users can view their social accounts"
ON social_accounts FOR SELECT
TO authenticated
USING (
  website_id IN (
    SELECT websites.id
    FROM websites
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their social accounts"
ON social_accounts FOR ALL
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

-- ============================================
-- SCHEDULED POSTS
-- ============================================
DROP POLICY IF EXISTS "Users can view their scheduled posts" ON scheduled_posts;
DROP POLICY IF EXISTS "Users can manage their scheduled posts" ON scheduled_posts;

CREATE POLICY "Users can view their scheduled posts"
ON scheduled_posts FOR SELECT
TO authenticated
USING (
  website_id IN (
    SELECT websites.id
    FROM websites
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their scheduled posts"
ON scheduled_posts FOR ALL
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

-- ============================================
-- GOOGLE BUSINESS LOCATIONS
-- ============================================
DROP POLICY IF EXISTS "Users can view their google business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can insert their google business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can update their google business locations" ON google_business_locations;
DROP POLICY IF EXISTS "Users can delete their google business locations" ON google_business_locations;

CREATE POLICY "Users can view their google business locations"
ON google_business_locations FOR SELECT
TO authenticated
USING (
  social_account_id IN (
    SELECT social_accounts.id
    FROM social_accounts
    JOIN websites ON websites.id = social_accounts.website_id
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their google business locations"
ON google_business_locations FOR INSERT
TO authenticated
WITH CHECK (
  social_account_id IN (
    SELECT social_accounts.id
    FROM social_accounts
    JOIN websites ON websites.id = social_accounts.website_id
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their google business locations"
ON google_business_locations FOR UPDATE
TO authenticated
USING (
  social_account_id IN (
    SELECT social_accounts.id
    FROM social_accounts
    JOIN websites ON websites.id = social_accounts.website_id
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their google business locations"
ON google_business_locations FOR DELETE
TO authenticated
USING (
  social_account_id IN (
    SELECT social_accounts.id
    FROM social_accounts
    JOIN websites ON websites.id = social_accounts.website_id
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

-- ============================================
-- GOOGLE REVIEWS CACHE
-- ============================================
DROP POLICY IF EXISTS "Users can view their google reviews" ON google_reviews_cache;
DROP POLICY IF EXISTS "Users can insert their google reviews" ON google_reviews_cache;
DROP POLICY IF EXISTS "Users can update their google reviews" ON google_reviews_cache;
DROP POLICY IF EXISTS "Users can delete their google reviews" ON google_reviews_cache;

CREATE POLICY "Users can view their google reviews"
ON google_reviews_cache FOR SELECT
TO authenticated
USING (
  location_id IN (
    SELECT google_business_locations.id
    FROM google_business_locations
    JOIN social_accounts ON social_accounts.id = google_business_locations.social_account_id
    JOIN websites ON websites.id = social_accounts.website_id
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their google reviews"
ON google_reviews_cache FOR INSERT
TO authenticated
WITH CHECK (
  location_id IN (
    SELECT google_business_locations.id
    FROM google_business_locations
    JOIN social_accounts ON social_accounts.id = google_business_locations.social_account_id
    JOIN websites ON websites.id = social_accounts.website_id
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their google reviews"
ON google_reviews_cache FOR UPDATE
TO authenticated
USING (
  location_id IN (
    SELECT google_business_locations.id
    FROM google_business_locations
    JOIN social_accounts ON social_accounts.id = google_business_locations.social_account_id
    JOIN websites ON websites.id = social_accounts.website_id
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their google reviews"
ON google_reviews_cache FOR DELETE
TO authenticated
USING (
  location_id IN (
    SELECT google_business_locations.id
    FROM google_business_locations
    JOIN social_accounts ON social_accounts.id = google_business_locations.social_account_id
    JOIN websites ON websites.id = social_accounts.website_id
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
);
