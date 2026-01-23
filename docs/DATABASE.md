# NeumorStudio - Documentacion de Base de Datos

> **Ultima actualizacion:** 23 Enero 2026
> **Motor:** PostgreSQL (Supabase)
> **Migraciones:** 27 archivos en `packages/supabase/migrations/`

## Tabla de Contenidos

1. [Arquitectura Multi-tenant](#arquitectura-multi-tenant)
2. [Diagrama de Relaciones](#diagrama-de-relaciones)
3. [Tablas Core](#tablas-core)
4. [Tablas de Negocio - Universal](#tablas-de-negocio---universal)
5. [Tablas de Restaurante](#tablas-de-restaurante)
6. [Tablas de Reparaciones/Reformas](#tablas-de-reparacionesreformas)
7. [Tablas de Fitness/Entrenador Personal](#tablas-de-fitnessentrenador-personal)
8. [Tablas de Integraciones](#tablas-de-integraciones)
9. [Tablas de Newsletter](#tablas-de-newsletter)
10. [Enums y Tipos](#enums-y-tipos)
11. [Row Level Security (RLS)](#row-level-security-rls)
12. [Funciones y Triggers](#funciones-y-triggers)
13. [Indices](#indices)
14. [Historial de Migraciones](#historial-de-migraciones)

---

## Arquitectura Multi-tenant

NeumorStudio implementa multi-tenancy a nivel de base de datos usando Row Level Security (RLS) de PostgreSQL.

### Modelo de Aislamiento

```
auth.users (Supabase Auth)
    |
    +-- clients.auth_user_id = auth.uid()
            |
            +-- websites.client_id
                    |
                    +-- bookings.website_id
                    +-- customers.website_id
                    +-- orders.website_id
                    +-- menu_items.website_id
                    +-- jobs.website_id
                    +-- payments.website_id
                    +-- trainer_services.website_id
                    +-- client_packages.website_id
                    +-- client_progress.website_id
                    +-- social_accounts.website_id
                    +-- newsletter_*.website_id
                    +-- notification_settings.website_id
```

### Flujo de Autenticacion -> Datos

1. Usuario se autentica con Supabase Auth
2. `auth.uid()` devuelve el UUID del usuario
3. RLS busca el cliente asociado via `clients.auth_user_id = auth.uid()`
4. Se obtiene el `website_id` asociado al cliente
5. Todas las queries filtran por `website_id`

---

## Diagrama de Relaciones

```
+-----------------------------------------------------------------------------------+
|                                  CORE TABLES                                       |
+-----------------------------------------------------------------------------------+
|                                                                                    |
|  +-------------+         +-------------+         +---------------------+           |
|  |   clients   | 1----1  |  websites   | 1----1  |notification_settings|           |
|  +-------------+         +-------------+         +---------------------+           |
|  | id (PK)     |         | id (PK)     |                                          |
|  | auth_user_id|         | client_id   |--+--+--+--+--+--+--+                      |
|  | business_   |         | domain      |  |  |  |  |  |  |  |                      |
|  |   name/type |         | theme       |  |  |  |  |  |  |  |                      |
|  +-------------+         | config      |  |  |  |  |  |  |  |                      |
|                          +-------------+  |  |  |  |  |  |  |                      |
|                                           |  |  |  |  |  |  |                      |
|  +--------------------+                   |  |  |  |  |  |  |                      |
|  |business_type_config|                   |  |  |  |  |  |  |                      |
|  +--------------------+                   |  |  |  |  |  |  |                      |
|  | business_type (PK) |                   |  |  |  |  |  |  |                      |
|  | visible_sections[] |                   |  |  |  |  |  |  |                      |
|  | dashboard_widgets[]|                   |  |  |  |  |  |  |                      |
|  +--------------------+                   |  |  |  |  |  |  |                      |
|                                           |  |  |  |  |  |  |                      |
+-------------------------------------------+--+--+--+--+--+--+----------------------+
|                               UNIVERSAL TABLES                                     |
+-------------------------------------------+--+--+--+--+--+--+----------------------+
|                                           |  |  |  |  |  |  |                      |
|  +-------------+  +-------------+         |  |  |  |  |  |  |                      |
|  |  customers  |  |  bookings   |<--------+  |  |  |  |  |  |                      |
|  +-------------+  +-------------+            |  |  |  |  |  |                      |
|  | id (PK)     |  | id (PK)     |            |  |  |  |  |  |                      |
|  | website_id  |  | website_id  |<-----------+  |  |  |  |  |                      |
|  | name, email |  | customer_id |----------->|  |  |  |  |  |                      |
|  | phone       |  | date, time  |            |  |  |  |  |  |                      |
|  | fitness_*   |  | service_id  |-----+      |  |  |  |  |  |                      |
|  +-------------+  | package_id  |--+  |      |  |  |  |  |  |                      |
|        ^          +-------------+  |  |      |  |  |  |  |  |                      |
|        |                           |  |      |  |  |  |  |  |                      |
+--------+---------------------------+--+------+--+--+--+--+--+----------------------+
|                            RESTAURANT TABLES   |  |  |  |  |                       |
+------------------------------------------------+--+--+--+--+-----------------------+
|                                                |  |  |  |  |                       |
|  +-------------+  +-------------+              |  |  |  |  |                       |
|  | menu_items  |  |   orders    |<-------------+  |  |  |  |                       |
|  +-------------+  +-------------+                 |  |  |  |                       |
|  | id (PK)     |  | id (PK)     |                 |  |  |  |                       |
|  | website_id  |  | website_id  |                 |  |  |  |                       |
|  | name, price |  | customer_*  |                 |  |  |  |                       |
|  | category    |  | status      |                 |  |  |  |                       |
|  +-------------+  | stripe_*    |                 |  |  |  |                       |
|        |          +------+------+                 |  |  |  |                       |
|        |                 |                        |  |  |  |                       |
|        |          +------+------+                 |  |  |  |                       |
|        +--------->| order_items |                 |  |  |  |                       |
|                   +-------------+                 |  |  |  |                       |
|                                                   |  |  |  |                       |
|  +---------------+                                |  |  |  |                       |
|  |order_settings |<-------------------------------+  |  |  |                       |
|  +---------------+                                   |  |  |                       |
|                                                      |  |  |                       |
+------------------------------------------------------+--+--+-----------------------+
|                            REPAIRS/JOBS TABLES          |  |                       |
+---------------------------------------------------------+--+----------------------+
|                                                         |  |                       |
|  +-------------+      +-------------+                   |  |                       |
|  |    jobs     |<-----+  job_tasks  |                   |  |                       |
|  +-------------+      +-------------+                   |  |                       |
|  | id (PK)     |      | id (PK)     |                   |  |                       |
|  | website_id  |<-----+ job_id      |                   |  |                       |
|  | customer_id |      | title       |                   |  |                       |
|  | status      |      | is_completed|                   |  |                       |
|  | costs       |      +-------------+                   |  |                       |
|  +------+------+                                        |  |                       |
|         |             +-------------+                   |  |                       |
|         +------------>| job_photos  |                   |  |                       |
|                       +-------------+                   |  |                       |
|                       | type (enum) |                   |  |                       |
|                       +-------------+                   |  |                       |
|                                                         |  |                       |
|  +-------------+                                        |  |                       |
|  |  payments   |<---------------------------------------+  |                       |
|  +-------------+                                           |                       |
|  | website_id  |                                           |                       |
|  | job_id      |                                           |                       |
|  | customer_id |                                           |                       |
|  | method/stat |                                           |                       |
|  +-------------+                                           |                       |
|                                                            |                       |
+------------------------------------------------------------+-----------------------+
|                            FITNESS TABLES                   |                      |
+-------------------------------------------------------------+----------------------+
|                                                             |                      |
|  +------------------+    +------------------+               |                      |
|  |trainer_services  |    | client_packages  |<--------------+                      |
|  +------------------+    +------------------+                                      |
|  | id (PK)          |    | id (PK)          |                                      |
|  | website_id       |    | website_id       |                                      |
|  | name, price      |    | customer_id      |----------> customers                 |
|  | duration_minutes |    | total_sessions   |                                      |
|  | is_online        |    | used_sessions    |                                      |
|  +------------------+    | status           |                                      |
|          |               +------------------+                                      |
|          v                                                                         |
|  bookings.service_id     +------------------+    +------------------+              |
|                          | client_progress  |    | client_records   |              |
|  bookings.package_id---->+------------------+    +------------------+              |
|                          | website_id       |    | website_id       |              |
|                          | customer_id      |    | customer_id      |              |
|                          | weight_kg, etc.  |    | exercise_name    |              |
|                          | photos (JSONB)   |    | record_value     |              |
|                          +------------------+    +------------------+              |
|                                                                                    |
+------------------------------------------------------------------------------------+
|                            INTEGRATION TABLES                                      |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  +------------------+        +---------------------------+                         |
|  | social_accounts  | 1----N | google_business_locations |                         |
|  +------------------+        +---------------------------+                         |
|  | platform         |        | social_account_id         |                         |
|  | access_token     |        | location_name             |                         |
|  +--------+---------+        +-----------+---------------+                         |
|           |                              |                                         |
|  +--------+---------+        +-----------+---------------+                         |
|  | scheduled_posts  |        |   google_reviews_cache    |                         |
|  +------------------+        +---------------------------+                         |
|                                                                                    |
+------------------------------------------------------------------------------------+
|                            NEWSLETTER TABLES                                       |
+------------------------------------------------------------------------------------+
|                                                                                    |
|  +---------------------+    +---------------------+                                |
|  |newsletter_templates |    |newsletter_automation|                                |
|  +----------+----------+    +---------------------+                                |
|             |                                                                      |
|  +----------+----------+                                                           |
|  |newsletter_campaigns |                                                           |
|  +---------------------+                                                           |
|                                                                                    |
|  +---------------------+                                                           |
|  |newsletter_subscribers|                                                          |
|  +---------------------+                                                           |
|                                                                                    |
+------------------------------------------------------------------------------------+
```

---

## Tablas Core

### `clients`

Almacena los clientes de NeumorStudio (duenos de negocios).

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `auth_user_id` | UUID | FK -> auth.users, UNIQUE | Referencia al usuario de Auth |
| `email` | TEXT | UNIQUE, NOT NULL | Email del cliente |
| `business_name` | TEXT | NOT NULL | Nombre del negocio |
| `business_type` | TEXT | NOT NULL, CHECK | Tipo de negocio (ver enum) |
| `phone` | TEXT | - | Telefono de contacto |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**business_type CHECK:** `restaurant`, `clinic`, `salon`, `shop`, `fitness`, `realestate`, `repairs`

---

### `websites`

Cada cliente tiene un sitio web asociado.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `client_id` | UUID | FK -> clients(id) ON DELETE CASCADE, UNIQUE | Cliente propietario |
| `domain` | TEXT | UNIQUE, NOT NULL | Dominio del sitio |
| `theme` | TEXT | DEFAULT 'light', CHECK | Tema visual |
| `config` | JSONB | DEFAULT '{}' | Configuracion personalizada |
| `is_active` | BOOLEAN | DEFAULT true | Estado del sitio |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**theme CHECK:** `light`, `dark`, `colorful`, `rustic`, `elegant`

**Estructura de `config` (JSONB):**
```json
{
  "businessName": "Nombre Visible",
  "businessType": "restaurant",
  "variants": {
    "hero": "classic|modern|bold|minimal",
    "menu": "tabs|grid|list|carousel",
    "features": "cards|icons|banner",
    "footer": "full|minimal|centered",
    "openStatus": "pulse|morph|liquid|time",
    "reservation": "classic|wizard|modal|modern"
  },
  "openStatus": {
    "enabled": true,
    "variant": "pulse",
    "position": "floating|inline|header",
    "schedule": { "lunes": { "open": "13:00", "close": "23:00" }, ... },
    "forceStatus": null,
    "showScheduleInfo": true,
    "language": "es"
  },
  "heroTitle": "Titulo del Hero",
  "heroSubtitle": "Subtitulo",
  "heroImage": "https://...",
  "address": "Direccion",
  "phone": "+34 000 000 000",
  "email": "email@example.com",
  "socialLinks": { "instagram": "#", "facebook": "#" }
}
```

---

### `business_type_config`

Configuracion del panel admin segun tipo de negocio.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `business_type` | TEXT | UNIQUE, NOT NULL | Tipo de negocio |
| `label` | TEXT | NOT NULL | Etiqueta visible |
| `visible_sections` | TEXT[] | NOT NULL | Secciones del sidebar |
| `dashboard_widgets` | TEXT[] | NOT NULL | Widgets del dashboard |
| `default_section` | TEXT | DEFAULT 'dashboard' | Seccion inicial |
| `icon` | TEXT | - | Icono (nombre) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**Configuraciones por defecto:**

| Tipo | Secciones | Widgets |
|------|-----------|---------|
| restaurant | dashboard, reservas, newsletter, clientes, personalizacion, configuracion | bookings_today, bookings_month, bookings_pending |
| clinic | dashboard, reservas, clientes, newsletter, personalizacion, configuracion | bookings_today, bookings_month, bookings_pending |
| salon | dashboard, reservas, clientes, newsletter, personalizacion, configuracion | bookings_today, bookings_month, bookings_pending |
| repairs | dashboard, presupuestos, trabajos, clientes, pagos, newsletter, personalizacion, configuracion | jobs_active, jobs_pending, revenue_month |
| fitness | dashboard, sesiones, clientes, progreso, paquetes, servicios, pagos, configuracion | sessions_today, sessions_week, active_clients, revenue_month, expiring_packages |

---

### `notification_settings`

Preferencias de notificaciones por cliente.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `client_id` | UUID | FK -> clients(id), UNIQUE | Cliente asociado |
| `email_on_new_booking` | BOOLEAN | DEFAULT true | Email en nueva reserva |
| `email_on_new_lead` | BOOLEAN | DEFAULT true | Email en nuevo lead |
| `email_on_new_review` | BOOLEAN | DEFAULT true | Email en nueva resena |
| `sms_on_new_booking` | BOOLEAN | DEFAULT false | SMS en nueva reserva |
| `sms_on_new_lead` | BOOLEAN | DEFAULT false | SMS en nuevo lead |
| `sms_on_new_review` | BOOLEAN | DEFAULT false | SMS en nueva resena |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `activity_log`

Registro de eventos y acciones del sistema.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `client_id` | UUID | FK -> clients(id) | Cliente asociado |
| `action` | TEXT | NOT NULL | Tipo de accion |
| `details` | JSONB | DEFAULT '{}' | Detalles del evento |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha del evento |

**Nota:** INSERT restringido a `service_role` solamente.

---

## Tablas de Negocio - Universal

### `customers`

CRM universal para todos los tipos de negocio.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre del cliente |
| `email` | TEXT | - | Email |
| `phone` | TEXT | - | Telefono |
| `tags` | TEXT[] | DEFAULT '{}' | Etiquetas |
| `notes` | TEXT | - | Notas generales |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**Columnas adicionales para Fitness:**

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `fitness_goals` | TEXT | Objetivos (perder peso, ganar musculo, etc.) |
| `injuries` | TEXT | Lesiones/limitaciones fisicas |
| `medical_notes` | TEXT | Notas medicas relevantes |
| `start_date` | DATE | Fecha inicio entrenamiento |
| `birth_date` | DATE | Fecha de nacimiento |
| `gender` | TEXT | Genero |
| `height_cm` | INTEGER | Altura en cm |
| `trainer_notes` | TEXT | Notas privadas del entrenador |

---

### `bookings`

Reservaciones/citas (restaurantes, clinicas, salones, sesiones fitness).

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `customer_id` | UUID | FK -> customers(id) | Cliente CRM |
| `name` | TEXT | NOT NULL | Nombre del cliente |
| `email` | TEXT | - | Email |
| `phone` | TEXT | NOT NULL | Telefono |
| `date` | DATE | NOT NULL | Fecha |
| `time` | TIME | NOT NULL | Hora |
| `guests` | INTEGER | DEFAULT 1 | Numero de personas |
| `status` | TEXT | DEFAULT 'pending' | Estado |
| `notes` | TEXT | - | Notas |
| `metadata` | JSONB | DEFAULT '{}' | Datos adicionales |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**Columnas adicionales para Fitness:**

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| `service_id` | UUID | FK -> trainer_services(id) |
| `package_id` | UUID | FK -> client_packages(id) |
| `session_notes` | TEXT | Notas de la sesion |
| `workout_summary` | TEXT | Resumen del entrenamiento |
| `duration_minutes` | INTEGER | Duracion real |
| `is_paid` | BOOLEAN | Sesion pagada (DEFAULT false) |

**status:** `pending`, `confirmed`, `cancelled`, `completed`

---

### `leads` (Deprecado)

> **Nota:** Esta tabla se mantiene por compatibilidad pero la seccion de leads ha sido eliminada del admin.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `website_id` | UUID | FK -> websites(id) | Sitio asociado |
| `customer_id` | UUID | FK -> customers(id) | Cliente CRM |
| `name` | TEXT | NOT NULL | Nombre |
| `email` | TEXT | - | Email |
| `phone` | TEXT | - | Telefono |
| `message` | TEXT | - | Mensaje |
| `source` | TEXT | DEFAULT 'website' | Origen |
| `status` | TEXT | DEFAULT 'new' | Estado |
| `lead_type` | TEXT | DEFAULT 'general' | Tipo: general, quote |
| `details` | JSONB | DEFAULT '{}' | Detalles del presupuesto |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

## Tablas de Restaurante

### `menu_items`

Items del menu para restaurantes.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `category` | TEXT | NOT NULL | Categoria (Entrantes, Postres, etc.) |
| `name` | TEXT | NOT NULL | Nombre del plato |
| `description` | TEXT | - | Descripcion |
| `price_cents` | INTEGER | NOT NULL | Precio en centimos |
| `image_url` | TEXT | - | URL de la imagen |
| `tag` | TEXT | - | Etiqueta (Vegano, Sin gluten, etc.) |
| `is_available` | BOOLEAN | DEFAULT true | Disponible |
| `sort_order` | INTEGER | DEFAULT 0 | Orden |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**RLS:** Lectura publica para items activos, escritura solo para propietario.

---

### `order_settings`

Configuracion de pedidos online.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id), UNIQUE | Sitio asociado |
| `pickup_start_time` | TIME | DEFAULT '12:00' | Hora inicio recogida |
| `pickup_end_time` | TIME | DEFAULT '22:00' | Hora fin recogida |
| `min_pickup_advance_minutes` | INTEGER | DEFAULT 30 | Minutos minimos de antelacion |
| `max_pickup_advance_minutes` | INTEGER | DEFAULT 1440 | Minutos maximos de antelacion |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `orders`

Pedidos online con pago via Stripe.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `customer_name` | TEXT | NOT NULL | Nombre del cliente |
| `customer_email` | TEXT | - | Email |
| `customer_phone` | TEXT | - | Telefono |
| `status` | TEXT | DEFAULT 'pending' | Estado del pedido |
| `pickup_time` | TIMESTAMPTZ | NOT NULL | Hora de recogida |
| `total_cents` | INTEGER | NOT NULL | Total en centimos |
| `stripe_payment_intent_id` | TEXT | - | ID del PaymentIntent |
| `notes` | TEXT | - | Notas del pedido |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**status:** `pending`, `paid`, `cancelled`, `failed`, `refunded`

---

### `order_items`

Lineas de pedido.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `order_id` | UUID | FK -> orders(id) ON DELETE CASCADE | Pedido padre |
| `menu_item_id` | UUID | FK -> menu_items(id) | Item del menu |
| `name` | TEXT | NOT NULL | Nombre del item (snapshot) |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 | Cantidad |
| `unit_price_cents` | INTEGER | NOT NULL | Precio unitario |
| `total_cents` | INTEGER | NOT NULL | Total de la linea |

---

## Tablas de Reparaciones/Reformas

### `jobs`

Trabajos de reparacion/construccion.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `customer_id` | UUID | FK -> customers(id) | Cliente |
| `title` | TEXT | NOT NULL | Titulo del trabajo |
| `description` | TEXT | - | Descripcion |
| `status` | job_status | DEFAULT 'pending' | Estado (ver enum) |
| `priority` | TEXT | DEFAULT 'medium' | Prioridad |
| `start_date` | DATE | - | Fecha de inicio |
| `due_date` | DATE | - | Fecha limite |
| `completed_at` | TIMESTAMPTZ | - | Fecha de finalizacion |
| `estimated_cost_cents` | INTEGER | - | Coste estimado |
| `final_cost_cents` | INTEGER | - | Coste final |
| `address` | TEXT | - | Direccion del trabajo |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `job_tasks`

Tareas dentro de un trabajo.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `job_id` | UUID | FK -> jobs(id) ON DELETE CASCADE | Trabajo padre |
| `title` | TEXT | NOT NULL | Titulo de la tarea |
| `is_completed` | BOOLEAN | DEFAULT false | Completada |
| `sort_order` | INTEGER | DEFAULT 0 | Orden |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |

---

### `job_photos`

Fotos de trabajos (antes, durante, despues).

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `job_id` | UUID | FK -> jobs(id) ON DELETE CASCADE | Trabajo asociado |
| `photo_url` | TEXT | NOT NULL | URL de la foto |
| `type` | job_photo_type | NOT NULL | Tipo (ver enum) |
| `caption` | TEXT | - | Descripcion |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |

---

### `payments`

Pagos recibidos (reparaciones, fitness, etc.).

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `job_id` | UUID | FK -> jobs(id) | Trabajo asociado (opcional) |
| `customer_id` | UUID | FK -> customers(id) | Cliente |
| `amount_cents` | INTEGER | NOT NULL | Monto en centimos |
| `method` | payment_method | NOT NULL | Metodo (ver enum) |
| `status` | payment_status | DEFAULT 'completed' | Estado (ver enum) |
| `reference` | TEXT | - | Referencia/numero |
| `notes` | TEXT | - | Notas |
| `paid_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de pago |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

## Tablas de Fitness/Entrenador Personal

### `trainer_services`

Servicios que ofrece el entrenador.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre del servicio |
| `description` | TEXT | - | Descripcion |
| `duration_minutes` | INTEGER | DEFAULT 60 | Duracion en minutos |
| `price_cents` | INTEGER | NOT NULL | Precio en centimos |
| `is_online` | BOOLEAN | DEFAULT false | Sesion online |
| `is_active` | BOOLEAN | DEFAULT true | Activo |
| `sort_order` | INTEGER | DEFAULT 0 | Orden |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**RLS:** Lectura publica para servicios activos.

---

### `client_packages`

Paquetes/bonos de sesiones vendidos.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `customer_id` | UUID | FK -> customers(id) ON DELETE CASCADE | Cliente |
| `name` | TEXT | NOT NULL | Nombre del paquete |
| `total_sessions` | INTEGER | - | Total sesiones (NULL = ilimitado) |
| `used_sessions` | INTEGER | DEFAULT 0 | Sesiones usadas |
| `remaining_sessions` | INTEGER | GENERATED | Sesiones restantes (calculado) |
| `price_cents` | INTEGER | NOT NULL | Precio en centimos |
| `valid_from` | DATE | DEFAULT CURRENT_DATE | Fecha de inicio |
| `valid_until` | DATE | - | Fecha de expiracion |
| `status` | TEXT | DEFAULT 'active' | Estado del paquete |
| `notes` | TEXT | - | Notas |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**status CHECK:** `active`, `expired`, `completed`, `cancelled`

**remaining_sessions:** Columna generada `total_sessions - used_sessions`

---

### `client_progress`

Registro de progreso (medidas, fotos).

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `customer_id` | UUID | FK -> customers(id) ON DELETE CASCADE | Cliente |
| `recorded_at` | DATE | DEFAULT CURRENT_DATE | Fecha del registro |
| `weight_kg` | DECIMAL(5,2) | - | Peso en kg |
| `body_fat_percent` | DECIMAL(4,1) | - | % grasa corporal |
| `muscle_mass_kg` | DECIMAL(5,2) | - | Masa muscular en kg |
| `chest_cm` | DECIMAL(5,1) | - | Pecho en cm |
| `waist_cm` | DECIMAL(5,1) | - | Cintura en cm |
| `hips_cm` | DECIMAL(5,1) | - | Cadera en cm |
| `arm_left_cm` | DECIMAL(5,1) | - | Brazo izquierdo |
| `arm_right_cm` | DECIMAL(5,1) | - | Brazo derecho |
| `thigh_left_cm` | DECIMAL(5,1) | - | Muslo izquierdo |
| `thigh_right_cm` | DECIMAL(5,1) | - | Muslo derecho |
| `calf_cm` | DECIMAL(5,1) | - | Gemelo |
| `photos` | JSONB | DEFAULT '[]' | Fotos de progreso |
| `notes` | TEXT | - | Notas |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**Estructura de `photos` (JSONB):**
```json
[
  { "url": "https://...", "type": "front", "caption": "Frente" },
  { "url": "https://...", "type": "side", "caption": "Lateral" },
  { "url": "https://...", "type": "back", "caption": "Espalda" }
]
```

---

### `client_records`

Records personales / PRs.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `customer_id` | UUID | FK -> customers(id) ON DELETE CASCADE | Cliente |
| `exercise_name` | TEXT | NOT NULL | Nombre del ejercicio |
| `record_value` | DECIMAL(8,2) | NOT NULL | Valor del record |
| `record_unit` | TEXT | DEFAULT 'kg' | Unidad (kg, reps, segundos, metros) |
| `previous_value` | DECIMAL(8,2) | - | Valor anterior |
| `achieved_at` | DATE | DEFAULT CURRENT_DATE | Fecha del record |
| `notes` | TEXT | - | Notas |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |

---

## Tablas de Integraciones

### `social_accounts`

Cuentas de redes sociales conectadas.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `platform` | TEXT | NOT NULL | Plataforma |
| `platform_user_id` | TEXT | NOT NULL | ID en la plataforma |
| `access_token` | TEXT | NOT NULL | Token de acceso |
| `refresh_token` | TEXT | - | Token de refresco |
| `token_expires_at` | TIMESTAMPTZ | - | Expiracion del token |
| `account_name` | TEXT | - | Nombre de usuario |
| `is_active` | BOOLEAN | DEFAULT true | Activa |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**platform:** `instagram`, `facebook`, `tiktok`, `google_business`

---

### `scheduled_posts`

Posts programados para redes sociales.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `website_id` | UUID | FK -> websites(id) | Sitio asociado |
| `social_account_id` | UUID | FK -> social_accounts(id) | Cuenta destino |
| `content` | TEXT | - | Texto del post |
| `media_urls` | TEXT[] | - | URLs de medios |
| `scheduled_for` | TIMESTAMPTZ | - | Fecha programada |
| `published_at` | TIMESTAMPTZ | - | Fecha de publicacion |
| `status` | TEXT | DEFAULT 'draft' | Estado |
| `error_message` | TEXT | - | Mensaje de error |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**status:** `draft`, `scheduled`, `publishing`, `published`, `failed`

---

### `google_business_locations`

Ubicaciones de Google Business Profile.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `social_account_id` | UUID | FK -> social_accounts(id) | Cuenta GBP |
| `location_id` | TEXT | NOT NULL | ID de ubicacion |
| `name` | TEXT | NOT NULL | Nombre del negocio |
| `address` | TEXT | - | Direccion |
| `phone` | TEXT | - | Telefono |
| `website` | TEXT | - | URL del sitio |
| `place_id` | TEXT | - | Google Place ID |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `google_reviews_cache`

Cache de resenas de Google.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `location_id` | UUID | FK -> google_business_locations(id) | Ubicacion |
| `review_id` | TEXT | UNIQUE, NOT NULL | ID de resena en Google |
| `reviewer_name` | TEXT | - | Nombre del resenador |
| `reviewer_photo` | TEXT | - | Foto del resenador |
| `rating` | INTEGER | CHECK 1-5 | Calificacion |
| `comment` | TEXT | - | Comentario |
| `review_time` | TIMESTAMPTZ | - | Fecha de la resena |
| `reply` | TEXT | - | Respuesta del negocio |
| `reply_time` | TIMESTAMPTZ | - | Fecha de respuesta |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de cache |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

## Tablas de Newsletter

### `newsletter_templates`

Plantillas de email marketing.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `website_id` | UUID | FK -> websites(id) | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre interno |
| `subject` | TEXT | NOT NULL | Asunto del email |
| `content` | TEXT | - | Contenido texto plano |
| `html_content` | TEXT | - | Contenido HTML |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `newsletter_campaigns`

Campanas de email enviadas.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `website_id` | UUID | FK -> websites(id) | Sitio asociado |
| `template_id` | UUID | FK -> newsletter_templates(id) | Plantilla usada |
| `name` | TEXT | NOT NULL | Nombre de la campana |
| `subject` | TEXT | NOT NULL | Asunto |
| `audience` | TEXT | - | Tipo de audiencia |
| `status` | TEXT | DEFAULT 'draft' | Estado |
| `scheduled_for` | TIMESTAMPTZ | - | Fecha programada |
| `sent_at` | TIMESTAMPTZ | - | Fecha de envio |
| `stats` | JSONB | DEFAULT '{}' | Estadisticas |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**status:** `draft`, `scheduled`, `sending`, `sent`, `failed`

---

### `newsletter_subscribers`

Suscriptores al newsletter.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `website_id` | UUID | FK -> websites(id) | Sitio asociado |
| `email` | TEXT | NOT NULL | Email |
| `name` | TEXT | - | Nombre |
| `status` | TEXT | DEFAULT 'subscribed' | Estado |
| `tags` | TEXT[] | DEFAULT '{}' | Etiquetas |
| `source` | TEXT | DEFAULT 'booking' | Origen |
| `metadata` | JSONB | DEFAULT '{}' | Datos adicionales |
| `subscribed_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de suscripcion |
| `unsubscribed_at` | TIMESTAMPTZ | - | Fecha de baja |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |

**Constraint:** UNIQUE(website_id, email)

---

### `newsletter_automation`

Configuracion de envio automatico.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador unico |
| `website_id` | UUID | FK -> websites(id), UNIQUE | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre |
| `trigger_event` | TEXT | NOT NULL | Evento disparador |
| `template_id` | UUID | FK -> newsletter_templates(id) | Plantilla |
| `delay_hours` | INTEGER | DEFAULT 0 | Horas de retraso |
| `is_active` | BOOLEAN | DEFAULT true | Activa |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

## Enums y Tipos

### `job_status`

```sql
CREATE TYPE job_status AS ENUM (
  'pending',     -- Pendiente de iniciar
  'in_progress', -- En progreso
  'on_hold',     -- En espera
  'completed',   -- Completado
  'cancelled'    -- Cancelado
);
```

### `job_photo_type`

```sql
CREATE TYPE job_photo_type AS ENUM (
  'before',  -- Antes del trabajo
  'during',  -- Durante el trabajo
  'after'    -- Despues del trabajo
);
```

### `payment_method`

```sql
CREATE TYPE payment_method AS ENUM (
  'cash',     -- Efectivo
  'card',     -- Tarjeta
  'transfer', -- Transferencia
  'bizum',    -- Bizum
  'other'     -- Otro
);
```

### `payment_status`

```sql
CREATE TYPE payment_status AS ENUM (
  'pending',   -- Pendiente
  'completed', -- Completado
  'failed',    -- Fallido
  'refunded'   -- Reembolsado
);
```

---

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Patron general:

### Patron para Tablas con website_id

```sql
-- SELECT/UPDATE/DELETE: filtrar por website del cliente autenticado
USING (
  website_id IN (
    SELECT w.id FROM websites w
    INNER JOIN clients c ON w.client_id = c.id
    WHERE c.auth_user_id = auth.uid()
  )
)

-- INSERT: verificar que el website pertenece al usuario
WITH CHECK (
  website_id IN (
    SELECT w.id FROM websites w
    INNER JOIN clients c ON w.client_id = c.id
    WHERE c.auth_user_id = auth.uid()
  )
)
```

### Tablas con Lectura Publica

Las siguientes tablas permiten SELECT publico (para mostrar en la web):
- `websites` (WHERE is_active = true) - para cargar config
- `menu_items` (WHERE is_available = true) - para mostrar menu
- `trainer_services` (WHERE is_active = true) - para mostrar servicios

### Tablas Restringidas a Backend

- `activity_log` - INSERT solo para `service_role`

### Funciones RPC Restringidas

Las siguientes funciones solo pueden ser ejecutadas por `service_role`:
- `get_pending_newsletters()`
- `mark_newsletter_sent(uuid)`
- `get_newsletter_audience(uuid, text)`

---

## Funciones y Triggers

### Triggers de updated_at

Todas las tablas con `updated_at` tienen el siguiente trigger:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER [table]_updated_at
  BEFORE UPDATE ON [table]
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### `handle_new_user()`

Auto-crea cliente y website cuando se registra un usuario.

```sql
-- Trigger: AFTER INSERT ON auth.users
-- Crea:
--   1. clients con auth_user_id = user.id
--   2. websites con domain = sitio-{uuid8}.neumor.app
```

### `sync_booking_to_newsletter()`

Sincroniza bookings a newsletter_subscribers.

```sql
-- Trigger: AFTER INSERT ON bookings
-- Si booking tiene email:
--   - INSERT o UPDATE en newsletter_subscribers
--   - Incrementa total_bookings
--   - Actualiza last_booking_date
```

### `calculate_next_newsletter_send()`

Calcula proxima fecha de envio de newsletter basado en frecuencia configurada.

### `check_expired_packages()`

Marca paquetes expirados automaticamente (para ejecutar periodicamente).

```sql
-- Marca como 'expired' si valid_until < CURRENT_DATE
-- Marca como 'completed' si used_sessions >= total_sessions
```

---

## Indices

### Core

```sql
CREATE INDEX idx_clients_auth_user_id ON clients(auth_user_id);
CREATE INDEX idx_websites_domain ON websites(domain);
CREATE INDEX idx_websites_client_id ON websites(client_id);
```

### Bookings

```sql
CREATE INDEX idx_bookings_website ON bookings(website_id);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_bookings_package ON bookings(package_id);
```

### Customers

```sql
CREATE INDEX idx_customers_website ON customers(website_id);
CREATE INDEX idx_customers_email ON customers(website_id, email);
```

### Jobs/Repairs

```sql
CREATE INDEX idx_jobs_website ON jobs(website_id);
CREATE INDEX idx_jobs_customer ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_job_tasks_job ON job_tasks(job_id);
CREATE INDEX idx_job_photos_job ON job_photos(job_id);
CREATE INDEX idx_payments_website ON payments(website_id);
CREATE INDEX idx_payments_job ON payments(job_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
```

### Fitness

```sql
CREATE INDEX idx_trainer_services_website ON trainer_services(website_id);
CREATE INDEX idx_trainer_services_active ON trainer_services(website_id, is_active);
CREATE INDEX idx_client_packages_website ON client_packages(website_id);
CREATE INDEX idx_client_packages_customer ON client_packages(customer_id);
CREATE INDEX idx_client_packages_status ON client_packages(website_id, status);
CREATE INDEX idx_client_packages_expiring ON client_packages(valid_until) WHERE status = 'active';
CREATE INDEX idx_client_progress_website ON client_progress(website_id);
CREATE INDEX idx_client_progress_customer ON client_progress(customer_id);
CREATE INDEX idx_client_progress_date ON client_progress(customer_id, recorded_at DESC);
CREATE INDEX idx_client_records_website ON client_records(website_id);
CREATE INDEX idx_client_records_customer ON client_records(customer_id);
CREATE INDEX idx_client_records_exercise ON client_records(customer_id, exercise_name);
```

### Restaurant

```sql
CREATE INDEX idx_menu_items_website ON menu_items(website_id);
CREATE INDEX idx_menu_items_category ON menu_items(website_id, category);
CREATE INDEX idx_orders_website ON orders(website_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
```

### Newsletter

```sql
CREATE INDEX idx_newsletter_templates_website ON newsletter_templates(website_id);
CREATE INDEX idx_newsletter_campaigns_website ON newsletter_campaigns(website_id);
CREATE INDEX idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX idx_newsletter_subscribers_website ON newsletter_subscribers(website_id);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
```

### Social/Integrations

```sql
CREATE INDEX idx_social_accounts_website ON social_accounts(website_id);
CREATE INDEX idx_scheduled_posts_website ON scheduled_posts(website_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_gbp_locations_social ON google_business_locations(social_account_id);
CREATE INDEX idx_reviews_location ON google_reviews_cache(location_id);
```

---

## Historial de Migraciones

### Migraciones Principales (`packages/supabase/migrations/`)

| # | Archivo | Descripcion |
|---|---------|-------------|
| 0001 | `initial_schema.sql` | Tablas core: clients, websites, bookings, leads, notification_settings, activity_log |
| 0002 | `rls_policies.sql` | Politicas RLS iniciales |
| 0003 | `social_accounts.sql` | Redes sociales: social_accounts, scheduled_posts |
| 0004 | `newsletter.sql` | Newsletter: templates, campaigns, subscribers, automation + funciones RPC |
| 0005 | `google_business.sql` | Google Business: locations, reviews_cache |
| 0006 | `auto_create_user.sql` | Trigger para auto-crear cliente/website en signup |
| 0007 | `fix_social_google_rls.sql` | Fix RLS usando auth_user_id |
| 0008 | `menu_orders.sql` | Menu y pedidos: menu_items, order_settings, orders, order_items |
| 0009 | `drop_reservations.sql` | Eliminar tabla obsoleta |
| 0010 | `add_lead_quote_fields.sql` | Campos lead_type y details para presupuestos |
| 0011 | `add_business_type_repairs.sql` | Anadir tipo de negocio "repairs" |
| 0012 | `restrict_newsletter_rpc.sql` | Restringir acceso a funciones RPC |
| 0013 | `newsletter_rpc_lockdown.sql` | Hardening de funciones newsletter |
| 0014 | `rls_bookings_leads.sql` | Eliminar politicas INSERT publicas |
| 0015 | `activity_log_policy.sql` | Actualizar politicas activity_log |
| 0016 | `fix_bookings_leads_insert_policy.sql` | Fix INSERT policies para bookings/leads |
| 0017 | `activity_log_lockdown.sql` | Hardening de activity_log |
| 0018 | `public_website_select.sql` | Permitir lectura publica de websites activos |
| 0019 | `business_type_config.sql` | Tabla de configuracion por tipo de negocio |
| 0020 | `customers_table.sql` | Tabla CRM universal de clientes |
| 0021 | `jobs_tables.sql` | Tablas para reparaciones: jobs, job_tasks, job_photos |
| 0022 | `payments_table.sql` | Tabla de pagos |
| 0023 | `remove_leads_from_config.sql` | Eliminar referencias a leads de business_type_config |
| 0024 | `trainer_services.sql` | Servicios del entrenador personal |
| 0025 | `client_packages.sql` | Paquetes/bonos de sesiones |
| 0026 | `client_progress.sql` | Progreso y records del cliente |
| 0027 | `fitness_enhancements.sql` | Campos adicionales en customers y bookings para fitness |

---

## Queries Utiles de Verificacion

### Verificar estructura de tablas
```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### Verificar politicas RLS
```sql
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verificar indices
```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### Verificar triggers
```sql
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Verificar funciones
```sql
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public';
```

### Verificar enums
```sql
SELECT t.typname AS enum_name, e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
ORDER BY t.typname, e.enumsortorder;
```

---

> **Nota:** Esta documentacion refleja el estado actual del esquema basado en los archivos de migracion. Para verificar el esquema en produccion, ejecutar las queries de verificacion directamente en Supabase.
