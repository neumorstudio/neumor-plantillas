---
title: Troubleshooting
description: Problemas comunes y cómo resolverlos.
---

## Error: "Invalid Supabase URL"

**Causa:** `NEXT_PUBLIC_SUPABASE_URL` no está configurado o es inválido.

**Solución:**

- Verifica `.env` y/o `apps/admin/.env`.
- Asegúrate de usar la URL completa `https://xxxx.supabase.co`.

## Error: "RLS violation: new row violates row-level security"

**Causa:** el usuario no tiene permisos para escribir en la tabla por políticas RLS.

**Solución:**

- Revisa que el usuario esté autenticado.
- Verifica que `website_id` corresponde al cliente.
- Consulta `docs/DATABASE.md` y `docs/security/public-api-verification.md`.

## CORS 403 en endpoints públicos

**Causa:** el dominio no está permitido por el allowlist de CORS.

**Solución:**

- Asegura que el dominio del website exista en `websites.domain` y esté activo (`is_active = true`).
- En desarrollo, usa `localhost` (permitido en modo no producción).

## Formularios públicos no envían datos

**Causa:** falta `PUBLIC_ADMIN_URL` o webhook alternativo.

**Solución:**

- Configura `PUBLIC_ADMIN_URL` en la plantilla.
- Si usas webhooks externos, setea `PUBLIC_RESERVATION_WEBHOOK_URL` o equivalente.

## Pedidos online no aparecen

**Causa:** falta `PUBLIC_STRIPE_PUBLISHABLE_KEY` o el endpoint de intent.

**Solución:**

- Define `PUBLIC_STRIPE_PUBLISHABLE_KEY` en la plantilla restaurant.
- Asegura `PUBLIC_ADMIN_URL` o `PUBLIC_ORDER_INTENT_URL`.
- Verifica `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` en el admin.

## Google Business no aparece en el panel

**Causa:** feature flag desactivado.

**Solución:**

- `NEXT_PUBLIC_ENABLE_GOOGLE_BUSINESS=true` en `apps/admin/.env`.
- Configura credenciales OAuth (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

## “Turborepo cache issues”

```bash
pnpm clean
rm -rf .turbo
pnpm install
```

## Template no carga datos del cliente

**Checklist rápido:**

- `PUBLIC_WEBSITE_ID` correcto (en local).
- Registro existe en `websites` y `is_active` es true.
- RLS permite lectura pública en tablas necesarias.

Si el problema persiste, revisa `docs/GUIA-SIMULACION-CLIENTES.md`.
