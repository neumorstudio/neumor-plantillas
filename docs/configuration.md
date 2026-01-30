---
title: Configuration
description: Variables de entorno y configuración por app.
---

## Variables globales (.env)

Archivo raíz `.env` (usa `.env.example` como base):

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### n8n

- `N8N_WEBHOOK_URL`
- `N8N_API_KEY`
- `N8N_NEWSLETTER_WEBHOOK_URL`

### Templates (Astro)

- `PUBLIC_WEBSITE_ID` (opcional en producción, útil en local)
- `PUBLIC_RESERVATION_WEBHOOK_URL`

### Newsletter / Email

- `NEWSLETTER_FROM_EMAIL`
- `NEWSLETTER_REPLY_TO`
- `EMAIL_PROVIDER` (`resend`, `mailgun`, `smtp`)
- `RESEND_API_KEY`

## Admin (apps/admin/.env)

Variables principales según `apps/admin/.env.example`:

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### SuperAdmin

- `SUPERADMIN_EMAILS` (lista de emails con acceso superadmin, comma-separated)

### Resend (email)

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO`

### Groq (newsletter AI opcional)

- `GROQ_API_KEY`

### App URL

- `NEXT_PUBLIC_APP_URL`

## Templates (apps/templates/*/.env)

### Restaurante

Archivo: `apps/templates/restaurant/.env.example`

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_WEBSITE_ID`
- `PUBLIC_ADMIN_URL`
- `PUBLIC_RESERVATION_WEBHOOK_URL` (alternativa a `PUBLIC_ADMIN_URL`)

### Salon / Clinic / Repairs / Store / Gym

Todos usan `PUBLIC_SUPABASE_URL` y `PUBLIC_SUPABASE_ANON_KEY`. Además:

- `PUBLIC_ADMIN_URL` apunta a los endpoints del admin para formularios públicos.
- `PUBLIC_WEBSITE_ID` puede forzar el website en desarrollo.

Ejemplo (gym): `apps/templates/gym/.env.example`.

## Notas

- En Astro, cualquier variable pública debe llevar el prefijo `PUBLIC_`.
- No expongas `SUPABASE_SERVICE_ROLE_KEY` fuera del backend.
