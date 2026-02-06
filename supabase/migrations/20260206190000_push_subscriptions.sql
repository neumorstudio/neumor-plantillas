-- Push subscriptions for PWA notifications

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID REFERENCES public.websites(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_website
  ON public.push_subscriptions(website_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can view own push subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own push subscriptions"
  ON public.push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own push subscriptions"
  ON public.push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own push subscriptions"
  ON public.push_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    website_id IN (
      SELECT websites.id
      FROM public.websites
      JOIN public.clients ON public.clients.id = public.websites.client_id
      WHERE public.clients.auth_user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS push_subscriptions_updated_at ON public.push_subscriptions;
CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
