# Diseño: Panel de Admin Dinámico por Tipo de Negocio

**Fecha**: 2026-01-22
**Estado**: Aprobado para implementación

## Resumen

El panel de administración mostrará secciones y widgets diferentes según el tipo de negocio del cliente. Esto permite una experiencia personalizada donde cada cliente ve solo las herramientas relevantes para su negocio.

## Problema

Actualmente el panel de admin es idéntico para todos los clientes, independientemente de si son un restaurante, un salón de belleza o un negocio de reformas. Esto causa:

- Secciones irrelevantes visibles (ej: Reservas para repairs)
- Falta de herramientas específicas (ej: Trabajos, Pagos para repairs)
- Dashboard genérico que no habla el idioma del cliente

## Solución

### 1. Sistema de Configuración por Tipo de Negocio

Nueva tabla `business_type_config` que define qué ve cada tipo de negocio:

```sql
CREATE TABLE business_type_config (
  business_type TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  visible_sections TEXT[] NOT NULL,
  dashboard_widgets TEXT[] NOT NULL,
  default_section TEXT DEFAULT 'dashboard',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Ejemplo de configuración:**

| business_type | label | visible_sections | dashboard_widgets |
|---------------|-------|------------------|-------------------|
| repairs | Reformas y Reparaciones | dashboard, presupuestos, trabajos, clientes, pagos, leads, configuracion | quotes_pending, quotes_accepted, jobs_active, payments_pending |
| restaurant | Restaurante | dashboard, reservas, leads, presupuestos, newsletter, clientes, personalizacion, configuracion | bookings_today, bookings_month, leads_new, bookings_pending |
| salon | Salón de Belleza | dashboard, reservas, leads, newsletter, clientes, personalizacion, configuracion | bookings_today, bookings_month, leads_new, bookings_pending |
| clinic | Clínica | dashboard, reservas, leads, newsletter, clientes, personalizacion, configuracion | bookings_today, bookings_month, leads_new, bookings_pending |
| shop | Tienda | dashboard, leads, presupuestos, newsletter, clientes, personalizacion, configuracion | orders_today, leads_new, revenue_month |
| fitness | Gimnasio | dashboard, reservas, leads, newsletter, clientes, personalizacion, configuracion | bookings_today, bookings_month, leads_new |
| realestate | Inmobiliaria | dashboard, leads, presupuestos, clientes, personalizacion, configuracion | quotes_pending, quotes_accepted, leads_new |

### 2. Nuevas Tablas de Base de Datos

#### 2.1 `customers` (Clientes unificados)

CRM básico universal para todos los tipos de negocio.

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(website_id, email)
);
```

#### 2.2 `jobs` (Trabajos - para repairs)

Gestión de trabajos/proyectos derivados de presupuestos aceptados.

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  address TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'waiting_material', 'completed', 'cancelled')),
  estimated_end_date DATE,
  actual_end_date DATE,
  notes TEXT,
  total_amount INTEGER, -- céntimos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Estados de trabajo:**
- `pending` - Pendiente de iniciar
- `in_progress` - En curso
- `waiting_material` - Esperando material
- `completed` - Finalizado
- `cancelled` - Cancelado

#### 2.3 `job_tasks` (Checklist de tareas)

Tareas/checklist dentro de un trabajo.

```sql
CREATE TABLE job_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.4 `job_photos` (Fotos de trabajos)

Fotos antes/durante/después de un trabajo.

```sql
CREATE TABLE job_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('before', 'progress', 'after')),
  description TEXT,
  taken_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2.5 `payments` (Pagos)

