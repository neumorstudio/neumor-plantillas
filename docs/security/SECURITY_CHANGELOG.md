# Security ChangeLog

## Audit Context

**Project:** neumor-plantillas (SaaS multi-tenant)
**Stack:** Next.js + Supabase + Stripe
**Date:** 2026-01-22
**Commit:** `18a87490cb24ddacb0e5d9ca97e9ebc904ae93e0`
**Auditor Role:** Senior Security Engineer (AppSec) + Backend

This audit focused on hardening public-facing endpoints and database-level access controls in a multi-tenant SaaS architecture. The primary attack surface was identified as public API endpoints that use `service_role` (RLS bypass) and could be exploited without proper origin validation, input sanitization, and rate limiting.

---

## Findings Summary

| ID | Severity | Status |
|----|----------|--------|
| H-01 | High | ✅ Verified |
| H-02 | High | ✅ Verified |
| H-03 | High | ✅ Verified |
| H-06 | Medium | ✅ Verified |
| H-07 | Medium | ✅ Verified |

---

## Detailed Findings

### H-01: Newsletter RPC Functions Exposed to PUBLIC

**Description:**
Newsletter RPC functions (`get_pending_newsletters`, `mark_newsletter_sent`, `get_newsletter_audience`) were executable by `PUBLIC`, `anon`, and `authenticated` roles. These functions should only be callable by backend services.

**Impact:**
- Unauthorized users could list pending newsletters
- Potential data leakage of newsletter audiences
- Ability to mark newsletters as sent without authorization

**Fix Applied:**
```sql
REVOKE EXECUTE ON FUNCTION public.get_pending_newsletters() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_pending_newsletters() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_pending_newsletters() FROM authenticated;
-- (same for mark_newsletter_sent and get_newsletter_audience)
ALTER FUNCTION ... SET search_path = public;
```

**Migration:** `0012_restrict_newsletter_rpc.sql`, `0013_newsletter_rpc_lockdown.sql`
**Status:** ✅ Verified

---

### H-02: Public INSERT on Bookings and Leads Tables

**Description:**
RLS policies allowed `anon` role to INSERT directly into `bookings` and `leads` tables, bypassing the intended flow through validated API endpoints.

**Impact:**
- Direct database writes bypassing business logic validation
- Potential spam/abuse of booking and lead systems
- Data integrity issues from unvalidated inserts

**Fix Applied:**
```sql
DROP POLICY IF EXISTS "Public can insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public can insert leads" ON public.leads;
REVOKE INSERT ON public.bookings FROM anon;
REVOKE INSERT ON public.leads FROM anon;
```

**Migration:** `0014_rls_bookings_leads.sql`, `0016_fix_bookings_leads_insert_policy.sql`
**Status:** ✅ Verified

---

### H-03: Public Endpoints Lack Security Controls

**Description:**
Public endpoints `/api/reservas` and `/api/pedidos/intent` used `service_role` (RLS bypass) but lacked:
- CORS origin validation against `websites.domain`
- Strict payload validation (unknown field rejection)
- Rate limiting

**Impact:**
- Cross-origin attacks from unauthorized domains
- Mass parameter injection
- Denial of service through unlimited requests
- Potential data manipulation via unexpected fields

**Fix Applied:**

| Control | Implementation |
|---------|----------------|
| CORS Allowlist | Origin validated against `websites.domain` (exact match, www variant, localhost in dev) |
| Payload Validation | Unknown keys rejected with 400; strict type checking |
| Rate Limiting | In-memory, 20 req/60s (reservas), 15 req/60s (pedidos/intent), key: IP+website_id |
| String Truncation | name≤200, phone≤50, email≤254, notes≤1000 chars |
| Quantity Sanitization | `Math.floor()` to prevent float manipulation |

**Files Modified:**
- `apps/admin/src/app/api/reservas/route.ts`
- `apps/admin/src/app/api/pedidos/intent/route.ts`

**Status:** ✅ Verified

---

### H-06: Potential XSS in OrderOnline Cart Rendering

**Description:**
Review of `OrderOnline.astro` to ensure cart rendering does not use `innerHTML` with user-controlled data (item names from database).

**Impact:**
If vulnerable, malicious item names could execute JavaScript in user browsers.

**Finding:**
Code already implements safe patterns:
- `textContent` used for all dynamic data (auto-escapes HTML)
- `innerHTML = ""` only used to clear containers
- Astro auto-escapes `{variable}` in templates
- `set:html` only used for static hardcoded SVG icons

**Fix Applied:**
None required. Documented safe patterns in verification checklist.

**Status:** ✅ Verified (No vulnerability found)

---

### H-07: Activity Log INSERT Not Restricted

**Description:**
The `activity_log` table INSERT policy used `WITH CHECK (true)` without a `TO` clause, effectively allowing all roles to insert.

**Impact:**
- Log injection/pollution by unauthorized users
- Potential audit trail manipulation
- False activity records

**Fix Applied:**
```sql
DROP POLICY IF EXISTS "Service can insert activity" ON public.activity_log;
REVOKE INSERT ON public.activity_log FROM anon;
REVOKE INSERT ON public.activity_log FROM authenticated;
CREATE POLICY "Backend can insert activity"
  ON public.activity_log FOR INSERT TO service_role
  WITH CHECK (true);
```

**Migration:** `0017_activity_log_lockdown.sql`
**Status:** ✅ Verified

---

## Scope

### In Scope

| Area | Details |
|------|---------|
| Public API Endpoints | `/api/reservas`, `/api/pedidos/intent` |
| Database RLS Policies | `bookings`, `leads`, `activity_log` |
| RPC Functions | Newsletter functions |
| Frontend Rendering | `OrderOnline.astro` cart rendering |

### Out of Scope

| Area | Reason |
|------|--------|
| Instagram Integration | Explicitly excluded per project requirements |
| Facebook Integration | Explicitly excluded per project requirements |
| Google Business Integration | Explicitly excluded per project requirements |
| OAuth/Social Login | Explicitly excluded per project requirements |
| Social Tokens | Explicitly excluded per project requirements |
| Admin Panel Authentication | Not part of this audit phase |
| Payment Processing (Stripe) | Handled by Stripe's PCI-compliant infrastructure |

---

## Verification

All findings can be verified using the checklist in:
**`docs/security/public-api-verification.md`**

Quick SQL verification:
```sql
SELECT 'H-01' AS check, NOT has_function_privilege('anon', 'public.get_pending_newsletters()', 'EXECUTE') AS passed
UNION ALL SELECT 'H-02', NOT has_table_privilege('anon', 'public.bookings', 'INSERT')
UNION ALL SELECT 'H-07', NOT has_table_privilege('anon', 'public.activity_log', 'INSERT');
-- All should return passed = true
```

---

## Recommendations for Future Work

1. **Centralize rate limiting** - Consider Redis-based rate limiting for consistency across serverless instances
2. **Add request logging** - Log blocked CORS attempts and rate limit hits for monitoring
3. **Security headers** - Add CSP, X-Frame-Options, etc. at edge/middleware level
4. **Periodic RLS audit** - Review policies when adding new tables

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-22 | Initial security audit completed (H-01 through H-07) |
