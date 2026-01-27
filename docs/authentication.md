---
title: Authentication
description: Autenticación y manejo de sesiones en admin y templates.
---

## Supabase Auth

El sistema usa Supabase Auth como proveedor principal. Las sesiones se manejan vía cookies con `@supabase/ssr` tanto en Server Components como en middleware.

### Admin (Next.js)

- Login por email/password (`supabase.auth.signInWithPassword`).
- Middleware protege rutas `/dashboard` y `/change-password`.
- Si el usuario tiene `user_metadata.must_change_password`, se redirige a `/change-password`.

Archivos clave:

- `apps/admin/src/middleware.ts`
- `apps/admin/src/app/login/page.tsx`
- `apps/admin/src/lib/supabase.ts`
- `apps/admin/src/lib/supabase-server.ts`

### Templates públicos (Astro)

- Las plantillas usan `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY` para lectura pública.
- Los writes públicos (reservas/citas/pedidos) se procesan en endpoints del admin con `SUPABASE_SERVICE_ROLE_KEY`.
- La seguridad de datos se apoya en RLS y allowlists de CORS en endpoints públicos.

### Portal de clientes (Gym)

El portal `/mi-cuenta` usa Supabase Auth con OAuth de Google y cookies SSR.

Archivos clave:

- `apps/templates/gym/src/lib/supabase-portal.ts`
- `apps/templates/gym/src/pages/mi-cuenta/auth/google.ts`
- `apps/templates/gym/src/pages/mi-cuenta/callback.astro`

## Claves y secretos

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: se usa en cliente y SSR.
- `SUPABASE_SERVICE_ROLE_KEY`: solo en backend (admin APIs).
- No expongas la service role en el frontend ni en templates.

## Buenas prácticas

- Mantén `SUPABASE_SERVICE_ROLE_KEY` únicamente en `apps/admin`.
- Revisa políticas RLS al añadir nuevas tablas.
- Usa los endpoints del admin para operaciones públicas.
