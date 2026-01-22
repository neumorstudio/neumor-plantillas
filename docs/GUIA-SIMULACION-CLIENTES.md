# Guía de Simulación y Testing de Clientes

## NeumorStudio Platform Engineering Guide

**Versión:** 1.0
**Fecha:** Enero 2026
**Audiencia:** Developers, QA, Product Team

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura General](#arquitectura-general)
3. [Flujo de Creación de Cliente](#flujo-de-creación-de-cliente)
4. [Resolución de Cliente en Runtime](#resolución-de-cliente-en-runtime)
5. [Guía de Simulación Paso a Paso](#guía-de-simulación-paso-a-paso)
6. [Checklists de Testing](#checklists-de-testing)
7. [Errores Comunes y Troubleshooting](#errores-comunes-y-troubleshooting)

---

## Resumen Ejecutivo

### ¿Qué es NeumorStudio?

NeumorStudio es una plataforma SaaS multi-tenant que permite a negocios (restaurantes, peluquerías, gimnasios, etc.) tener su propia web con reservas/leads y un panel de administración.

### Componentes Principales

| Componente | Tecnología | Propósito |
|------------|------------|-----------|
| **CLI** | Node.js + TypeScript | Provisioning de clientes |
| **Admin Panel** | Next.js 15 + React 19 | Panel multi-tenant compartido |
| **Web Templates** | Astro 5 + SSR (Vercel) | Webs públicas dinámicas por vertical |
| **Base de datos** | Supabase (PostgreSQL + RLS) | Datos centralizados con aislamiento |
| **Auth** | Supabase Auth | Usuarios separados por cliente |
| **Hosting** | Vercel (múltiples projects) | Admin + 6 verticales |
| **Automatización** | n8n | Webhooks de notificaciones |

### Verticales Soportadas

| Vertical | Proyecto Vercel | Template |
|----------|-----------------|----------|
| Restaurant | `web-restaurants` | `apps/templates/restaurant/` |
| Salon (Peluquería) | `web-peluquerias` | `apps/templates/salon/` |
| Repairs (Reformas) | `web-reformas` | `apps/templates/repairs/` |
| Clinic | `web-clinics` | `apps/templates/clinic/` |
| Gym | `web-gyms` | `apps/templates/gym/` |
| Store | `web-stores` | `apps/templates/store/` |

---

## Arquitectura General

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO FINAL                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              cliente.neumorstudio.com (Subdominio)               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL (Routing por dominio)                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │web-restaur │ │web-peluqu  │ │web-clinics │ │web-gyms    │   │
│  │ants       │ │erias       │ │            │ │            │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ASTRO SSR (Templates)                         │
│   1. Lee PUBLIC_WEBSITE_ID de .env (si existe)                  │
│   2. O busca por hostname en tabla websites                     │
│   3. Carga config (tema, textos, variantes)                     │
│   4. Renderiza HTML dinámico                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ clients  │──│ websites │──│ bookings │  │ leads        │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
│        │                │                                        │
│        │                └── RLS: website_id = user's website    │
│        │                                                        │
│        └── auth_user_id ──► Supabase Auth                       │
└─────────────────────────────────────────────────────────────────┘
```

### Multi-tenancy

**¿Qué es multi-tenant?**
- El **Admin Panel** es una única aplicación que sirve a TODOS los clientes
- Cada cliente ve SOLO sus datos gracias a RLS (Row Level Security)

**¿Qué está aislado por cliente?**
- Datos en Supabase (clients, websites, bookings, leads, etc.)
- Configuración visual (tema, textos, variantes)
- Subdominio propio

**¿Qué se comparte?**
- Código del Admin Panel (Next.js)
- Código de los Templates (Astro) - 1 por vertical
- Infraestructura Vercel
- Webhooks n8n (filtrado por website_id)

### Relación entre Entidades

```
┌──────────────┐     1:1      ┌──────────────┐
│   clients    │─────────────►│  websites    │
│              │              │              │
│ id (UUID)    │              │ id (UUID)    │
│ email        │              │ client_id    │
│ business_name│              │ domain       │
│ business_type│              │ theme        │
│ auth_user_id │              │ config (JSON)│
└──────────────┘              └──────────────┘
                                     │
                                     │ 1:N
                    ┌────────────────┼────────────────┐
                    ▼                ▼                ▼
             ┌──────────┐     ┌──────────┐     ┌─────────────┐
             │ bookings │     │  leads   │     │notification_│
             │          │     │          │     │settings     │
             └──────────┘     └──────────┘     └─────────────┘
```

---

## Flujo de Creación de Cliente

### ¿Qué hace exactamente el CLI?

El CLI (`pnpm create-client`) ejecuta los siguientes pasos:

#### Paso 1: Recolección de Datos (Interactivo)

```
Input requerido:
├── Nombre del negocio (obligatorio)
├── Email del cliente (único, validado)
├── Tipo de negocio (restaurant|salon|repairs|clinic|gym|store)
├── Teléfono (opcional)
├── Dirección (obligatorio)
├── Subdominio (3-30 chars, único)
├── Tema visual (light|dark|colorful|rustic|elegant|neuglass|neuglass-dark)
├── Preset de diseño (casual|fine-dining|fast-food|cafe-bistro)
└── Textos del hero (auto-generados o personalizados)
```

#### Paso 2: Operaciones en Supabase

```sql
-- 1. Crear cliente
INSERT INTO clients (email, business_name, business_type, phone)
VALUES (:email, :businessName, :businessType, :phone)
RETURNING id;

-- 2. Crear website
INSERT INTO websites (client_id, domain, theme, config)
VALUES (:clientId, ':subdomain.neumorstudio.com', :theme, :configJson)
RETURNING id;

-- 3. Crear notification_settings
INSERT INTO notification_settings (website_id, email_booking_confirmation, email_new_lead)
VALUES (:websiteId, true, true);

-- 4. Crear usuario en Supabase Auth
-- Via supabase.auth.admin.createUser()
-- Con user_metadata: { client_id, business_name, must_change_password: true }

-- 5. Vincular auth_user_id
UPDATE clients SET auth_user_id = :authUserId WHERE id = :clientId;
```

#### Paso 3: Asignación en Vercel

```
POST https://api.vercel.com/v10/projects/{projectName}/domains
Body: { "name": "subdomain.neumorstudio.com" }

Resultado:
├── success + verified → Dominio listo
├── success + !verified → Requiere verificación DNS
└── error → Ver troubleshooting
```

#### Paso 4: Generación de Credenciales

```
Output:
├── Client ID: uuid
├── Website ID: uuid (PUBLIC_WEBSITE_ID)
├── Domain: subdomain.neumorstudio.com
├── Temp Password: 12 chars aleatorios
└── Vercel Status: Assigned/Pending/Failed
```

### Qué NO hace el CLI automáticamente

| Acción | Motivo |
|--------|--------|
| Crear contenido (menú, imágenes) | Requiere input del cliente |
| Configurar webhooks personalizados | Usa URL global de n8n |
| Personalización avanzada de CSS | El tema se configura en admin |
| Conectar redes sociales | OAuth requiere interacción del usuario |
| Configurar Stripe | Requiere account de Stripe del cliente |

---

## Resolución de Cliente en Runtime

### Web Pública (Templates Astro)

```typescript
// apps/templates/restaurant/src/pages/index.astro

// 1. Intentar por PUBLIC_WEBSITE_ID (si está en .env)
const websiteId = import.meta.env.PUBLIC_WEBSITE_ID;

// 2. O por hostname (para subdominios compartidos)
const url = new URL(Astro.request.url);
const hostname = url.hostname; // "cliente.neumorstudio.com"

// 3. Buscar en Supabase
const website = await getWebsiteConfig(websiteId, hostname);
// Si websiteId existe, busca por ID
// Si no, busca WHERE domain = hostname

// 4. Cargar datos dinámicos
const menuItems = await getMenuItems(website.id);
const theme = website.theme; // "neuglass"
const config = website.config; // JSON con textos, variantes, etc.
```

### Admin Panel (Next.js)

```typescript
// apps/admin/src/lib/data.ts

async function getUserContext() {
  const supabase = await createClient();

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Buscar su cliente y website
  const { data } = await supabase
    .from("clients")
    .select("id, websites(id)")
    .eq("auth_user_id", user.id)
    .single();

  return {
    clientId: data.id,
    websiteId: data.websites[0].id
  };
}

// Todas las queries filtran por websiteId
export async function getBookings() {
  const websiteId = await getWebsiteId();
  return supabase
    .from("bookings")
    .select("*")
    .eq("website_id", websiteId); // ← Aislamiento
}
```

### Diferencias Admin vs Web Pública

| Aspecto | Web Pública | Admin Panel |
|---------|-------------|-------------|
| Identificación | Por dominio o env var | Por auth session |
| Autenticación | Ninguna | Supabase Auth |
| Permisos | Solo lectura (anon key) | RLS por usuario |
| Datos accesibles | Config pública, menú | Todo (bookings, leads, etc.) |

---

## Guía de Simulación Paso a Paso

### Prerrequisitos

#### Variables de Entorno

```bash
# .env en raíz del proyecto (neumor-plantillas/)

# Supabase (OBLIGATORIO)
SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Vercel API (RECOMENDADO)
VERCEL_TOKEN=xxx
VERCEL_TEAM_ID=team_xxx  # Solo si usas team

# Webhooks n8n (OPCIONAL para testing)
PUBLIC_RESERVATION_WEBHOOK_URL=https://n8n.neumorstudio.com/webhook/reservas
PUBLIC_CONTACT_WEBHOOK_URL=https://n8n.neumorstudio.com/webhook/lead
```

#### Accesos Mínimos

- [ ] Acceso al repo `neumorstudio/neumor-plantillas`
- [ ] Credenciales de Supabase (Dashboard o service role key)
- [ ] Token de Vercel (para asignar dominios)
- [ ] Node.js 20+ y pnpm instalados

#### Entorno Recomendado

| Tipo de Test | Entorno |
|--------------|---------|
| Dev/Testing | Local con Supabase de desarrollo |
| Staging | Supabase staging + Vercel preview |
| Producción | Solo con supervisión |

### Simulación de Creación de Cliente

#### Comando

```bash
cd neumor-plantillas
pnpm create-client
```

#### Flags Opcionales

```bash
# Forzar vertical específica
pnpm create-client --vertical=restaurant

# Verificar URL después de crear
pnpm create-client --check-url
```

#### Ejemplo de Ejecución Completa

```
╭──────────────────────────────────────────────────────╮
│      NeumorStudio CLI para Creación de Clientes      │
╰──────────────────────────────────────────────────────╯

  ✓ Conectado a Supabase

[1/4] Información del Negocio
──────────────────────────────────────────────────────
   Nombre del negocio: Test Restaurante Demo
   Email del cliente: test-demo@example.com
   Tipo de negocio: 🍽️ Restaurante
   Teléfono: +34 600 000 000
   Dirección: Calle Falsa 123, Madrid

[2/4] Configuración de la Web
──────────────────────────────────────────────────────
   Subdominio: test-demo.neumorstudio.com
   Tema visual: 💎 NeuGlass (Premium)
   Estilo de diseño: 🍽️ Casual

[3/4] Contenido de la Web
──────────────────────────────────────────────────────
   Textos generados automáticamente:
   "Bienvenido a Test Restaurante Demo"

   ¿Personalizar textos del banner? No

[4/4] Confirmación
──────────────────────────────────────────────────────
╭──────────────────┬────────────────────────────────────╮
│ Negocio          │ Test Restaurante Demo              │
│ Email            │ test-demo@example.com              │
│ Tipo             │ restaurant                         │
│ Vertical         │ Restaurantes                       │
│ Dominio          │ test-demo.neumorstudio.com         │
│ Vercel Project   │ web-restaurants                    │
│ Tema             │ neuglass                           │
│ Preset           │ casual                             │
╰──────────────────┴────────────────────────────────────╯

   ¿Crear este cliente? Sí

✔ Cliente creado correctamente
✔ Dominio asignado y verificado en web-restaurants

╭──────────────────────────────────────────────────────╮
│         ✓ CLIENTE CREADO EXITOSAMENTE                │
╰──────────────────────────────────────────────────────╯

╭──────────────────┬────────────────────────────────────────────╮
│ Client ID        │ a1b2c3d4-e5f6-7890-abcd-ef1234567890       │
│ Website ID       │ f0e1d2c3-b4a5-6789-0fed-cba987654321       │
│ Domain           │ test-demo.neumorstudio.com                 │
│ Vercel Status    │ ✓ Assigned & Verified                      │
╰──────────────────┴────────────────────────────────────────────╯

╔════════════════════════════════════════════════════════════════╗
║                    🔐 ACCESO ADMIN                             ║
╠════════════════════════════════════════════════════════════════╣
║ URL:        https://admin.neumorstudio.com                     ║
║ Email:      test-demo@example.com                              ║
║ Contraseña: Ab3dEf7hJk2m                                       ║
║                                                                ║
║ ⚠ GUARDA ESTA CONTRASEÑA - No se puede recuperar               ║
╚════════════════════════════════════════════════════════════════╝
```

#### Outputs Esperados

| Output | Valor Ejemplo |
|--------|---------------|
| Client ID | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| Website ID | `f0e1d2c3-b4a5-6789-0fed-cba987654321` |
| Domain | `test-demo.neumorstudio.com` |
| Temp Password | `Ab3dEf7hJk2m` (12 chars) |

#### Errores Comunes en CLI

| Error | Causa | Solución |
|-------|-------|----------|
| `Email ya registrado` | Email duplicado | Usar otro email |
| `Dominio ya en uso` | Subdominio existe | Elegir otro subdominio |
| `SUPABASE_SERVICE_ROLE_KEY not configured` | Falta env var | Configurar .env |
| `Invalid VERCEL_TOKEN` | Token expirado/inválido | Regenerar token |
| `Domain already assigned` | Dominio en otro proyecto Vercel | Verificar en Vercel dashboard |

### Verificación en Supabase

#### Queries SQL de Solo Lectura

```sql
-- 1. Verificar cliente creado
SELECT id, email, business_name, business_type, auth_user_id, created_at
FROM clients
WHERE email = 'test-demo@example.com';

-- Resultado esperado:
-- id: uuid, email: test-demo@example.com, business_name: Test Restaurante Demo
-- business_type: restaurant, auth_user_id: uuid (no null), created_at: timestamp

-- 2. Verificar website creado
SELECT w.id, w.client_id, w.domain, w.theme, w.config->>'preset' as preset
FROM websites w
JOIN clients c ON w.client_id = c.id
WHERE c.email = 'test-demo@example.com';

-- Resultado esperado:
-- id: uuid, domain: test-demo.neumorstudio.com, theme: neuglass, preset: casual

-- 3. Verificar notification_settings
SELECT ns.id, ns.email_booking_confirmation, ns.email_new_lead
FROM notification_settings ns
JOIN websites w ON ns.website_id = w.id
JOIN clients c ON w.client_id = c.id
WHERE c.email = 'test-demo@example.com';

-- Resultado esperado: email_booking_confirmation: true, email_new_lead: true

-- 4. Verificar NO hay duplicados
SELECT email, COUNT(*)
FROM clients
GROUP BY email
HAVING COUNT(*) > 1;

-- Resultado esperado: 0 filas (sin duplicados)

-- 5. Verificar usuario en Auth
SELECT id, email, raw_user_meta_data
FROM auth.users
WHERE email = 'test-demo@example.com';

-- Resultado esperado: metadata con client_id y must_change_password: true
```

#### Qué NO Debería Existir

- [ ] Clientes con email duplicado
- [ ] Websites sin client_id
- [ ] Dominios duplicados
- [ ] auth_user_id = NULL después de creación exitosa

### Verificación de la Web Pública

#### Acceso al Subdominio

```bash
# Verificar que responde
curl -I https://test-demo.neumorstudio.com

# Resultado esperado:
# HTTP/2 200
# content-type: text/html
```

#### Qué Debería Verse

- [ ] Página carga sin errores
- [ ] Tema visual correcto (neuglass en este ejemplo)
- [ ] Nombre del negocio en header/hero
- [ ] Textos del hero correctos
- [ ] Formulario de reservas visible
- [ ] Footer con información de contacto

#### Errores que Indican Fallo de Provisioning

| Error Visual | Causa Probable |
|--------------|----------------|
| 404 NOT FOUND | Dominio no asignado a Vercel |
| Página en blanco | Error de SSR, revisar logs |
| "Supabase no configurado" | Faltan env vars en Vercel project |
| Datos genéricos | Website no encontrado por dominio |
| Error de CORS | Dominio no en allowed origins |

### Verificación del Admin Panel

#### Login

1. Ir a `https://admin.neumorstudio.com`
2. Ingresar email: `test-demo@example.com`
3. Ingresar contraseña temporal
4. **Primer login**: Forzará cambio de contraseña

#### Verificar Acceso Correcto

- [ ] Dashboard muestra nombre del negocio correcto
- [ ] Sidebar muestra tipo de negocio (icono)
- [ ] Estadísticas en 0 (cliente nuevo)
- [ ] Sección de reservas vacía
- [ ] Sección de leads vacía
- [ ] Configuración muestra datos correctos

#### Verificar Aislamiento Multi-tenant

- [ ] NO se ven datos de otros clientes
- [ ] NO se puede acceder a /api/... de otro website_id
- [ ] Logout y login con otro usuario muestra datos diferentes

### Verificación Funcional por Nicho

#### Restaurant

| Funcionalidad | Cómo Probar | Resultado Esperado |
|---------------|-------------|-------------------|
| Reserva desde web | Llenar formulario en web pública | Aparece en admin/reservas |
| Cambiar estado reserva | Click en "Confirmar" en admin | Estado cambia a "confirmed" |
| Ver menú | Navegar a sección menú en web | Items del menú visibles |
| Pedido online | Agregar items y checkout | (Si Stripe configurado) |

#### Salon (Peluquería)

| Funcionalidad | Cómo Probar | Resultado Esperado |
|---------------|-------------|-------------------|
| Cita desde web | Llenar formulario de cita | Aparece en admin/reservas |
| Servicios | Ver lista de servicios en web | Servicios con precios |
| Confirmación | Cambiar estado a confirmado | Email/WhatsApp (si configurado) |

#### Repairs (Reformas)

| Funcionalidad | Cómo Probar | Resultado Esperado |
|---------------|-------------|-------------------|
| Solicitar presupuesto | Llenar formulario de contacto | Aparece en admin/leads |
| Lead con detalles | Verificar campos en admin | Tipo de trabajo, descripción |
| Cambiar estado lead | Marcar como "contacted" | Estado actualizado |

---

## Checklists de Testing

### Checklist Rápida (10 minutos)

**Antes de demo o deploy rápido:**

| # | Acción | Esperado | ✓ |
|---|--------|----------|---|
| 1 | `pnpm create-client` con datos de prueba | Sin errores | ☐ |
| 2 | `curl -I https://SUBDOMINIO.neumorstudio.com` | HTTP 200 | ☐ |
| 3 | Abrir web en navegador | Página carga, tema correcto | ☐ |
| 4 | Login en admin | Acceso exitoso | ☐ |
| 5 | Dashboard muestra nombre correcto | Datos del cliente | ☐ |
| 6 | Enviar reserva desde web pública | Aparece en admin | ☐ |

**Si falla:**
- #1: Ver sección Troubleshooting CLI
- #2-3: Verificar Vercel domain assignment
- #4-5: Verificar Supabase Auth user
- #6: Verificar webhook URL o RLS policies

### Checklist Completa (QA)

**Para release o nuevo cliente real:**

#### A. Provisioning

| # | Acción | Esperado | ✓ |
|---|--------|----------|---|
| A1 | Crear cliente con CLI | Success message | ☐ |
| A2 | Verificar client en Supabase | Registro existe | ☐ |
| A3 | Verificar website en Supabase | domain correcto | ☐ |
| A4 | Verificar auth user | metadata correcta | ☐ |
| A5 | Verificar domain en Vercel | Assigned + Verified | ☐ |

#### B. Web Pública

| # | Acción | Esperado | ✓ |
|---|--------|----------|---|
| B1 | Acceder a subdominio | HTTP 200, sin errores | ☐ |
| B2 | Verificar tema visual | Coincide con selección | ☐ |
| B3 | Verificar textos hero | Personalizados o auto | ☐ |
| B4 | Formulario reserva visible | Campos completos | ☐ |
| B5 | Enviar reserva válida | Confirmación visual | ☐ |
| B6 | Enviar reserva inválida | Error de validación | ☐ |
| B7 | Verificar footer | Datos de contacto | ☐ |
| B8 | Verificar responsive | Mobile, tablet, desktop | ☐ |

#### C. Admin Panel

| # | Acción | Esperado | ✓ |
|---|--------|----------|---|
| C1 | Login con credenciales | Acceso exitoso | ☐ |
| C2 | Cambio de contraseña (1er login) | Forzado, funciona | ☐ |
| C3 | Dashboard stats | Números correctos | ☐ |
| C4 | Ver reservas | Lista con datos | ☐ |
| C5 | Cambiar estado reserva | Actualiza correctamente | ☐ |
| C6 | Ver leads | Lista con datos | ☐ |
| C7 | Cambiar estado lead | Actualiza correctamente | ☐ |
| C8 | Configuración | Muestra datos del cliente | ☐ |
| C9 | Personalización | Cambia tema, se refleja en web | ☐ |
| C10 | Logout | Sesión terminada | ☐ |

#### D. Seguridad / Aislamiento

| # | Acción | Esperado | ✓ |
|---|--------|----------|---|
| D1 | Login con otro cliente | Solo ve sus datos | ☐ |
| D2 | Intentar acceder a API de otro | 403 Forbidden | ☐ |
| D3 | SQL injection en formularios | Sanitizado | ☐ |
| D4 | XSS en campos de texto | Escapado | ☐ |

### Checklist de Regresión (Pre-Release)

**Antes de cada release a producción:**

| # | Área | Test | ✓ |
|---|------|------|---|
| R1 | CLI | Crear cliente nuevo | ☐ |
| R2 | CLI | Validación de email duplicado | ☐ |
| R3 | CLI | Validación de subdominio | ☐ |
| R4 | Web | Cada vertical carga correctamente | ☐ |
| R5 | Web | Reservas funcionan (restaurant) | ☐ |
| R6 | Web | Leads funcionan (repairs) | ☐ |
| R7 | Admin | Login/logout | ☐ |
| R8 | Admin | CRUD reservas | ☐ |
| R9 | Admin | CRUD leads | ☐ |
| R10 | Admin | Cambio de tema persiste | ☐ |
| R11 | Vercel | Todos los projects healthy | ☐ |
| R12 | Supabase | Migraciones aplicadas | ☐ |

---

## Errores Comunes y Troubleshooting

### Errores del CLI

#### `SUPABASE_URL/SERVICE_ROLE_KEY not configured`

**Causa:** Variables de entorno no cargadas.

**Solución:**
```bash
# Verificar que existe .env en la raíz
cat .env | grep SUPABASE

# Si no existe, crear desde example
cp .env.example .env
# Editar con valores reales
```

#### `El email "X" ya está registrado`

**Causa:** Intento de crear cliente con email existente.

**Solución:**
- Usar un email diferente
- O eliminar el cliente existente (solo en desarrollo):
```sql
-- CUIDADO: Solo en desarrollo
DELETE FROM clients WHERE email = 'email@ejemplo.com';
```

#### `El dominio "X.neumorstudio.com" ya está en uso`

**Causa:** Subdominio ya asignado a otro cliente.

**Solución:**
- Elegir otro subdominio
- Verificar en Supabase:
```sql
SELECT * FROM websites WHERE domain LIKE '%subdominio%';
```

#### `Invalid VERCEL_TOKEN or insufficient permissions`

**Causa:** Token de Vercel inválido o sin permisos.

**Solución:**
1. Ir a https://vercel.com/account/tokens
2. Crear nuevo token con scope completo
3. Actualizar VERCEL_TOKEN en .env

### Problemas de Subdominio

#### 404 NOT FOUND en subdominio

**Causas posibles:**

1. **Dominio no asignado a Vercel**
   ```bash
   # Verificar en Vercel CLI
   vercel domains ls --scope neumorstudios-projects
   ```
   **Solución:** Asignar manualmente o re-ejecutar CLI

2. **Cache de Turborepo con build antiguo**
   ```bash
   # Forzar rebuild
   git commit --allow-empty -m "chore: trigger rebuild"
   git push
   ```

3. **Proyecto Vercel incorrecto**
   - Verificar que el dominio está en el proyecto correcto (web-restaurants, web-clinics, etc.)

#### Dominio pendiente de verificación DNS

**Síntoma:** CLI muestra "Needs DNS Verification"

**Solución:**
1. El wildcard DNS ya está configurado en neumorstudio.com
2. Ejecutar verificación manual:
   ```bash
   curl -X POST "https://api.vercel.com/v9/projects/PROJECT/domains/DOMAIN/verify" \
     -H "Authorization: Bearer $VERCEL_TOKEN"
   ```

### Problemas de Vercel

#### `domain_already_in_use`

**Causa:** El dominio está asignado a otro proyecto.

**Solución:**
1. Identificar proyecto actual:
   ```bash
   curl -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v6/domains/DOMINIO?teamId=$VERCEL_TEAM_ID"
   ```
2. Eliminar del proyecto incorrecto
3. Asignar al correcto

#### Build fails en Vercel

**Síntoma:** Deploy status ERROR

**Diagnóstico:**
1. Ver logs en Vercel Dashboard → Project → Deployments → Logs
2. Errores comunes:
   - `pnpm install failed` → Dependencias rotas
   - `Type error` → Revisar TypeScript
   - `Build timeout` → Optimizar build

### Problemas de Permisos (RLS)

#### Usuario no ve sus datos

**Síntoma:** Dashboard vacío, queries devuelven []

**Diagnóstico:**
```sql
-- Verificar vinculación auth_user_id
SELECT c.id, c.auth_user_id, u.id as auth_id
FROM clients c
LEFT JOIN auth.users u ON c.auth_user_id = u.id
WHERE c.email = 'email@ejemplo.com';

-- auth_user_id debe = auth.users.id
```

**Solución si auth_user_id es NULL:**
```sql
-- Vincular manualmente
UPDATE clients
SET auth_user_id = (SELECT id FROM auth.users WHERE email = 'email@ejemplo.com')
WHERE email = 'email@ejemplo.com';
```

#### Error 403 en API

**Causa:** RLS bloqueando acceso.

**Diagnóstico:**
```sql
-- Verificar políticas activas
SELECT * FROM pg_policies WHERE tablename = 'bookings';

-- Test como usuario específico
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_UUID"}';
SELECT * FROM bookings; -- Debería filtrar por website_id
```

### Tabla de Diagnóstico Rápido

| Síntoma | Primera Acción | Segunda Acción |
|---------|----------------|----------------|
| CLI falla al inicio | Verificar .env | Verificar node_modules |
| 404 en subdominio | Verificar Vercel domains | Forzar redeploy |
| Login no funciona | Verificar auth user existe | Verificar must_change_password |
| Dashboard vacío | Verificar auth_user_id vinculado | Verificar RLS policies |
| Reserva no aparece | Verificar webhook URL | Verificar website_id en POST |
| Tema no cambia | Limpiar cache navegador | Verificar UPDATE en websites |

---

## Apéndice: Comandos Útiles

### CLI

```bash
# Crear cliente
pnpm create-client

# Con vertical específica
pnpm create-client --vertical=salon

# Verificar URL después
pnpm create-client --check-url
```

### Supabase

```bash
# Conectar a Supabase CLI
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF

# Ver migraciones pendientes
npx supabase migration list

# Aplicar migraciones
npx supabase db push
```

### Vercel

```bash
# Listar dominios
vercel domains ls --scope neumorstudios-projects

# Agregar dominio manualmente
vercel domains add DOMINIO --scope PROJECT_NAME

# Ver deployments
vercel ls --scope neumorstudios-projects
```

### Git

```bash
# Ver estado
git status

# Forzar redeploy (commit vacío)
git commit --allow-empty -m "chore: trigger redeploy"
git push
```

---

## Contacto y Soporte

- **Issues técnicos:** Crear issue en GitHub
- **Documentación:** Este documento en `/docs/GUIA-SIMULACION-CLIENTES.md`
- **Equipo:** @neumorstudio

---

*Documento generado por Claude como Lead Platform Engineer - Enero 2026*
