---
title: API Interna
description: Endpoints internos del panel admin y servicios públicos usados por templates.
---

## Alcance

Este repositorio **no expone una API pública estable**. Los endpoints se implementan como Route Handlers de Next.js dentro de `apps/admin/src/app/api`. Se usan para:

- Formularios públicos de los templates.
- Operaciones internas del panel admin.

## Endpoints usados por templates

| Ruta | Archivo | Uso |
|---|---|---|
| `/api/reservas` | `apps/admin/src/app/api/reservas/route.ts` | Reservas de restaurantes. |
| `/api/citas` | `apps/admin/src/app/api/citas/route.ts` | Citas para salon/clinic. |
| `/api/presupuestos` | `apps/admin/src/app/api/presupuestos/route.ts` | Solicitudes de presupuesto (repairs). |
| `/api/entrenamientos` | `apps/admin/src/app/api/entrenamientos/route.ts` | Solicitudes relacionadas con entrenamientos (gym). |
| `/api/contacto` | `apps/admin/src/app/api/contacto/route.ts` | Formulario de contacto (store). |

Notas:

- `/api/reservas` implementa validación estricta de payload, allowlist de CORS y rate limiting (ver `docs/security/public-api-verification.md`).
- Los templates apuntan a estos endpoints mediante `PUBLIC_ADMIN_URL` o webhooks alternativos.

## Endpoints internos del admin

| Ruta | Archivo | Uso |
|---|---|---|
| `/api/servicios` | `apps/admin/src/app/api/servicios/route.ts` | Gestión de servicios. |
| `/api/profesionales` | `apps/admin/src/app/api/profesionales/route.ts` | Gestión de profesionales/equipo. |
| `/api/trainer-services` | `apps/admin/src/app/api/trainer-services/route.ts` | Servicios de entrenador (fitness). |
| `/api/sessions` | `apps/admin/src/app/api/sessions/route.ts` | Sesiones (fitness). |
| `/api/progress/[customerId]` | `apps/admin/src/app/api/progress/[customerId]/route.ts` | Progreso por cliente. |
| `/api/records/[customerId]` | `apps/admin/src/app/api/records/[customerId]/route.ts` | Records por cliente. |
| `/api/configuracion` | `apps/admin/src/app/api/configuracion/route.ts` | Configuración del negocio. |
| `/api/personalizacion` | `apps/admin/src/app/api/personalizacion/route.ts` | Personalización del website. |
| `/api/calendario/bookings` | `apps/admin/src/app/api/calendario/bookings/route.ts` | Calendario de bookings. |
| `/api/calendario/reservas` | `apps/admin/src/app/api/calendario/reservas/route.ts` | Calendario de reservas. |
| `/api/calendario/horarios` | `apps/admin/src/app/api/calendario/horarios/route.ts` | Gestión de horarios. |
| `/api/calendario/especiales` | `apps/admin/src/app/api/calendario/especiales/route.ts` | Días especiales. |
| `/api/newsletter/send` | `apps/admin/src/app/api/newsletter/send/route.ts` | Envío de newsletters. |
| `/api/newsletter/templates` | `apps/admin/src/app/api/newsletter/templates/route.ts` | Templates de newsletter. |
| `/api/newsletter/generate` | `apps/admin/src/app/api/newsletter/generate/route.ts` | Generación de contenido de newsletter. |
| `/api/newsletter/automation` | `apps/admin/src/app/api/newsletter/automation/route.ts` | Automatización de newsletters. |

Para detalles de payloads y respuestas, revisa cada `route.ts`.