Gestión de cobros y pagos.

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  amount INTEGER NOT NULL, -- céntimos
  method TEXT CHECK (method IN ('cash', 'transfer', 'bizum', 'card')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Métodos de pago:**
- `cash` - Efectivo
- `transfer` - Transferencia bancaria
- `bizum` - Bizum
- `card` - Tarjeta

**Estados de pago:**
- `pending` - Pendiente
- `paid` - Pagado
- `partial` - Pago parcial

### 3. Catálogo de Secciones

| Sección | Slug | Nueva | Descripción |
|---------|------|-------|-------------|
| Dashboard | `dashboard` | No | Vista resumen con KPIs dinámicos |
| Reservas | `reservas` | No | Gestión de reservas/citas |
| Leads | `leads` | No | Contactos y consultas |
| Presupuestos | `presupuestos` | No | Solicitudes de presupuesto |
| Trabajos | `trabajos` | **Sí** | Proyectos en curso (repairs) |
| Clientes | `clientes` | **Sí** | CRM básico universal |
| Pagos | `pagos` | **Sí** | Gestión de cobros |
| Newsletter | `newsletter` | No | Campañas de email |
| Personalización | `personalizacion` | No | Temas y estilos |
| Configuración | `configuracion` | No | Ajustes generales |

### 4. Catálogo de Widgets del Dashboard

| Widget ID | Nombre | Descripción |
|-----------|--------|-------------|
| `bookings_today` | Reservas hoy | Número de reservas para hoy |
| `bookings_month` | Reservas este mes | Total de reservas del mes |
| `bookings_pending` | Reservas pendientes | Reservas sin confirmar |
| `leads_new` | Leads nuevos | Leads sin contactar |
| `quotes_pending` | Presupuestos pendientes | Nº y € total pendiente |
| `quotes_accepted` | Presupuestos aceptados | Nº y € aceptados este mes |
| `jobs_active` | Trabajos en curso | Trabajos activos |
| `payments_pending` | Cobros pendientes | € total por cobrar |
| `orders_today` | Pedidos hoy | Pedidos del día |
| `revenue_month` | Ingresos del mes | Total facturado |

### 5. Flujo de Funcionamiento

```
┌─────────────────────────────────────────────────────────────┐
│                      Usuario hace login                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         Obtener business_type del cliente (tabla clients)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│      Obtener configuración de business_type_config           │
│      - visible_sections                                      │
│      - dashboard_widgets                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Renderizar Sidebar dinámico                  │
│            (solo secciones en visible_sections)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Renderizar Dashboard dinámico                 │
│             (solo widgets en dashboard_widgets)              │
└─────────────────────────────────────────────────────────────┘
```

### 6. Ejemplo: Vista para tipo `repairs`

**Sidebar:**
- Dashboard
- Presupuestos ⭐
- Trabajos
- Clientes
- Pagos
- Leads
- Configuración

**Dashboard - KPIs:**
- Presupuestos pendientes (nº + €)
- Presupuestos aceptados este mes (nº + €)
- Trabajos en curso
- Cobros pendientes (€)

**Dashboard - Tablas:**
- Presupuestos recientes (Cliente, Tipo trabajo, Estado, Importe)
- Trabajos en curso (Dirección, Estado, Fecha estimada)

**Dashboard - Acciones rápidas:**
- ➕ Nuevo presupuesto
- ➕ Nuevo trabajo
- 📤 Enviar presupuesto

### 7. Ejemplo: Vista para tipo `restaurant`

**Sidebar:**
- Dashboard
- Reservas
- Leads
- Presupuestos
- Newsletter
- Clientes
- Personalización
- Configuración

**Dashboard - KPIs:**
- Reservas hoy
- Reservas este mes
- Leads nuevos
- Reservas pendientes

## Plan de Implementación

### Fase 1: Base de datos
1. Crear migración con nuevas tablas
2. Crear políticas RLS
3. Poblar `business_type_config` con datos iniciales
4. Actualizar tipos TypeScript

### Fase 2: Sidebar dinámico
1. Modificar `getClientData()` para incluir config del business_type
2. Modificar `Sidebar.tsx` para filtrar secciones según config
3. Añadir protección en rutas (redirect si sección no permitida)

### Fase 3: Dashboard dinámico
1. Crear componentes de widgets individuales
2. Modificar dashboard para renderizar widgets según config
3. Implementar queries para cada widget

### Fase 4: Nuevas secciones
1. Implementar `/dashboard/clientes`
2. Implementar `/dashboard/trabajos`
3. Implementar `/dashboard/pagos`

### Fase 5: Integración
1. Vincular Presupuesto → Trabajo (botón "Convertir en trabajo")
2. Vincular Trabajo → Pago
3. Unificar clientes desde bookings/leads existentes

## Consideraciones Técnicas

### Performance
- La config de business_type se carga una vez en el layout
- Se puede cachear en el cliente durante la sesión
- Los widgets del dashboard hacen queries paralelas

### Seguridad (RLS)
- Todas las nuevas tablas tendrán políticas RLS
- Los usuarios solo ven datos de su website_id
- La config de business_type es de solo lectura para usuarios

### Extensibilidad
- Añadir nuevo tipo de negocio = INSERT en business_type_config
- Añadir nueva sección = crear página + añadir a visible_sections
- Añadir nuevo widget = crear componente + añadir a dashboard_widgets

## Archivos a Crear/Modificar

**Nuevos:**
- `packages/supabase/migrations/0019_business_type_config.sql`
- `packages/supabase/migrations/0020_customers_table.sql`
- `packages/supabase/migrations/0021_jobs_tables.sql`
- `packages/supabase/migrations/0022_payments_table.sql`
- `apps/admin/src/app/dashboard/clientes/page.tsx`
- `apps/admin/src/app/dashboard/trabajos/page.tsx`
- `apps/admin/src/app/dashboard/pagos/page.tsx`
- `apps/admin/src/components/dashboard/widgets/*.tsx`

**Modificar:**
- `apps/admin/src/app/dashboard/layout.tsx`
- `apps/admin/src/app/dashboard/Sidebar.tsx`
- `apps/admin/src/app/dashboard/page.tsx`
- `apps/admin/src/lib/data.ts`
- `packages/supabase/src/types.ts`
- `packages/supabase/src/database.types.ts`
