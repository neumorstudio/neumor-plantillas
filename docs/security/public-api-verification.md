# Security Hardening Verification Checklist

Quick verification of all security hardenings applied to the SaaS.

**Estimated time:** 10 minutes

---

## Setup

```bash
export ADMIN_URL="https://admin.neumorstudio.com"
export WEBSITE_ID="00000000-0000-0000-0000-000000000000"
export ORIGIN_OK="https://example.com"
export ORIGIN_BAD="https://attacker.example"
```

---

## H-01: Newsletter RPC Lockdown

**Goal:** Newsletter RPCs only executable by backend (owner/service_role), not PUBLIC/anon/authenticated.

### SQL Verification

```sql
-- Check EXECUTE revoked from PUBLIC
SELECT has_function_privilege('public', 'public.get_pending_newsletters()', 'EXECUTE') AS public_pending;
SELECT has_function_privilege('public', 'public.mark_newsletter_sent(uuid)', 'EXECUTE') AS public_mark;
SELECT has_function_privilege('public', 'public.get_newsletter_audience(uuid,text)', 'EXECUTE') AS public_audience;
```

| Check | Expected |
|-------|----------|
| public_pending | `false` |
| public_mark | `false` |
| public_audience | `false` |

```sql
-- Check EXECUTE revoked from anon/authenticated
SELECT has_function_privilege('anon', 'public.get_pending_newsletters()', 'EXECUTE') AS anon_pending;
SELECT has_function_privilege('authenticated', 'public.get_pending_newsletters()', 'EXECUTE') AS auth_pending;
```

| Check | Expected |
|-------|----------|
| anon_pending | `false` |
| auth_pending | `false` |

---

## H-02: Bookings/Leads INSERT Lockdown

**Goal:** No public INSERT on bookings/leads. Only backend (service_role) can insert.

### SQL Verification

```sql
-- Check INSERT policies (should only allow authenticated with tenant check, or none for public)
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename IN ('bookings', 'leads') AND cmd = 'INSERT';
```

| Expected Result |
|-----------------|
| No policy with `roles = {anon}` or `roles = {public}` |
| Only `{authenticated}` with tenant-scoped WITH CHECK, or `{service_role}` |

```sql
-- Check table-level privileges
SELECT has_table_privilege('anon', 'public.bookings', 'INSERT') AS anon_bookings;
SELECT has_table_privilege('anon', 'public.leads', 'INSERT') AS anon_leads;
```

| Check | Expected |
|-------|----------|
| anon_bookings | `false` |
| anon_leads | `false` |

---

## H-03: Public Endpoint Hardening

**Goal:** /api/reservas and /api/pedidos/intent protected with CORS allowlist, payload validation, rate limiting.

### /api/reservas

#### CORS - Valid origin (expect 2xx)

```bash
curl -i "$ADMIN_URL/api/reservas" \
  -H "Origin: $ORIGIN_OK" \
  -H "Content-Type: application/json" \
  -d '{
    "website_id": "'$WEBSITE_ID'",
    "nombre": "Ana",
    "email": "ana@example.com",
    "telefono": "+34 600 000 000",
    "fecha": "2030-12-31",
    "hora": "20:30",
    "personas": 2
  }'
```

| Check | Expected |
|-------|----------|
| Status | `2xx` |
| `Access-Control-Allow-Origin` | `$ORIGIN_OK` (not `*`) |

#### CORS - Invalid origin (expect 403)

```bash
curl -i "$ADMIN_URL/api/reservas" \
  -H "Origin: $ORIGIN_BAD" \
  -H "Content-Type: application/json" \
  -d '{
    "website_id": "'$WEBSITE_ID'",
    "nombre": "Ana",
    "telefono": "+34 600 000 000",
    "fecha": "2030-12-31",
    "hora": "20:30",
    "personas": 2
  }'
```

| Check | Expected |
|-------|----------|
| Status | `403` |

#### Payload validation - Extra field (expect 400)

