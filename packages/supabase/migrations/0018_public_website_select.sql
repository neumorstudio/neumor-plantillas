-- Allow public (anon) to read website config for templates
-- This is safe because website config is displayed publicly on the site anyway

CREATE POLICY "Public can view active websites"
ON public.websites FOR SELECT
TO anon
USING (is_active = true);

-- Verification:
-- SELECT tablename, policyname, roles, cmd FROM pg_policies WHERE tablename = 'websites';
