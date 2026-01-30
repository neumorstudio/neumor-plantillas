---
title: Deployment
description: Despliegue en Vercel y configuración de entornos.
---

## Infraestructura

- **Admin**: Next.js 15 (App Router) desplegado en Vercel.
- **Templates**: Astro 5 SSR con adapter de Vercel.
- **DB/Auth**: Supabase (PostgreSQL + Auth).
- **Automatizaciones**: n8n.

## Variables de entorno

Configura las variables según el entorno:

- Root `.env` para tooling/CLI.
- `apps/admin/.env` para el panel admin.
- `apps/templates/*/.env` para cada plantilla.

Consulta [Configuration](configuration) para el detalle.

## Deploy manual

```bash
pnpm build
vercel --prod
```

## Provisioning de clientes

El CLI `pnpm create-client` automatiza:

- Creación de `clients` y `websites` en Supabase.
- Asignación de template/vertical.
- Configuración de dominio en Vercel (si hay credenciales).

La lista de proyectos Vercel por vertical está definida en `packages/cli/src/create-client.ts`:

| Vertical | Proyecto Vercel |
|---|---|
| restaurant | `web-restaurants` |
| salon | `web-peluquerias` |
| repairs | `web-reformas` |
| clinic | `web-clinics` |
| gym | `web-gyms` |
| store | `web-stores` |

El admin usa su propio proyecto (ver `README.md`).

## Dominios

Para asignación de dominios en Vercel, sigue `docs/provisioning/vercel-domain-assignment.md`.
