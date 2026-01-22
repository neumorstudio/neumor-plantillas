-- Restrict newsletter RPC execution to backend roles

REVOKE EXECUTE ON FUNCTION public.get_pending_newsletters() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_newsletter_sent(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_newsletter_audience(uuid, text) FROM PUBLIC;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT EXECUTE ON FUNCTION public.get_pending_newsletters() TO service_role;
    GRANT EXECUTE ON FUNCTION public.mark_newsletter_sent(uuid) TO service_role;
    GRANT EXECUTE ON FUNCTION public.get_newsletter_audience(uuid, text) TO service_role;
  END IF;
END $$;

ALTER FUNCTION public.get_pending_newsletters() SET search_path = public;
ALTER FUNCTION public.mark_newsletter_sent(uuid) SET search_path = public;
ALTER FUNCTION public.get_newsletter_audience(uuid, text) SET search_path = public;