```bash
curl -i "$ADMIN_URL/api/reservas" \
  -H "Origin: $ORIGIN_OK" \
  -H "Content-Type: application/json" \
  -d '{
    "website_id": "'$WEBSITE_ID'",
    "nombre": "Ana",
    "telefono": "+34 600 000 000",
    "fecha": "2030-12-31",
    "hora": "20:30",
    "personas": 2,
    "malicious_field": "injected"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `400` |

#### Rate limit (expect 429 after 20 requests)

```bash
for i in {1..25}; do
  curl -s -o /dev/null -w "%{http_code}\n" "$ADMIN_URL/api/reservas" \
    -H "Origin: $ORIGIN_OK" \
    -H "Content-Type: application/json" \
    -d '{
      "website_id": "'$WEBSITE_ID'",
      "nombre": "Test'$i'",
      "telefono": "+34 600 000 000",
      "fecha": "2030-12-31",
      "hora": "20:30",
      "personas": 2
    }'
done
```

| Check | Expected |
|-------|----------|
| Requests 1-20 | `2xx` |
| Requests 21+ | `429` |

### /api/pedidos/intent

#### CORS - Valid origin (expect 2xx)

```bash
curl -i "$ADMIN_URL/api/pedidos/intent" \
  -H "Origin: $ORIGIN_OK" \
  -H "Content-Type: application/json" \
  -d '{
    "website_id": "'$WEBSITE_ID'",
    "items": [{"id": "MENU_ITEM_UUID", "quantity": 1}],
    "customer": {"name": "Ana", "phone": "+34 600 000 000"},
    "pickup_date": "2030-12-31",
    "pickup_time": "14:00"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `2xx` |
| Response | `{"client_secret": "...", "order_id": "..."}` |

#### CORS - Invalid origin (expect 403)

```bash
curl -i "$ADMIN_URL/api/pedidos/intent" \
  -H "Origin: $ORIGIN_BAD" \
  -H "Content-Type: application/json" \
  -d '{
    "website_id": "'$WEBSITE_ID'",
    "items": [{"id": "MENU_ITEM_UUID", "quantity": 1}],
    "customer": {"name": "Ana", "phone": "+34 600 000 000"},
    "pickup_date": "2030-12-31",
    "pickup_time": "14:00"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `403` |

#### Payload validation - Extra fields (expect 400)

```bash
# Extra field in body
curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL/api/pedidos/intent" \
  -H "Origin: $ORIGIN_OK" -H "Content-Type: application/json" \
  -d '{"website_id":"'$WEBSITE_ID'","items":[{"id":"x","quantity":1}],"customer":{"name":"A","phone":"1"},"pickup_date":"2030-12-31","pickup_time":"14:00","extra":"bad"}'

# Extra field in customer
curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL/api/pedidos/intent" \
  -H "Origin: $ORIGIN_OK" -H "Content-Type: application/json" \
  -d '{"website_id":"'$WEBSITE_ID'","items":[{"id":"x","quantity":1}],"customer":{"name":"A","phone":"1","admin":true},"pickup_date":"2030-12-31","pickup_time":"14:00"}'

# Extra field in item
curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL/api/pedidos/intent" \
  -H "Origin: $ORIGIN_OK" -H "Content-Type: application/json" \
  -d '{"website_id":"'$WEBSITE_ID'","items":[{"id":"x","quantity":1,"price":0}],"customer":{"name":"A","phone":"1"},"pickup_date":"2030-12-31","pickup_time":"14:00"}'
```

| Check | Expected |
|-------|----------|
| All three | `400` |

#### Quantity edge cases

```bash
# quantity: -1 (expect 400 - empty cart)
curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL/api/pedidos/intent" \
  -H "Origin: $ORIGIN_OK" -H "Content-Type: application/json" \
  -d '{"website_id":"'$WEBSITE_ID'","items":[{"id":"x","quantity":-1}],"customer":{"name":"A","phone":"1"},"pickup_date":"2030-12-31","pickup_time":"14:00"}'

# quantity: 1.9 (expect 2xx - floors to 1)
curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL/api/pedidos/intent" \
  -H "Origin: $ORIGIN_OK" -H "Content-Type: application/json" \
  -d '{"website_id":"'$WEBSITE_ID'","items":[{"id":"VALID_MENU_ITEM","quantity":1.9}],"customer":{"name":"A","phone":"1"},"pickup_date":"2030-12-31","pickup_time":"14:00"}'
