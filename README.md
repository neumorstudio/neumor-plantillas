# NeumorStudio - Plantillas Multi-tenant SaaS

> Plataforma SaaS multi-tenant para crear sitios web de negocios con panel de administración, reservas, pedidos online y automatizaciones.

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEUMOR PLANTILLAS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         apps/                                        │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  ┌──────────────┐    ┌─────────────────────────────────────────┐   │    │
│  │  │    admin     │    │              templates/                  │   │    │
│  │  │              │    │                                          │   │    │
│  │  │  Next.js 15  │    │  ┌────────────┐  ┌────────────┐         │   │    │
│  │  │  Dashboard   │    │  │ restaurant │  │   salon    │         │   │    │
│  │  │  multi-tenant│    │  └────────────┘  └────────────┘         │   │    │
│  │  │              │    │  ┌────────────┐  ┌────────────┐         │   │    │
│  │  │  Vercel      │    │  │   clinic   │  │    gym     │         │   │    │
│  │  └──────────────┘    │  └────────────┘  └────────────┘         │   │    │
│  │                      │  ┌────────────┐  ┌────────────┐         │   │    │
│  │                      │  │   store    │  │  repairs   │         │   │    │
│  │                      │  └────────────┘  └────────────┘         │   │    │
│  │                      │                                          │   │    │
│  │                      │  Astro 5 SSR (Vercel adapter)           │   │    │
│  │                      └─────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        packages/                                     │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │     cli      │  │   supabase   │  │  api-utils   │              │    │
│  │  │ create-client│  │  migrations  │  │ CORS/limits  │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │    config    │  │    logger    │  │ n8n-templates│              │    │
│  │  │ tailwind/ts  │  │ shared logs  │  │ automations  │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| Monorepo | Turborepo + pnpm |
| Admin Panel | Next.js 15 (App Router) |
| Templates | Astro 5 SSR |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Hosting | Vercel |
| Payments | Stripe |
| Automations | n8n |

## Estructura del Proyecto

```
neumor-plantillas/
├── apps/
│   ├── admin/                    # Panel de administración (Next.js)
│   └── templates/
│       ├── restaurant/           # Template restaurantes
│       ├── salon/                # Template peluquerías
│       ├── clinic/               # Template clínicas
│       ├── gym/                  # Template gimnasios
│       ├── store/                # Template tiendas
│       ├── repairs/              # Template reparaciones
│       └── unified/              # Template unificada (uso interno)
├── packages/
│   ├── api-utils/                # CORS, rate-limit, validation
│   ├── cli/                      # CLI para crear clientes
│   ├── config/                   # Config compartida (eslint, tailwind, ts)
│   ├── logger/                   # Logger compartido
│   ├── n8n-templates/            # Workflows de automatización
│   └── supabase/                 # Migraciones y tipos
├── supabase/                     # Migraciones locales (Supabase CLI)
└── docs/                         # Documentación
```

## Quick Start

### Prerrequisitos

- Node.js 20+
- pnpm 10+
- Acceso a Supabase
- (Opcional) Vercel CLI

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/neumorstudio/neumor-plantillas.git
cd neumor-plantillas

# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales
```

### Variables de Entorno

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Vercel (para CLI)
VERCEL_TOKEN=xxx
VERCEL_TEAM_ID=team_xxx

# Stripe (para pedidos)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Desarrollo

```bash
# Todos los apps
pnpm dev

# Solo admin
pnpm dev:admin

# Solo template específico
pnpm dev:restaurant
pnpm dev:salon
pnpm dev:clinic
pnpm dev:gym
pnpm dev:store
```

### Crear un Cliente

```bash
# CLI interactivo
pnpm create-client

# Con parámetros
pnpm create-client -- --vertical=restaurant
```

Ver [Guía de Simulación de Clientes](docs/GUIA-SIMULACION-CLIENTES.md) para detalles completos.

## Documentación

| Documento | Descripción |
|-----------|-------------|
| [DATABASE.md](docs/DATABASE.md) | Esquema completo de base de datos, tablas, RLS, triggers |
| [GUIA-SIMULACION-CLIENTES.md](docs/GUIA-SIMULACION-CLIENTES.md) | Guía de testing y simulación end-to-end |
| [security/SECURITY_CHANGELOG.md](docs/security/SECURITY_CHANGELOG.md) | Auditoría de seguridad y fixes aplicados |
| [security/public-api-verification.md](docs/security/public-api-verification.md) | Checklist de verificación de seguridad |
| [provisioning/vercel-domain-assignment.md](docs/provisioning/vercel-domain-assignment.md) | Asignación automática de dominios en Vercel |

## Arquitectura Multi-tenant

### Modelo de Datos

```
auth.users (Supabase Auth)
    │
    └── clients
            │
            └── websites
                    │
                    ├── bookings
                    ├── leads
                    ├── menu_items
                    ├── orders
                    ├── newsletter_*
                    └── social_accounts
