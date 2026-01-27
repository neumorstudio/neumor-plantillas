---
title: Arquitectura
description: Arquitectura técnica y flujo de datos del SaaS.
---

## Vista general

El repositorio es un monorepo con Turborepo y pnpm. Está dividido en apps y paquetes compartidos:

```
apps/
  admin/              # Panel de administración (Next.js 15)
  templates/          # Sitios públicos (Astro 5 SSR)
packages/
  cli/                # Provisioning de clientes
  supabase/           # Migraciones y tipos
  ui/                 # Componentes compartidos
  n8n-templates/       # Workflows de automatización
```

## Componentes principales

```mermaid
flowchart LR
  Visitor[Cliente final] --> Template[Templates (Astro)]
  Template --> AdminAPI[Admin API (Next.js Route Handlers)]
  AdminPanel[Admin (Next.js)] --> Supabase[(Supabase Postgres)]
  AdminAPI --> Supabase
  AdminAPI --> Resend[Email/Resend]
  AdminAPI --> Stripe[Stripe]
  AdminAPI --> Google[Google Business]
  AdminAPI --> n8n[n8n Webhooks]
  Supabase --> AdminPanel
```

## Multi-tenancy y RLS

El aislamiento de datos se basa en `website_id` y políticas RLS en PostgreSQL:

- `clients` se vincula a `auth.users` por `auth_user_id`.
- `websites` pertenece a un `client`.
- Todas las tablas de negocio (bookings, leads, orders, etc.) incluyen `website_id`.

Este patrón permite que cada usuario vea solo los datos de su website sin lógica adicional en el frontend.

## Configuración por tipo de negocio

La tabla `business_type_config` define qué secciones del dashboard se muestran según el tipo de negocio (`business_type`). El layout del admin consulta esta tabla y ajusta el sidebar de manera dinámica.

## Flujos clave del producto

- **Carga de sitio público**: las plantillas leen `websites.config` y variantes de componentes para renderizar el sitio.
- **Captura de datos públicos**: formularios de reservas/citas/presupuestos/contacto envían datos a endpoints del admin o webhooks externos.
- **Gestión en el admin**: el panel consume Supabase con `website_id` y revalida rutas después de mutaciones.
- **Automatizaciones**: los workflows de `packages/n8n-templates` cubren captura de leads, reservas y recordatorios.

## Paquetes compartidos

- `packages/supabase`: migraciones SQL y tipos TypeScript generados.
- `packages/ui`: componentes compartidos entre apps.
- `packages/cli`: creación de clientes, websites y dominio en Vercel.

Para más detalle de tablas y relaciones, ver `docs/DATABASE.md`.