```

| Input | Expected |
|-------|----------|
| quantity: -1, 0 | `400` (filtered → empty cart) |
| quantity: 1.9 | `2xx` (floors to 1) |
| quantity: "2" | `2xx` (coerced to 2) |

#### Rate limit (expect 429 after 15 requests)

```bash
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" "$ADMIN_URL/api/pedidos/intent" \
    -H "Origin: $ORIGIN_OK" \
    -H "Content-Type: application/json" \
    -d '{
      "website_id": "'$WEBSITE_ID'",
      "items": [{"id": "MENU_ITEM_UUID", "quantity": 1}],
      "customer": {"name": "Test", "phone": "+34 600 000 000"},
      "pickup_date": "2030-12-31",
      "pickup_time": "14:00"
    }'
done
```

| Check | Expected |
|-------|----------|
| Requests 1-15 | `2xx` or `400` (if invalid item) |
| Requests 16+ | `429` |

**Note:** Rate limit is in-memory (best-effort). May reset on serverless cold starts.

---

## H-06: XSS Prevention in OrderOnline.astro

**Goal:** No XSS via innerHTML with user-controlled data.

### Code Verification

Check `OrderOnline.astro` uses safe DOM construction:

```javascript
// SAFE - uses textContent (auto-escapes HTML)
const name = document.createElement("div");
name.textContent = item.name;  // Line ~649

// SAFE - only clears container
cartItemsEl.innerHTML = "";    // Line ~639
```

### Manual Test

1. Open browser dev tools on order page
2. Add item with XSS payload name: `<img src=x onerror=alert(1)>`
3. Verify: Text renders literally, no alert executes

| Check | Expected |
|-------|----------|
| `<script>` in item name | Renders as text |
| `<img onerror=...>` in name | Renders as text |
| Cart displays HTML tags | Literally, not executed |

### Safe Patterns Confirmed

- `document.createElement()` + `textContent` for all dynamic data
- `innerHTML = ""` only to clear (no user data)
- Astro auto-escapes `{variable}` in templates
- `set:html` only for static hardcoded SVG icons

---

## H-07: Activity Log INSERT Lockdown

**Goal:** activity_log INSERT only allowed for service_role (backend).

### SQL Verification

```sql
-- Check INSERT policies
SELECT tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'activity_log' AND cmd = 'INSERT';
```

| Expected Result |
|-----------------|
| Only `"Backend can insert activity"` with `roles = {service_role}` |

```sql
-- Check table-level privileges
SELECT
  has_table_privilege('anon', 'public.activity_log', 'INSERT') AS anon_insert,
  has_table_privilege('authenticated', 'public.activity_log', 'INSERT') AS auth_insert,
  has_table_privilege('service_role', 'public.activity_log', 'INSERT') AS service_insert;
```

| Check | Expected |
|-------|----------|
| anon_insert | `false` |
| auth_insert | `false` |
| service_insert | `true` |

---

## Quick Verification Script

Run all SQL checks at once:

```sql
-- H-01: Newsletter RPCs
SELECT 'H-01' AS check,
  NOT has_function_privilege('public', 'public.get_pending_newsletters()', 'EXECUTE') AND
  NOT has_function_privilege('anon', 'public.get_pending_newsletters()', 'EXECUTE') AND
  NOT has_function_privilege('authenticated', 'public.get_pending_newsletters()', 'EXECUTE')
  AS passed;

-- H-02: Bookings/Leads no anon INSERT
SELECT 'H-02' AS check,
  NOT has_table_privilege('anon', 'public.bookings', 'INSERT') AND
  NOT has_table_privilege('anon', 'public.leads', 'INSERT')
  AS passed;

-- H-07: Activity log locked
SELECT 'H-07' AS check,
  NOT has_table_privilege('anon', 'public.activity_log', 'INSERT') AND
  NOT has_table_privilege('authenticated', 'public.activity_log', 'INSERT') AND
  has_table_privilege('service_role', 'public.activity_log', 'INSERT')
  AS passed;
```

| Check | Expected |
|-------|----------|
| H-01 | `true` |
| H-02 | `true` |
| H-07 | `true` |

---

## Summary

| ID | Description | Type | Status |
|----|-------------|------|--------|
| H-01 | Newsletter RPC deny-by-default | RPC/REVOKE | ✅ |
| H-02 | Bookings/Leads no public INSERT | RLS/REVOKE | ✅ |
| H-03 | Public endpoints hardened (CORS, validation, rate limit) | Endpoint | ✅ |
| H-06 | XSS prevention in OrderOnline | Frontend | ✅ |
| H-07 | Activity log INSERT locked to backend | RLS/REVOKE | ✅ |