```

### Aislamiento con RLS

- Cada tabla tiene Row Level Security (RLS) habilitado
- Los usuarios solo ven datos de su `website_id`
- El flujo: `auth.uid()` → `clients` → `websites` → datos

Ver [DATABASE.md](docs/DATABASE.md) para detalles completos.

## Apps

### Admin Panel (`apps/admin`)

Panel de administración para clientes:

- Dashboard con métricas
- Gestión de reservas
- Gestión de leads
- Configuración de notificaciones
- Personalización del sitio web

```bash
pnpm dev:admin
# http://localhost:3000
```

### Templates (`apps/templates/*`)

Sitios web públicos para cada vertical:

| Template | Puerto | Descripción |
|----------|--------|-------------|
| restaurant | 4321 | Restaurantes, cafeterías |
| salon | 4322 | Peluquerías, barberías |
| clinic | 4323 | Clínicas, consultas médicas |
| gym | 4324 | Gimnasios, centros fitness |
| store | 4325 | Tiendas, comercios |
| repairs | 4326 | Reparaciones, reformas |

Cada template incluye:
- Hero personalizable
- Sistema de reservas/citas
- Formulario de contacto
- Menú/Carta (restaurant)
- Pedidos online con Stripe (restaurant)
- Integración con Google Business

## Packages

### API Utils (`packages/api-utils`)

Utilidades compartidas para endpoints: CORS, rate limiting, validación.

### CLI (`packages/cli`)

Provisioning de nuevos clientes:

```bash
pnpm create-client
```

Crea automáticamente:
1. Registro en `clients`
2. Registro en `websites`
3. Usuario en Supabase Auth
4. Configuración de notificaciones
5. Dominio en Vercel

### Supabase (`packages/supabase`)

Migraciones y tipos de base de datos:

```
packages/supabase/
├── migrations/
│   ├── 0001_initial_schema.sql
│   ├── 0002_rls_policies.sql
│   └── ... (17 migraciones)
└── types/
    └── supabase.ts
```

### Config (`packages/config`)

Configuración compartida (ESLint, Tailwind, TypeScript).

### Logger (`packages/logger`)

Logger compartido para apps y paquetes.

### n8n Templates (`packages/n8n-templates`)

Workflows de automatización:
- Confirmación de reservas
- Notificaciones de leads
- Recordatorios 24h
- Envío de newsletters

Nota: Los componentes UI compartidos del admin viven en `apps/admin/src/components/ui` y cada template mantiene sus propios componentes en `src/components`.

## Scripts

```bash
# Desarrollo
pnpm dev              # Todos los apps
pnpm dev:admin        # Solo admin
pnpm dev:restaurant   # Solo template restaurant

# Build
pnpm build            # Build de producción
pnpm type-check       # Verificar tipos
pnpm lint             # Linting

# Utilidades
pnpm clean            # Limpiar node_modules y builds
pnpm format           # Formatear código
pnpm create-client    # CLI de provisioning
```

## Deployment

### Vercel Projects

| App | Proyecto Vercel | Dominio |
|-----|-----------------|---------|
| admin | `admin-neumorstudio` | admin.neumorstudio.com |
| restaurant | `web-restaurants` | *.neumorstudio.com |
| salon | `web-peluquerias` | *.neumorstudio.com |
| repairs | `web-reformas` | *.neumorstudio.com |

### Deploy Manual

```bash
# Build local
pnpm build

# Deploy con Vercel CLI
vercel --prod
```

### CI/CD

Push a `main` despliega automáticamente via Vercel Git integration.

## Seguridad

El proyecto ha sido auditado. Ver:
- [SECURITY_CHANGELOG.md](docs/security/SECURITY_CHANGELOG.md) - Hallazgos y fixes
- [public-api-verification.md](docs/security/public-api-verification.md) - Checklist de verificación

### Protecciones Implementadas

- RLS en todas las tablas
- CORS allowlist en APIs públicas
- Rate limiting en endpoints públicos
- Validación estricta de payloads
- No INSERT público en bookings/leads
- Newsletter RPCs restringidas a backend

## Contribuir

1. Crear rama desde `main`
2. Hacer cambios
3. Ejecutar `pnpm type-check && pnpm lint`
4. Crear Pull Request

### Commits

Usar commits descriptivos en español:
```
feat: añadir sistema de cupones
fix: corregir cálculo de total en pedidos
docs: actualizar guía de instalación
```

## Troubleshooting

### "Error: Invalid Supabase URL"

Verificar que `.env` tiene las variables correctas:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
```

### "RLS violation: new row violates row-level security"

El usuario no tiene permiso para esa operación:
1. Verificar que está autenticado
2. Verificar que el `website_id` pertenece al usuario
3. Revisar políticas RLS en [DATABASE.md](docs/DATABASE.md)

### "Turborepo cache issues"

Limpiar cache:
```bash
pnpm clean
rm -rf .turbo
pnpm install
```

### Template no carga datos del cliente

Verificar:
1. Variable `PUBLIC_WEBSITE_ID` en Vercel
2. Registro existe en tabla `websites`
3. RLS permite lectura pública de `menu_items`

Ver [GUIA-SIMULACION-CLIENTES.md](docs/GUIA-SIMULACION-CLIENTES.md) para más diagnósticos.

## Licencia

Propietario - NeumorStudio 2026
