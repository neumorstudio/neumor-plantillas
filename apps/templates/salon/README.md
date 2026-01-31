# NeumorStudio Template: Salon (Astro 5 SSR)

Plantilla publica para negocios de salon. Render SSR con Astro, configuracion desde Supabase y formularios via API del admin.

## Mapa rapido

- `src/pages/index.astro`: entrada principal, preview mode, mapeo de variantes, mezcla defaults + Supabase.
- `src/lib/supabase.ts`: cliente Supabase solo lectura, tipos y fetchers.
- `src/components/`: secciones y variantes (Hero, Services, Features, Footer, `AppointmentForm.astro`).
- `src/layouts/Layout.astro`: HTML base y metadatos.
- `src/styles/`: estilos globales y temas.

## Flujo de datos (no escribir directo en Supabase)

- Lee `websites.config` por `PUBLIC_WEBSITE_ID` o por dominio.
- `AppointmentForm.astro` envia al webhook configurado:
  - Default: `${PUBLIC_ADMIN_URL}/api/citas`
  - Fallback: `PUBLIC_APPOINTMENT_WEBHOOK_URL`
- Si Supabase no esta configurado, usa `defaultConfig`.

## Preview mode

- Agrega `?preview=1` y parametros `theme`/`v_*` (ver comentarios en `src/pages/index.astro`).

## Variables de entorno

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_WEBSITE_ID`
- `PUBLIC_ADMIN_URL` (recomendado)
- `PUBLIC_APPOINTMENT_WEBHOOK_URL` (fallback)

## Desarrollo local

Desde la raiz del repo:

- `pnpm dev:salon`
- `pnpm dev --filter @neumorstudio/template-salon`

## Notas para cambios

- No agregar llamadas directas a Supabase desde frontend; usar `/api/citas`.
- Para nuevas variantes: crear componente en `src/components/<Seccion>/` y exportarlo en el `index.ts` de la seccion.
