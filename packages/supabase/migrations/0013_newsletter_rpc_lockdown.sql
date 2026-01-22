-- Lock down newsletter RPC execution (deny-by-default).
-- Intended to be called only by a privileged backend connection (function owner).

REVOKE EXECUTE ON FUNCTION public.get_pending_newsletters() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_newsletter_sent(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_newsletter_audience(uuid, text) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE EXECUTE ON FUNCTION public.get_pending_newsletters() FROM anon;
    REVOKE EXECUTE ON FUNCTION public.mark_newsletter_sent(uuid) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.get_newsletter_audience(uuid, text) FROM anon;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE EXECUTE ON FUNCTION public.get_pending_newsletters() FROM authenticated;
    REVOKE EXECUTE ON FUNCTION public.mark_newsletter_sent(uuid) FROM authenticated;
    REVOKE EXECUTE ON FUNCTION public.get_newsletter_audience(uuid, text) FROM authenticated;
  END IF;
END $$;

ALTER FUNCTION public.get_pending_newsletters() SET search_path = public;
ALTER FUNCTION public.mark_newsletter_sent(uuid) SET search_path = public;
ALTER FUNCTION public.get_newsletter_audience(uuid, text) SET search_path = public;

-- Verification (run manually):
-- SELECT has_function_privilege('anon', 'public.get_pending_newsletters()', 'EXECUTE');
-- SELECT has_function_privilege('authenticated', 'public.get_pending_newsletters()', 'EXECUTE');
