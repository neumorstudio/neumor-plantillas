# Architecture

Resumen operativo de arquitectura y flujo de datos para contributors.

## Módulos principales

- `apps/admin` (Next.js 15)
  - Panel de administración + APIs backend en `src/app/api/`
  - Server Actions en `src/lib/actions*.ts`
- `apps/templates/*` (Astro)
  - Plantillas públicas por vertical
  - Formularios públicos apuntan a APIs del admin
- `apps/templates/unified` (Astro)
  - Multi-tenant: resuelve `subdomain`/`custom_domain` vía middleware
  - Cache en middleware ~60s, en preview (`?preview=1`) se omite
- `packages/api-utils`
  - CORS, rate-limit, validaciones compartidas
- `packages/supabase`
  - Tipos y migraciones SQL (source of truth)
- `packages/logger`
  - Logger estructurado
- `packages/cli`
  - Provisioning de clientes

## Flujo de datos (alto nivel)

1. Usuario interactúa con una plantilla (Astro).
2. Formularios públicos envían datos a APIs del admin (`/api/...`).
3. Las APIs validan, rate-limit, escriben en Supabase y disparan emails.
4. Admin consume datos vía server actions (Next.js) y muestra UI.

Regla clave:
- **Nunca** escribir directo a Supabase desde frontend. Usar APIs del admin.

## Multi-tenant / `website_id`

- La tabla `websites` define configuración y branding por cliente.
- `website_id` es la clave que relaciona reservas, pedidos, clientes, etc.
- `apps/templates/unified` resuelve el tenant vía `subdomain` o `custom_domain`.

## Configuración y personalización

- La personalización se guarda en `websites.config`.
- Section builder usa `config.sectionsConfig` (ver `packages/supabase/src/sections-catalog.ts`).
- Legacy: algunos textos pueden existir en `config.content`.

## DB y migraciones

- Migrations fuente: `packages/supabase/migrations/`.
- Supabase CLI local: `supabase/migrations/`.
- No crear ni modificar migraciones sin ticket explícito.

## Rutas críticas

- Admin APIs: `apps/admin/src/app/api/*`.
- Server actions: `apps/admin/src/lib/actions*.ts`.
- Templates forms:
  - `AppointmentForm.astro` → `/api/citas`
  - `ReservationForm.astro` → `/api/reservas`
  - `ClassBookingForm.astro` → `/api/entrenamientos`
  - `ContactForm.astro` → `/api/contacto` o `/api/presupuestos`

