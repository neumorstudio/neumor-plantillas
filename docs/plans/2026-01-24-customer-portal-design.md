# Portal de Clientes - Documento de Diseño

**Fecha:** 2026-01-24
**Estado:** Aprobado
**Plantillas:** gym, salon

## Resumen

Sistema de login para clientes finales en las plantillas gym y salon, permitiendo acceder a su información personal mediante autenticación con Google.

## Decisiones de Diseño

### Funcionalidades
- Ver historial de reservas/sesiones
- Ver progreso (solo gym): métricas, medidas, evolución
- Ver/gestionar paquetes: sesiones disponibles, vencimientos
- Editar perfil: nombre, teléfono, dirección
- Ver historial de pagos/facturas
- **NO** crear nuevas reservas (se hace por formulario público o el negocio)

### Ubicación
- Ruta `/mi-cuenta` dentro de cada plantilla (mismo dominio, mismo deploy)

### Autenticación
- Login con Google via Supabase Auth
- Vinculación automática por email:
  - Si existe customer con mismo email → se vincula
  - Si no existe → se crea nuevo customer con datos de Google
- Campos al crear: name (Google), email (Google), phone/address = NULL (opcional completar después)

## Arquitectura

### Estructura de Rutas
```
/mi-cuenta              → Login (si no autenticado) o redirect a /mi-cuenta/inicio
/mi-cuenta/inicio       → Dashboard del cliente (resumen)
/mi-cuenta/reservas     → Historial de citas/sesiones
/mi-cuenta/progreso     → Solo gym: métricas y evolución
/mi-cuenta/paquetes     → Sesiones disponibles, vencimientos
/mi-cuenta/perfil       → Editar datos personales
/mi-cuenta/pagos        → Historial de pagos/facturas
/mi-cuenta/callback     → Callback de OAuth
```

### Cambios en Base de Datos

```sql
-- 0028_customer_auth.sql
ALTER TABLE customers
  ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_customers_website_auth
  ON customers(website_id, auth_user_id)
  WHERE auth_user_id IS NOT NULL;

-- RLS: cliente puede ver/editar su propio registro
CREATE POLICY "Customers can view own data"
  ON customers FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Customers can update own profile"
  ON customers FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Políticas para tablas relacionadas (bookings, sessions, payments, etc.)
-- Los clientes solo pueden ver sus propios registros
```

### Archivos a Crear (por plantilla)

```
apps/templates/gym/
├── src/
│   ├── pages/
│   │   └── mi-cuenta/
│   │       ├── index.astro          → Login page
│   │       ├── inicio.astro         → Dashboard cliente
│   │       ├── reservas.astro       → Historial citas/sesiones
│   │       ├── progreso.astro       → Solo gym
│   │       ├── paquetes.astro       → Paquetes/sesiones
│   │       ├── perfil.astro         → Editar datos
│   │       ├── pagos.astro          → Historial pagos
│   │       └── callback.astro       → OAuth callback
│   │
│   ├── layouts/
│   │   └── PortalLayout.astro       → Layout del portal cliente
│   │
│   └── components/
│       └── portal/
│           ├── BottomNav.astro      → Navegación inferior mobile
│           ├── PortalHeader.astro   → Header con avatar/logout
│           └── GoogleLoginButton.astro
│
│   └── lib/
│       └── supabase-portal.ts       → Cliente Supabase para portal
```

### Flujo de Autenticación

```
1. Usuario visita /mi-cuenta
2. Si no autenticado → muestra página login con botón Google
3. Click en "Continuar con Google" → OAuth flow
4. Callback recibe tokens → Supabase crea/recupera auth.user
5. Buscar en customers WHERE email = google_email AND website_id = current
6. Si existe → UPDATE auth_user_id = user.id
7. Si no existe → INSERT nuevo customer con datos de Google
8. Redirect a /mi-cuenta/inicio
```

### UI/UX

**Layout mobile-first:**
```
┌─────────────────────────────────────┐
│  Header: Logo negocio + Avatar/Menu │
├─────────────────────────────────────┤
│                                     │
│  Contenido de la página actual      │
│                                     │
├─────────────────────────────────────┤
│  Bottom Nav (mobile):               │
│  [Inicio] [Citas] [Perfil]          │
│  + [Progreso] [Paquetes] en gym     │
└─────────────────────────────────────┘
```

**Navegación por tipo de negocio:**
- **Gym**: Inicio, Sesiones, Progreso, Paquetes, Perfil
- **Salon**: Inicio, Citas, Paquetes, Perfil

### Variables de Entorno

Cada plantilla necesitará:
```env
PUBLIC_SUPABASE_URL=https://jekrqkdvgcwruhghtgkj.supabase.co
PUBLIC_SUPABASE_ANON_KEY=...
PUBLIC_WEBSITE_ID=...  # UUID del website en la BD
```

## Plan de Implementación

### Fase 1: Base de datos
1. Crear migración 0028_customer_auth.sql
2. Aplicar migración en Supabase

### Fase 2: Infraestructura auth
3. Crear lib/supabase-portal.ts
4. Crear middleware de autenticación para /mi-cuenta/*

### Fase 3: Páginas de auth
5. Crear /mi-cuenta/index.astro (login)
6. Crear /mi-cuenta/callback.astro

### Fase 4: Layout y componentes
7. Crear PortalLayout.astro
8. Crear PortalHeader.astro
9. Crear BottomNav.astro
10. Crear GoogleLoginButton.astro

### Fase 5: Páginas del portal
11. /mi-cuenta/inicio.astro
12. /mi-cuenta/reservas.astro
13. /mi-cuenta/progreso.astro (solo gym)
14. /mi-cuenta/paquetes.astro
15. /mi-cuenta/perfil.astro
16. /mi-cuenta/pagos.astro

### Fase 6: Testing
17. Probar flujo completo de auth
18. Probar vinculación de customer existente
19. Probar creación de nuevo customer
