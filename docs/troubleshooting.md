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

## "Turborepo cache issues"

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
