# NeumorStudio - Documentación de Base de Datos

> **Última actualización:** Enero 2026
> **Motor:** PostgreSQL (Supabase)
> **Migraciones:** 17 archivos en `packages/supabase/migrations/`

## Tabla de Contenidos

1. [Arquitectura Multi-tenant](#arquitectura-multi-tenant)
2. [Diagrama de Relaciones](#diagrama-de-relaciones)
3. [Tablas Core](#tablas-core)
4. [Tablas de Negocio](#tablas-de-negocio)
5. [Tablas de Integraciones](#tablas-de-integraciones)
6. [Tablas de Newsletter](#tablas-de-newsletter)
7. [Row Level Security (RLS)](#row-level-security-rls)
8. [Funciones y Triggers](#funciones-y-triggers)
9. [Índices](#índices)
10. [Historial de Migraciones](#historial-de-migraciones)

---

## Arquitectura Multi-tenant

NeumorStudio implementa multi-tenancy a nivel de base de datos usando Row Level Security (RLS) de PostgreSQL.

### Modelo de Aislamiento

```
auth.users (Supabase Auth)
    │
    ├── clients.id = auth.uid()         ← Patrón legacy (trigger auto-create)
    │   OR
    └── clients.auth_user_id = auth.uid() ← Patrón recomendado (CLI)
            │
            └── websites.client_id
                    │
                    ├── bookings.website_id
                    ├── leads.website_id
                    ├── orders.website_id
                    ├── menu_items.website_id
                    ├── social_accounts.website_id
                    ├── newsletter_*.website_id
                    └── notification_settings.website_id
```

### Flujo de Autenticación → Datos

1. Usuario se autentica con Supabase Auth
2. `auth.uid()` devuelve el UUID del usuario
3. RLS busca el cliente asociado:
   - **Patrón 1:** `clients.id = auth.uid()` (auto-create via trigger)
   - **Patrón 2:** `clients.auth_user_id = auth.uid()` (CLI provisioning)
4. Se obtiene el `website_id` asociado al cliente
5. Todas las queries filtran por `website_id`

---

## Diagrama de Relaciones

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE TABLES                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌────────────────────┐   │
│  │   clients    │ 1────1  │   websites   │ 1────1  │notification_settings│  │
│  │              │         │              │         └────────────────────┘   │
│  │ • id (PK)    │         │ • id (PK)    │                                  │
│  │ • email      │         │ • client_id  │────┬────┬────┬────┬────┐        │
│  │ • business_  │         │ • domain     │    │    │    │    │    │        │
│  │   name/type  │         │ • theme      │    │    │    │    │    │        │
│  │ • auth_user_ │         │ • config     │    │    │    │    │    │        │
│  │   id (FK)    │         │              │    │    │    │    │    │        │
│  └──────────────┘         └──────────────┘    │    │    │    │    │        │
│                                                │    │    │    │    │        │
├────────────────────────────────────────────────┼────┼────┼────┼────┼────────┤
│                         BUSINESS TABLES        │    │    │    │    │        │
├────────────────────────────────────────────────┼────┼────┼────┼────┼────────┤
│                                                │    │    │    │    │        │
│  ┌──────────────┐    ┌──────────────┐    ┌────┴────┴────┴────┴────┴───┐    │
│  │   bookings   │    │    leads     │    │        activity_log        │    │
│  │              │    │              │    └────────────────────────────┘    │
│  │ • id (PK)    │    │ • id (PK)    │                                      │
│  │ • website_id │    │ • website_id │    ┌──────────────┐                  │
│  │ • customer_* │    │ • name/email │    │ order_settings│                 │
│  │ • booking_*  │    │ • message    │    └──────────────┘                  │
│  │ • status     │    │ • lead_type  │                                      │
│  └──────────────┘    │ • details    │    ┌──────────────┐ ┌─────────────┐  │
│         │            └──────────────┘    │  menu_items  │ │   orders    │  │
│         │                                │              │ │             │  │
│         │ (trigger)                      └──────────────┘ └──────┬──────┘  │
│         ▼                                                        │         │
│  ┌─────────────────────┐                              ┌──────────┴──────┐  │
│  │newsletter_subscribers│                             │   order_items   │  │
│  └─────────────────────┘                              └─────────────────┘  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                         INTEGRATION TABLES                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────┐        ┌─────────────────────────┐                   │
│  │  social_accounts │ 1────N │ google_business_locations│                  │
│  │                  │        │                         │                   │
│  │ • platform       │        │ • social_account_id     │                   │
│  │ • access_token   │        │ • location_name         │                   │
│  │ • account_*      │        │ • title/address         │                   │
│  └────────┬─────────┘        └───────────┬─────────────┘                   │
│           │                              │                                  │
│           │                              │                                  │
│  ┌────────┴─────────┐        ┌───────────┴─────────────┐                   │
│  │  scheduled_posts │        │   google_reviews_cache  │                   │
│  │                  │        │                         │                   │
│  │ • content_type   │        │ • review_name           │                   │
│  │ • caption        │        │ • star_rating           │                   │
│  │ • scheduled_for  │        │ • comment/reply         │                   │
│  └──────────────────┘        └─────────────────────────┘                   │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                         NEWSLETTER TABLES                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────────────────┐    ┌─────────────────────┐                        │
│  │ newsletter_templates│    │newsletter_automation│                        │
│  │                     │    │                     │                        │
│  │ • name/subject      │    │ • frequency         │                        │
│  │ • html_content      │    │ • send_time         │                        │
│  └──────────┬──────────┘    │ • auto_audience     │                        │
│             │               └─────────────────────┘                        │
│             │                                                              │
│  ┌──────────┴──────────┐                                                   │
│  │newsletter_campaigns │                                                   │
│  │                     │                                                   │
│  │ • status (draft→    │                                                   │
│  │   scheduled→sent)   │                                                   │
│  │ • metrics (sent,    │                                                   │
│  │   opened, clicked)  │                                                   │
│  └─────────────────────┘                                                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Tablas Core

### `clients`

Almacena los clientes de NeumorStudio (dueños de negocios).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| `email` | TEXT | UNIQUE, NOT NULL | Email del cliente |
| `business_name` | TEXT | NOT NULL | Nombre del negocio |
| `business_type` | TEXT | NOT NULL, CHECK | Tipo: restaurant, clinic, salon, shop, fitness, realestate, repairs |
| `phone` | TEXT | - | Teléfono de contacto |
| `auth_user_id` | UUID | FK → auth.users | Referencia al usuario de Auth (CLI) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Notas:**
- El `id` puede coincidir con `auth.uid()` cuando se usa el trigger de auto-create
- El campo `auth_user_id` se usa cuando el cliente es creado via CLI

---

### `websites`

Cada cliente tiene un sitio web asociado.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Identificador único |
| `client_id` | UUID | FK → clients(id) ON DELETE CASCADE, UNIQUE | Cliente propietario |
| `domain` | TEXT | UNIQUE, NOT NULL | Dominio del sitio (ej: `mi-restaurante.neumor.app`) |
| `theme` | TEXT | DEFAULT 'light', CHECK | Tema: light, dark, colorful, rustic, elegant |
| `config` | JSONB | DEFAULT '{}' | Configuración personalizada del sitio |
| `is_active` | BOOLEAN | DEFAULT true | Estado del sitio |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Estructura de `config` (JSONB):**
```json
{
  "businessName": "Nombre Visible",
  "businessType": "restaurant",
  "variants": {
    "hero": "classic|modern|bold|minimal",
    "menu": "tabs|grid|list|carousel",
    "features": "cards|icons|banner",
    "reviews": "grid|carousel|minimal",
    "footer": "full|minimal|centered",
    "reservation": "classic|wizard|modal|modern"
  }
}
```

---

### `notification_settings`

Preferencias de automatización por sitio web.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id), UNIQUE | Sitio asociado |
| `email_booking_confirmation` | BOOLEAN | DEFAULT true | Enviar email al confirmar reserva |
| `whatsapp_booking_confirmation` | BOOLEAN | DEFAULT true | Enviar WhatsApp al confirmar |
| `reminder_24h` | BOOLEAN | DEFAULT false | Enviar recordatorio 24h antes |
| `reminder_time` | TIME | DEFAULT '10:00' | Hora del recordatorio |
| `email_new_lead` | BOOLEAN | DEFAULT true | Notificar nuevos leads por email |
| `whatsapp_new_lead` | BOOLEAN | DEFAULT false | Notificar nuevos leads por WhatsApp |
| `webhook_url` | TEXT | - | URL de webhook personalizado |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

---

## Tablas de Negocio

### `bookings`

Reservaciones (restaurantes, clínicas, salones, etc.).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `customer_name` | TEXT | NOT NULL | Nombre del cliente |
| `customer_email` | TEXT | - | Email del cliente |
| `customer_phone` | TEXT | NOT NULL | Teléfono del cliente |
| `booking_date` | DATE | NOT NULL | Fecha de la reserva |
| `booking_time` | TIME | NOT NULL | Hora de la reserva |
| `guests` | INTEGER | DEFAULT 1 | Número de personas |
| `notes` | TEXT | - | Notas adicionales |
| `status` | TEXT | DEFAULT 'pending', CHECK | pending, confirmed, cancelled, completed |
| `source` | TEXT | DEFAULT 'website', CHECK | website, phone, walkin, other |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Trigger asociado:** Al insertar un booking con email, se crea/actualiza automáticamente un `newsletter_subscriber`.

---

### `leads`

Contactos y solicitudes de presupuesto.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre del contacto |
| `email` | TEXT | - | Email |
| `phone` | TEXT | - | Teléfono |
| `message` | TEXT | - | Mensaje/consulta |
| `lead_type` | TEXT | DEFAULT 'general', CHECK | general, quote |
| `details` | JSONB | DEFAULT '{}' | Detalles del presupuesto (para repairs) |
| `source` | TEXT | DEFAULT 'website', CHECK | website, instagram, facebook, google, other |
| `status` | TEXT | DEFAULT 'new', CHECK | new, contacted, converted, lost |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

---

### `activity_log`

Registro de eventos y acciones del sistema.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `event_type` | TEXT | NOT NULL, CHECK | Tipo de evento (ver lista abajo) |
| `event_data` | JSONB | DEFAULT '{}' | Datos del evento |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha del evento |

**Tipos de evento:**
- `booking_created`, `booking_confirmed`, `booking_cancelled`
- `lead_created`, `lead_converted`
- `notification_sent`, `reminder_sent`

---

### `menu_items`

Elementos del menú (para restaurantes).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre del plato |
| `description` | TEXT | - | Descripción |
| `price_cents` | INTEGER | NOT NULL, CHECK >= 0 | Precio en céntimos |
| `category` | TEXT | NOT NULL | Categoría (ej: "Entrantes", "Postres") |
| `tag` | TEXT | - | Etiqueta (ej: "Vegano", "Sin gluten") |
| `image_url` | TEXT | - | URL de la imagen |
| `is_active` | BOOLEAN | DEFAULT true | Disponible |
| `sort_order` | INTEGER | DEFAULT 0 | Orden de visualización |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**RLS:** Lectura pública (para mostrar el menú), escritura solo para el propietario.

---

### `order_settings`

Configuración de pedidos para restaurantes.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id), UNIQUE | Sitio asociado |
| `pickup_start_time` | TIME | DEFAULT '12:00' | Hora inicio de recogida |
| `pickup_end_time` | TIME | DEFAULT '22:00' | Hora fin de recogida |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

---

### `orders`

Pedidos online con pago via Stripe.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `customer_name` | TEXT | NOT NULL | Nombre del cliente |
| `customer_email` | TEXT | - | Email |
| `customer_phone` | TEXT | - | Teléfono |
| `pickup_date` | DATE | NOT NULL | Fecha de recogida |
| `pickup_time` | TIME | NOT NULL | Hora de recogida |
| `notes` | TEXT | - | Notas del pedido |
| `status` | TEXT | DEFAULT 'pending', CHECK | pending, paid, cancelled, failed, refunded |
| `currency` | TEXT | DEFAULT 'eur' | Moneda |
| `total_amount` | INTEGER | NOT NULL, CHECK >= 0 | Total en céntimos |
| `stripe_payment_intent_id` | TEXT | - | ID del PaymentIntent |
| `stripe_payment_status` | TEXT | - | Estado del pago en Stripe |
| `paid_at` | TIMESTAMPTZ | - | Fecha de pago |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

---

### `order_items`

Líneas de pedido.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `order_id` | UUID | FK → orders(id) ON DELETE CASCADE | Pedido padre |
| `menu_item_id` | UUID | FK → menu_items(id) | Item del menú |
| `item_name` | TEXT | NOT NULL | Nombre del item (snapshot) |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 | Cantidad |
| `unit_price` | INTEGER | NOT NULL, CHECK >= 0 | Precio unitario en céntimos |
| `total_price` | INTEGER | NOT NULL, CHECK >= 0 | Total de la línea |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

---

## Tablas de Integraciones

### `social_accounts`

Cuentas de redes sociales conectadas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `platform` | TEXT | NOT NULL | instagram, facebook, tiktok, google_business |
| `account_id` | TEXT | NOT NULL | ID en la plataforma |
| `account_name` | TEXT | - | Nombre de usuario (@usuario) |
| `account_image` | TEXT | - | URL de la foto de perfil |
| `access_token` | TEXT | NOT NULL | Token de acceso |
| `refresh_token` | TEXT | - | Token de refresco |
| `token_expires_at` | TIMESTAMPTZ | - | Expiración del token |
| `scopes` | TEXT[] | - | Permisos otorgados |
| `is_active` | BOOLEAN | DEFAULT true | Activa |
| `last_used_at` | TIMESTAMPTZ | - | Último uso |
| `meta` | JSONB | DEFAULT '{}' | Info adicional (page_id, etc.) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Constraint:** UNIQUE(website_id, platform, account_id) - Una sola cuenta por plataforma.

---

### `scheduled_posts`

Posts programados para redes sociales.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `social_account_id` | UUID | FK → social_accounts(id) | Cuenta destino |
| `content_type` | TEXT | NOT NULL | image, video, carousel, reel, story |
| `caption` | TEXT | - | Texto del post |
| `media_urls` | TEXT[] | - | URLs de medios |
| `scheduled_for` | TIMESTAMPTZ | - | Fecha programada |
| `published_at` | TIMESTAMPTZ | - | Fecha de publicación |
| `status` | TEXT | DEFAULT 'draft' | draft, scheduled, publishing, published, failed |
| `error_message` | TEXT | - | Mensaje de error |
| `post_id` | TEXT | - | ID del post publicado |
| `post_url` | TEXT | - | URL del post |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

---

### `google_business_locations`

Ubicaciones de Google Business Profile.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `social_account_id` | UUID | FK → social_accounts(id) | Cuenta GBP asociada |
| `account_name` | TEXT | NOT NULL | Formato: accounts/{accountId} |
| `location_name` | TEXT | NOT NULL | Formato: locations/{locationId} |
| `title` | TEXT | NOT NULL | Nombre visible del negocio |
| `address` | TEXT | - | Dirección |
| `phone` | TEXT | - | Teléfono |
| `website_url` | TEXT | - | URL del sitio web |
| `is_verified` | BOOLEAN | DEFAULT false | Verificado por Google |
| `is_selected` | BOOLEAN | DEFAULT false | Ubicación activa |
| `metadata` | JSONB | DEFAULT '{}' | Metadata adicional |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Constraint:** UNIQUE(social_account_id, location_name)

---

### `google_reviews_cache`

Cache de reseñas de Google.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `location_id` | UUID | FK → google_business_locations(id) | Ubicación |
| `review_name` | TEXT | UNIQUE, NOT NULL | ID de reseña en Google |
| `reviewer_name` | TEXT | - | Nombre del reseñador |
| `reviewer_photo_url` | TEXT | - | Foto del reseñador |
| `star_rating` | INTEGER | CHECK 1-5 | Calificación |
| `comment` | TEXT | - | Comentario |
| `reply_comment` | TEXT | - | Respuesta del negocio |
| `reply_updated_at` | TIMESTAMPTZ | - | Fecha de respuesta |
| `review_created_at` | TIMESTAMPTZ | - | Fecha de la reseña |
| `review_updated_at` | TIMESTAMPTZ | - | Actualización de la reseña |
| `cached_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de cache |

---

## Tablas de Newsletter

### `newsletter_templates`

Plantillas de email marketing.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `name` | TEXT | NOT NULL | Nombre interno |
| `subject` | TEXT | NOT NULL | Asunto del email |
| `preview_text` | TEXT | - | Texto de preview |
| `html_content` | TEXT | NOT NULL | Contenido HTML |
| `is_active` | BOOLEAN | DEFAULT true | Activa |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

---

### `newsletter_campaigns`

Campañas de email enviadas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `template_id` | UUID | FK → newsletter_templates(id) | Plantilla usada |
| `name` | TEXT | NOT NULL | Nombre de la campaña |
| `subject` | TEXT | NOT NULL | Asunto |
| `html_content` | TEXT | NOT NULL | Contenido HTML |
| `audience_type` | TEXT | DEFAULT 'all_customers' | all_customers, recent_customers, custom |
| `audience_filter` | JSONB | DEFAULT '{}' | Filtros personalizados |
| `status` | TEXT | DEFAULT 'draft' | draft, scheduled, sending, sent, failed |
| `scheduled_for` | TIMESTAMPTZ | - | Fecha programada |
| `sent_at` | TIMESTAMPTZ | - | Fecha de envío |
| `total_recipients` | INTEGER | DEFAULT 0 | Total destinatarios |
| `emails_sent` | INTEGER | DEFAULT 0 | Emails enviados |
| `emails_failed` | INTEGER | DEFAULT 0 | Emails fallidos |
| `delivered_count` | INTEGER | DEFAULT 0 | Entregados |
| `opened_count` | INTEGER | DEFAULT 0 | Abiertos |
| `clicked_count` | INTEGER | DEFAULT 0 | Clics |
| `error_message` | TEXT | - | Mensaje de error |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

---

### `newsletter_subscribers`

Suscriptores al newsletter.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id) | Sitio asociado |
| `email` | TEXT | NOT NULL | Email |
| `name` | TEXT | - | Nombre |
| `is_subscribed` | BOOLEAN | DEFAULT true | Suscrito actualmente |
| `subscribed_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de suscripción |
| `unsubscribed_at` | TIMESTAMPTZ | - | Fecha de baja |
| `source` | TEXT | DEFAULT 'booking' | booking, form, manual, import |
| `last_booking_date` | DATE | - | Última reserva |
| `total_bookings` | INTEGER | DEFAULT 0 | Total de reservas |
| `emails_received` | INTEGER | DEFAULT 0 | Emails recibidos |
| `emails_opened` | INTEGER | DEFAULT 0 | Emails abiertos |
| `last_email_at` | TIMESTAMPTZ | - | Último email |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Constraint:** UNIQUE(website_id, email)

**Auto-sync:** Se crea/actualiza automáticamente cuando se inserta un booking con email.

---

### `newsletter_automation`

Configuración de envío automático de newsletters.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|---------------|-------------|
| `id` | UUID | PK | Identificador único |
| `website_id` | UUID | FK → websites(id), UNIQUE | Sitio asociado |
| `is_enabled` | BOOLEAN | DEFAULT false | Automatización activa |
| `frequency` | TEXT | DEFAULT 'weekly' | daily, weekly, biweekly, monthly |
| `day_of_week` | INTEGER | DEFAULT 1 | 0=domingo, 1=lunes... |
| `day_of_month` | INTEGER | DEFAULT 1 | 1-28 |
| `send_time` | TIME | DEFAULT '10:00:00' | Hora de envío |
| `timezone` | TEXT | DEFAULT 'Europe/Madrid' | Zona horaria |
| `auto_content_type` | TEXT | DEFAULT 'template' | template, ai_generated, rss |
| `default_template_id` | UUID | FK → newsletter_templates(id) | Plantilla por defecto |
| `auto_audience` | TEXT | DEFAULT 'all' | all, recent_30d, recent_60d, inactive_30d |
| `min_bookings` | INTEGER | DEFAULT 0 | Mínimo de reservas |
| `exclude_recent_days` | INTEGER | DEFAULT 7 | Excluir si recibió email hace X días |
| `last_sent_at` | TIMESTAMPTZ | - | Último envío |
| `next_scheduled_at` | TIMESTAMPTZ | - | Próximo envío programado |
| `total_campaigns_sent` | INTEGER | DEFAULT 0 | Total campañas enviadas |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

---

## Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Patrón general:

### Tablas Core (clients, websites)

```sql
-- clients: el usuario solo ve su propio registro
USING (auth.uid()::TEXT = id::TEXT)
-- O bien (con auth_user_id):
USING (auth.uid() = auth_user_id)

-- websites: el usuario ve el sitio de su cliente
USING (client_id::TEXT = auth.uid()::TEXT)
-- O bien:
USING (client_id IN (SELECT id FROM clients WHERE auth_user_id = auth.uid()))
```

### Tablas de Negocio (bookings, leads, etc.)

```sql
-- SELECT/UPDATE: filtrar por website_id del cliente autenticado
USING (
  website_id IN (
    SELECT id FROM websites WHERE client_id IN (
      SELECT id FROM clients WHERE auth_user_id = auth.uid()
    )
  )
)

-- INSERT (bookings/leads): solo usuarios autenticados en su website
WITH CHECK (
  website_id IN (
    SELECT websites.id FROM websites
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
)
```

### Tablas Públicas (menu_items, order_settings)

```sql
-- SELECT público (para mostrar menú en sitio)
USING (true)

-- ALL para propietarios
USING/WITH CHECK (
  website_id IN (
    SELECT websites.id FROM websites
    JOIN clients ON clients.id = websites.client_id
    WHERE clients.auth_user_id = auth.uid()
  )
)
```

---

## Funciones y Triggers

### `update_updated_at_column()`

Actualiza automáticamente `updated_at` en cada UPDATE.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Tablas con trigger:** clients, websites, bookings, leads, notification_settings, social_accounts, scheduled_posts, google_business_locations, newsletter_*, menu_items, order_settings, orders

---

### `handle_new_user()`

Auto-crea cliente y website cuando se registra un usuario.

```sql
-- Trigger: AFTER INSERT ON auth.users
-- Crea:
--   1. clients (id = user.id)
--   2. websites (domain = sitio-{uuid8}.neumor.app)
```

---

### `sync_booking_to_newsletter()`

Sincroniza bookings a newsletter_subscribers.

```sql
-- Trigger: AFTER INSERT ON bookings
-- Si booking tiene email:
--   - INSERT o UPDATE en newsletter_subscribers
--   - Incrementa total_bookings
--   - Actualiza last_booking_date
```

---

### `update_next_scheduled()`

Calcula próxima fecha de envío de newsletter.

```sql
-- Trigger: BEFORE INSERT/UPDATE ON newsletter_automation
-- Calcula next_scheduled_at basado en frequency, day_of_week, etc.
```

---

### Funciones RPC (llamadas desde n8n)

| Función | Descripción | SECURITY |
|---------|-------------|----------|
| `get_pending_newsletters()` | Obtiene newsletters pendientes de envío | DEFINER |
| `mark_newsletter_sent(uuid)` | Marca newsletter como enviado | DEFINER |
| `get_newsletter_audience(uuid, text)` | Obtiene suscriptores según audiencia | DEFINER |
| `calculate_next_newsletter_send(...)` | Calcula próxima fecha de envío | - |

---

## Índices

### Tablas Core

```sql
-- websites: búsqueda por dominio (login)
CREATE INDEX idx_websites_domain ON websites(domain);
```

### Tablas de Negocio

```sql
-- bookings
CREATE INDEX idx_bookings_website_id ON bookings(website_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- leads
CREATE INDEX idx_leads_website_id ON leads(website_id);
CREATE INDEX idx_leads_status ON leads(status);

-- activity_log
CREATE INDEX idx_activity_log_website_id ON activity_log(website_id);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- menu_items
CREATE INDEX idx_menu_items_website_id ON menu_items(website_id);
CREATE INDEX idx_menu_items_category ON menu_items(website_id, category);

-- orders
CREATE INDEX idx_orders_website_id ON orders(website_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
```

### Tablas de Integraciones

```sql
-- social_accounts
CREATE INDEX idx_social_accounts_website ON social_accounts(website_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);

-- scheduled_posts
CREATE INDEX idx_scheduled_posts_website ON scheduled_posts(website_id);
CREATE INDEX idx_scheduled_posts_status ON scheduled_posts(status);
CREATE INDEX idx_scheduled_posts_scheduled ON scheduled_posts(scheduled_for)
  WHERE status = 'scheduled';

-- google_business_locations
CREATE INDEX idx_gbp_locations_social ON google_business_locations(social_account_id);
CREATE INDEX idx_gbp_locations_selected ON google_business_locations(is_selected)
  WHERE is_selected = true;

-- google_reviews_cache
CREATE INDEX idx_reviews_location ON google_reviews_cache(location_id);
CREATE INDEX idx_reviews_rating ON google_reviews_cache(star_rating);
CREATE INDEX idx_reviews_cached_at ON google_reviews_cache(cached_at);
```

### Tablas de Newsletter

```sql
-- newsletter_templates
CREATE INDEX idx_newsletter_templates_website ON newsletter_templates(website_id);

-- newsletter_campaigns
CREATE INDEX idx_newsletter_campaigns_website ON newsletter_campaigns(website_id);
CREATE INDEX idx_newsletter_campaigns_status ON newsletter_campaigns(status);

-- newsletter_subscribers
CREATE INDEX idx_newsletter_subscribers_website ON newsletter_subscribers(website_id);
CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);

-- newsletter_automation
CREATE INDEX idx_newsletter_automation_website ON newsletter_automation(website_id);
CREATE INDEX idx_newsletter_automation_next ON newsletter_automation(next_scheduled_at)
  WHERE is_enabled = true;
```

---

## Historial de Migraciones

| # | Archivo | Descripción |
|---|---------|-------------|
| 0001 | `initial_schema.sql` | Tablas core: clients, websites, bookings, leads, notification_settings, activity_log |
| 0002 | `rls_policies.sql` | Políticas RLS iniciales |
| 0003 | `social_accounts.sql` | Redes sociales: social_accounts, scheduled_posts |
| 0004 | `newsletter.sql` | Newsletter: templates, campaigns, subscribers, automation + funciones RPC |
| 0005 | `google_business.sql` | Google Business: locations, reviews_cache |
| 0006 | `auto_create_user.sql` | Trigger para auto-crear cliente/website en signup |
| 0007 | `fix_social_google_rls.sql` | Fix RLS usando auth_user_id |
| 0008 | `menu_orders.sql` | Menú y pedidos: menu_items, order_settings, orders, order_items |
| 0009 | `drop_reservations.sql` | Eliminar tabla obsoleta |
| 0010 | `add_lead_quote_fields.sql` | Campos lead_type y details para presupuestos |
| 0011 | `add_business_type_repairs.sql` | Añadir tipo de negocio "repairs" |
| 0012 | `restrict_newsletter_rpc.sql` | Restringir acceso a funciones RPC |
| 0013 | `newsletter_rpc_lockdown.sql` | Hardening de funciones newsletter |
| 0014 | `rls_bookings_leads.sql` | Eliminar políticas INSERT públicas |
| 0015 | `activity_log_policy.sql` | Actualizar políticas activity_log |
| 0016 | `fix_bookings_leads_insert_policy.sql` | Fix INSERT policies para bookings/leads |
| 0017 | `activity_log_lockdown.sql` | Hardening de activity_log |

---

## Queries Útiles de Verificación

### Verificar estructura de tablas
```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

### Verificar políticas RLS
```sql
SELECT tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Verificar índices
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

---

> **Nota:** Esta documentación refleja el estado actual del esquema basado en los archivos de migración. Para verificar el esquema en producción, ejecutar las queries de verificación directamente en Supabase.
