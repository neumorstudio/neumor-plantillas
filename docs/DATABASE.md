# NeumorStudio - Documentacion de Base de Datos

> **Ultima actualizacion:** 31 Enero 2026
> **Motor:** PostgreSQL (Supabase)
> **Proyecto Supabase:** neumor-plantillas (jekrqkdvgcwruhghtgkj)
> **Migraciones:** 56 archivos en `packages/supabase/migrations/`
> **Tablas:** 37 tablas en schema public

> **Cambios recientes (2026-01-31):**
> - CHECK de `theme` expandido (migracion 0056).
> - Estructura `websites.config` actualizada: sectionsConfig, variants, branding, galleryImages y campos de textos por seccion.

## Tabla de Contenidos

1. [Arquitectura Multi-tenant](#arquitectura-multi-tenant)
2. [Diagrama de Relaciones](#diagrama-de-relaciones)
3. [Tablas Core](#tablas-core)
4. [Tablas de Negocio - Universal](#tablas-de-negocio---universal)
5. [Tablas de Salon/Peluqueria](#tablas-de-salonpeluqueria)
6. [Tablas de Restaurante](#tablas-de-restaurante)
7. [Tablas de Reparaciones/Reformas](#tablas-de-reparacionesreformas)
8. [Tablas de Fitness/Entrenador Personal](#tablas-de-fitnessentrenador-personal)
9. [Tablas de Calendario/Horarios](#tablas-de-calendariohorarios)
10. [Tablas de Integraciones](#tablas-de-integraciones)
11. [Tablas de Newsletter](#tablas-de-newsletter)
12. [Enums y Tipos](#enums-y-tipos)
13. [Row Level Security (RLS)](#row-level-security-rls)
14. [Funciones y Triggers](#funciones-y-triggers)
15. [Indices](#indices)
16. [Historial de Migraciones](#historial-de-migraciones)

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
                    +-- menu_items.website_id
                    +-- jobs.website_id
                    +-- trainer_services.website_id
                    +-- client_packages.website_id
                    +-- client_progress.website_id
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
|  +-------------+                               |  |  |  |  |                       |
|  | menu_items  |<------------------------------+  |  |  |  |                       |
|  +-------------+                                  |  |  |  |                       |
|  | id (PK)     |                                  |  |  |  |                       |
|  | website_id  |                                  |  |  |  |                       |
|  | name, price |                                  |  |  |  |                       |
|  | category    |                                  |  |  |  |                       |
|  +-------------+                                  |  |  |  |                       |
|                                                   |  |  |  |                       |
+---------------------------------------------------+--+--+--+-----------------------+
|                            REPAIRS/JOBS TABLES       |  |  |                       |
+------------------------------------------------------+--+--+----------------------+
|                                                      |  |  |                       |
|  +-------------+      +-------------+                |  |  |                       |
|  |    jobs     |<-----+  job_tasks  |                |  |  |                       |
|  +-------------+      +-------------+                |  |  |                       |
|  | id (PK)     |      | id (PK)     |                |  |  |                       |
|  | website_id  |<-----+ job_id      |                |  |  |                       |
|  | customer_id |      | title       |                |  |  |                       |
|  | status      |      | is_completed|                |  |  |                       |
|  | costs       |      +-------------+                |  |  |                       |
|  +------+------+                                     |  |  |                       |
|         |             +-------------+                |  |  |                       |
|         +------------>| job_photos  |                |  |  |                       |
|                       +-------------+                |  |  |                       |
|                       | type (enum) |                |  |  |                       |
|                       +-------------+                |  |  |                       |
|                                                      |  |  |                       |
+------------------------------------------------------+--+--+-----------------------+
|                            FITNESS TABLES               |  |                       |
+---------------------------------------------------------+--+----------------------+
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
| `address` | TEXT | - | Direccion del negocio |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**business_type CHECK:** `restaurant`, `clinic`, `salon`, `shop`, `fitness`, `realestate`, `repairs`, `gym`, `store`

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

**theme CHECK:** `light`, `dark`, `colorful`, `rustic`, `elegant`, `neuglass`, `neuglass-dark`, `christmas`, `summer`, `autumn`, `spring`, `ocean`, `sunset`, `forest`, `midnight`, `rose`, `lavender`, `coral`, `minimal`, `wellness`, `vintage`

**Estructura de `config` (JSONB):**
```json
{
  "businessName": "Nombre Visible",
  "businessType": "restaurant",
  "variants": {
    "hero": "classic|modern|bold|minimal|fullscreen|split",
    "menu": "tabs|grid|list|carousel",
    "services": "tabs|grid|list|carousel",
    "features": "cards|icons|banner",
    "reviews": "grid|carousel|minimal",
    "footer": "full|minimal|centered",
    "reservation": "classic|wizard|modal|modern"
  },
  "sectionsConfig": {
    "sections": [
      { "id": "hero", "enabled": true, "variant": "classic", "order": 0 },
      { "id": "features", "enabled": true, "variant": "cards", "order": 1 },
      { "id": "services", "enabled": true, "variant": "tabs", "order": 2 },
      { "id": "testimonials", "enabled": false, "variant": "carousel", "order": 3 },
      { "id": "gallery", "enabled": false, "variant": "masonry", "order": 4 },
      { "id": "faq", "enabled": false, "variant": "accordion", "order": 5 },
      { "id": "plans", "enabled": false, "variant": "cards", "order": 6 },
      { "id": "contact", "enabled": true, "variant": "form", "order": 7 },
      { "id": "footer", "enabled": true, "variant": "full", "order": 8 }
    ],
    "updatedAt": "2026-01-31T00:00:00.000Z"
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
  "heroImages": ["https://..."],
  "heroCta": "Reservar",
  "reviewsTitle": "Lo que dicen de nosotros",
  "reviewsSubtitle": "Opiniones reales",
  "teamTitle": "Nuestro Equipo",
  "teamSubtitle": "Profesionales dedicados",
  "galleryTitle": "Nuestra Galeria",
  "gallerySubtitle": "Descubre nuestro trabajo",
  "galleryImages": ["https://..."],
  "faqTitle": "Preguntas Frecuentes",
  "faqSubtitle": "Resolvemos tus dudas",
  "plansTitle": "Nuestros Planes",
  "plansSubtitle": "Elige el plan ideal",
  "contactTitle": "Contacto",
  "contactSubtitle": "Estamos para ayudarte",
  "address": "Direccion",
  "phone": "+34 000 000 000",
  "email": "email@example.com",
  "socialLinks": { "instagram": "#", "facebook": "#" },
  "schedule": { "weekdays": "...", "saturday": "...", "sunday": "..." },
  "features": { "title": "...", "subtitle": "...", "items": [ ... ] },
  "colors": { "primary": "#...", "secondary": "#...", "accent": "#..." },
  "typography": { "headingFont": "...", "bodyFont": "...", "baseFontSize": 16 },
  "effects": { "shadowIntensity": 40, "borderRadius": 16, "glassmorphism": false, "blurIntensity": 16 },
  "branding": { "logo": "https://...", "logoDisplay": "logo|name", "logoSize": "sm|md|lg" },
  "logo": "https://..."
}
```

**Nota:** puede existir un objeto legado `config.content` con textos. Las plantillas y el admin deben mergear `config` + `config.content` al leer.

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

## Tablas de Salon/Peluqueria

### `service_categories`

Categorias de servicios para salones de belleza/peluquerias.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre de la categoria |
| `sort_order` | INTEGER | DEFAULT 0 | Orden de visualizacion |
| `is_active` | BOOLEAN | DEFAULT true | Activa |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**RLS:** Lectura publica para categorias activas, escritura solo para propietario.

---

### `service_items`

Servicios individuales dentro de cada categoria.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `category_id` | UUID | FK -> service_categories(id) ON DELETE CASCADE | Categoria padre |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre del servicio |
| `price_cents` | INTEGER | NOT NULL, CHECK >= 0 | Precio en centimos |
| `duration_minutes` | INTEGER | NOT NULL, DEFAULT 30, CHECK > 0 | Duracion en minutos |
| `notes` | TEXT | - | Notas adicionales |
| `sort_order` | INTEGER | DEFAULT 0 | Orden de visualizacion |
| `is_active` | BOOLEAN | DEFAULT true | Activo |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**RLS:** Lectura publica para servicios activos, escritura solo para propietario.

---

### `professionals`

Profesionales/empleados del salon.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre del profesional |
| `description` | TEXT | - | Descripcion del profesional |
| `is_active` | BOOLEAN | DEFAULT true | Activo |
| `sort_order` | INTEGER | DEFAULT 0 | Orden de visualizacion |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `professional_categories`

Relacion muchos-a-muchos entre profesionales y categorias de servicios.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) | Sitio asociado |
| `professional_id` | UUID | FK -> professionals(id) | Profesional |
| `category_id` | UUID | FK -> service_categories(id) | Categoria de servicio |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |

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

## Tablas de Calendario/Horarios

### `business_hours`

Horarios regulares del negocio por dia de la semana.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `day_of_week` | SMALLINT | NOT NULL, CHECK 0-6 | Dia (0=Domingo, 6=Sabado) |
| `is_open` | BOOLEAN | DEFAULT true | Abierto este dia |
| `open_time` | TIME | NOT NULL, DEFAULT '09:00' | Hora de apertura |
| `close_time` | TIME | NOT NULL, DEFAULT '19:00' | Hora de cierre |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

**Constraint:** UNIQUE(website_id, day_of_week)

---

### `business_hour_slots`

Franjas horarias multiples por dia (para negocios con horario partido).

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `day_of_week` | INTEGER | NOT NULL | Dia de la semana |
| `open_time` | TIME | NOT NULL | Hora de apertura |
| `close_time` | TIME | NOT NULL | Hora de cierre |
| `sort_order` | INTEGER | DEFAULT 0 | Orden |
| `is_active` | BOOLEAN | DEFAULT true | Activo |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `special_days`

Dias especiales (festivos, vacaciones, horarios especiales).

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `date` | DATE | NOT NULL | Fecha del dia especial |
| `is_open` | BOOLEAN | DEFAULT false | Abierto (false = cerrado) |
| `open_time` | TIME | DEFAULT '09:00' | Hora de apertura |
| `close_time` | TIME | DEFAULT '19:00' | Hora de cierre |
| `note` | TEXT | - | Nota (ej: "Festivo", "Vacaciones") |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `special_day_slots`

Franjas horarias para dias especiales.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `special_day_id` | UUID | FK -> special_days(id) ON DELETE CASCADE | Dia especial padre |
| `open_time` | TIME | NOT NULL | Hora de apertura |
| `close_time` | TIME | NOT NULL | Hora de cierre |
| `sort_order` | INTEGER | DEFAULT 0 | Orden |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Ultima actualizacion |

---

### `restaurants`

Configuracion especifica de restaurantes.

| Columna | Tipo | Restricciones | Descripcion |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT gen_random_uuid() | Identificador unico |
| `website_id` | UUID | FK -> websites(id) ON DELETE CASCADE | Sitio asociado |
| `is_open` | BOOLEAN | DEFAULT true | Restaurante abierto |
| `kitchen_open` | BOOLEAN | DEFAULT true | Cocina abierta |
| `takeaway_enabled` | BOOLEAN | DEFAULT false | Pedidos para llevar |
| `capacity` | INTEGER | DEFAULT 20 | Capacidad de comensales |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creacion |
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
CREATE INDEX idx_websites_subdomain ON websites(subdomain) WHERE subdomain IS NOT NULL;
CREATE INDEX idx_websites_custom_domain ON websites(custom_domain) WHERE custom_domain IS NOT NULL;
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
```

### Newsletter

```sql
CREATE INDEX idx_newsletter_templates_website ON newsletter_templates(website_id);
CREATE INDEX idx_newsletter_campaigns_website ON newsletter_campaigns(website_id);
CREATE INDEX idx_newsletter_campaigns_status ON newsletter_campaigns(status);
CREATE INDEX idx_newsletter_subscribers_website ON newsletter_subscribers(website_id);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
```

---

## Historial de Migraciones

### Migraciones Principales (`packages/supabase/migrations/`)

| # | Archivo | Descripcion |
|---|---------|-------------|
| 0001 | `initial_schema.sql` | Tablas core: clients, websites, bookings, leads, notification_settings, activity_log |
| 0002 | `rls_policies.sql` | Politicas RLS iniciales |
| 0004 | `newsletter.sql` | Newsletter: templates, campaigns, subscribers, automation + funciones RPC |
| 0006 | `auto_create_user.sql` | Trigger para auto-crear cliente/website en signup |
| 0008 | `menu_orders.sql` | Menu: menu_items |
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
| 0023 | `remove_leads_from_config.sql` | Eliminar referencias a leads de business_type_config |
| 0024 | `trainer_services.sql` | Servicios del entrenador personal |
| 0025 | `client_packages.sql` | Paquetes/bonos de sesiones |
| 0026 | `client_progress.sql` | Progreso y records del cliente |
| 0027 | `fitness_enhancements.sql` | Campos adicionales en customers y bookings para fitness |
| 0028 | `customer_auth.sql` | Autenticacion de clientes finales |
| 0029 | `public_bookings_insert.sql` | Permitir INSERT publico en bookings |
| 0030 | `public_bookings_insert_fix.sql` | Fix policy INSERT bookings |
| 0031 | `booking_services_columns.sql` | Columnas services y total_price en bookings |
| 0032 | `grant_bookings_insert.sql` | Grant INSERT en bookings para anon |
| 0033 | `public_read_bookings.sql` | Lectura publica de bookings |
| 0034 | `business_hours.sql` | Horarios de negocio |
| 0035 | `special_days.sql` | Dias especiales (festivos, vacaciones) |
| 0036 | `public_read_hours_special_days.sql` | Lectura publica de horarios |
| 0037 | `delete_bookings_policy.sql` | Policy DELETE para bookings |
| 0038 | `business_hour_slots.sql` | Franjas horarias multiples |
| 0039 | `public_read_business_hour_slots.sql` | Lectura publica de franjas |
| 0040 | `professionals.sql` | Profesionales del salon |
| 0041 | `public_read_professionals.sql` | Lectura publica de profesionales |
| 0042 | `booking_professional_id.sql` | FK professional_id en bookings |
| 0043 | `special_day_slots.sql` | Franjas horarias para dias especiales |
| 0044 | `public_read_special_day_slots.sql` | Lectura publica de franjas especiales |
| 0045 | `professional_categories.sql` | Relacion profesional-categoria |
| 0046 | `public_read_professional_categories.sql` | Lectura publica |
| 0047 | `admin_insert_bookings.sql` | INSERT policy para admin en bookings |
| 0048 | `salon_services.sql` | Categorias y servicios de salon |
| 0049 | `fix_fitness_sections.sql` | Fix secciones visibles para fitness |
| 0050 | `add_calendario_fitness.sql` | Anadir calendario a fitness |
| 0051 | `public_read_service_catalog.sql` | RLS lectura publica de service_categories y service_items |
| 0052 | `add_gym_store_business_types.sql` | Anadir tipos de negocio 'gym' y 'store' al CHECK constraint |
| 0053 | `public_clients_business_type.sql` | RLS lectura publica de business_type en clients |
| 0054 | `website_domains_indexes.sql` | Indices para subdomain y custom_domain en websites |
| 0055 | `clients_address.sql` | Columna address en tabla clients |
| 0056 | `expand_theme_check.sql` | Expandir CHECK de temas en websites |

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
