---
title: Getting Started
description: Instalación y primeros pasos para desarrollar en neumor-plantillas.
last_updated: 2026-01-31
---

**Actualizado (2026-01-31):** nota sobre business_type `fitness`/`shop` en BD/admin.

## Requisitos

- Node.js 20+
- pnpm 10+
- Acceso a Supabase (URL + keys)
- (Opcional) Vercel CLI para despliegues manuales

## Instalación

```bash
pnpm install
cp .env.example .env
```

Edita `.env` y completa al menos las variables de Supabase.

## Configuración por app

- **Admin**: usa `apps/admin/.env.example` como base.
- **Templates**: cada plantilla tiene su `.env.example` con variables `PUBLIC_`.

Ejemplos:

```bash
# Admin
apps/admin/.env

# Template restaurant
apps/templates/restaurant/.env
```

## Ejecutar en desarrollo

```bash
# Todo el monorepo
pnpm dev

# Solo admin
pnpm dev:admin

# Templates
pnpm dev:restaurant
pnpm dev:salon
pnpm dev:clinic
pnpm dev:gym
pnpm dev:store
```

Puertos por template (según README del repo):

| Template | Puerto |
|---|---|
| restaurant | 4321 |
| salon | 4322 |
| clinic | 4323 |
| gym | 4324 |
| store | 4325 |
| repairs | 4326 |

## Crear un cliente (provisioning)

El CLI crea registros en Supabase y configura el website:

```bash
pnpm create-client
# o
pnpm create-client -- --vertical=restaurant
```

## Notas de desarrollo local

- Las plantillas cargan configuración desde Supabase usando `PUBLIC_WEBSITE_ID` o el dominio.
- En `gym`, el portal de clientes puede resolver el website por dominio automáticamente (y usar `PUBLIC_WEBSITE_ID` solo en local).
- Para formularios públicos, configura `PUBLIC_ADMIN_URL` o el webhook correspondiente.
- En BD/admin los tipos de negocio son `fitness` (template `gym`) y `shop` (template `store`).

Siguiente paso: revisa [Architecture](architecture) para entender los componentes y flujos.
