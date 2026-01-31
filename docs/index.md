---
title: NeumorStudio
slug: /
description: SaaS multi-tenant para sitios web de negocios con panel de administración y automatizaciones.
last_updated: 2026-01-31
---

NeumorStudio es una plataforma SaaS multi-tenant para crear sitios web de negocios y administrar operaciones como reservas, leads y automatizaciones. El repositorio reúne el panel de administración, las plantillas públicas y los paquetes compartidos que permiten operar múltiples verticales con un único backend.

**Actualizado (2026-01-31):** listado de business_type y nota de template `unified`.

## Qué incluye el producto

- Panel de administración (Next.js 15) para gestionar datos del negocio por cliente.
- Plantillas públicas (Astro 5 SSR) para restaurant, salon, clinic, gym, store y repairs.
- Backend serverless con Supabase (PostgreSQL + Auth + RLS).
- Integraciones y automatizaciones (n8n).
- CLI de provisioning para crear clientes y sitios.

## Verticales soportadas

| Business type | Plantilla | Uso principal |
|---|---|---|
| restaurant | `apps/templates/restaurant` | Reservas y menú |
| salon | `apps/templates/salon` | Citas y servicios |
| clinic | `apps/templates/clinic` | Citas y tratamientos |
| fitness | `apps/templates/gym` | Entrenamientos y portal de clientes |
| shop | `apps/templates/store` | Contacto y catálogo |
| repairs | `apps/templates/repairs` | Presupuestos y trabajos |

Notas:
- La BD permite aliases `gym` y `store`, pero el admin y las configs usan `fitness` y `shop`.
- `apps/templates/unified` es el render multi-tenant (subdominios/dominios personalizados).

## Roles de usuario

- **Cliente (negocio)**: usuario autenticado en Supabase que accede al panel admin para gestionar su `website`.
- **Cliente final**: visitante del sitio público; en fitness/gym puede autenticarse en el portal de clientes.
- **Staff/Profesionales**: equipos/servicios internos del negocio gestionados desde el admin (tabla `professionals`).

## Flujo principal del sistema

1. El sitio público carga la configuración desde Supabase (`websites`) usando `PUBLIC_WEBSITE_ID` o el dominio.
2. Formularios públicos (reservas/citas/presupuestos/contacto) envían datos a endpoints del admin o a webhooks de automatización.
3. El panel admin consulta y gestiona datos filtrados por `website_id` bajo políticas RLS.
4. Automatizaciones (n8n) completan el flujo.

## Documentos clave

- `docs/DATABASE.md`: esquema completo de la base de datos y RLS.
- `docs/GUIA-SIMULACION-CLIENTES.md`: flujo de testing end-to-end.
- `docs/security/*`: auditoría y checklist de hardening.
- `docs/provisioning/*`: provisioning y dominio en Vercel.

Si eres nuevo en el repo, empieza por [Getting Started](getting-started).
