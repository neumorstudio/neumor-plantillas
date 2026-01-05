# NeumorStudio - Guia Completa

## Indice

1. [Que es NeumorStudio](#que-es-neumorstudio)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Tecnologias Utilizadas](#tecnologias-utilizadas)
4. [Como Funciona Todo](#como-funciona-todo)
5. [Configuracion Inicial](#configuracion-inicial)
6. [Flujo de Trabajo con un Cliente](#flujo-de-trabajo-con-un-cliente)
7. [Guia de Desarrollo](#guia-de-desarrollo)
8. [Mejoras Futuras](#mejoras-futuras)
9. [Preguntas Frecuentes](#preguntas-frecuentes)   edwin mamawebo




---

## Que es NeumorStudio

### Explicacion Simple

NeumorStudio es una empresa que vende paginas web con un estilo visual especial llamado "neumorfismo" (botones y tarjetas que parecen salir de la pantalla con sombras suaves). Pero no solo vendemos webs bonitas - tambien incluimos **automatizaciones** que hacen la vida mas facil al cliente.

**Ejemplo real**: Un restaurante contrata NeumorStudio. Nosotros le entregamos:
- Una web donde sus clientes pueden hacer reservas
- Un panel donde el restaurante ve todas las reservas
- Automatizaciones que envian WhatsApp/email de confirmacion automaticamente

El restaurante NO toca la web. Solo usa el panel para ver sus reservas y activar/desactivar notificaciones.

### Explicacion Tecnica

NeumorStudio es un sistema SaaS multi-tenant basado en:
- **Plantillas estaticas** (Astro) para las webs publicas de clientes
- **Panel de administracion** (Next.js) para gestion de automatizaciones
- **Backend serverless** (Supabase) para base de datos y autenticacion
- **Motor de automatizacion** (n8n) para workflows de notificaciones

El modelo de negocio se basa en personalizar plantillas pre-construidas y configurar automatizaciones, reduciendo drasticamente el tiempo de entrega.

---

## Arquitectura del Proyecto

### Vista General (Para Novatos)

Imagina el proyecto como una fabrica con diferentes departamentos:

```
NeumorStudio/
│
├── apps/                    # Los "productos finales"
│   ├── admin/              # El panel que usan los clientes
│   └── templates/          # Las webs que entregamos
│       └── restaurant/     # Plantilla de restaurante
│
└── packages/               # Las "piezas reutilizables"
    ├── config/             # Configuraciones compartidas
    │   └── tailwind/       # Los estilos neumorfico
    ├── supabase/           # Todo lo de base de datos
    └── n8n-templates/      # Las automatizaciones
```

### Vista Tecnica (Para Desarrolladores)

```
NeumorStudio/
├── apps/
│   ├── admin/                          # Next.js 15 App Router
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx          # Layout raiz con fuentes
│   │   │   │   ├── page.tsx            # Redirect a /login
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx        # Client Component - Auth UI
│   │   │   │   └── dashboard/
│   │   │   │       ├── layout.tsx      # Client Component - Sidebar
│   │   │   │       ├── page.tsx        # Server Component - Stats
│   │   │   │       ├── reservas/
│   │   │   │       ├── leads/
│   │   │   │       └── configuracion/
│   │   │   └── lib/
│   │   │       ├── supabase.ts         # Cliente browser
│   │   │       └── actions.ts          # Server Actions
│   │   ├── next.config.ts
│   │   ├── postcss.config.mjs
│   │   └── tsconfig.json
│   │
│   └── templates/
│       └── restaurant/                  # Astro 5
│           ├── src/
│           │   ├── pages/
│           │   │   └── index.astro     # Pagina principal
│           │   ├── components/
│           │   │   ├── Header.astro
│           │   │   ├── Hero.astro      # Con efectos 3D
│           │   │   ├── Features.astro
│           │   │   ├── ReservationForm.astro
│           │   │   └── Footer.astro
│           │   ├── layouts/
│           │   │   └── Layout.astro
│           │   └── styles/
│           │       └── global.css
│           └── astro.config.mjs
│
├── packages/
│   ├── config/
│   │   ├── tailwind/
│   │   │   ├── neumorphic.css          # Sistema de diseno completo
│   │   │   └── package.json
│   │   ├── typescript/
│   │   └── eslint/
│   │
│   ├── supabase/
│   │   ├── src/
│   │   │   ├── index.ts                # Exports
│   │   │   └── types.ts                # Tipos TypeScript
│   │   ├── migrations/
│   │   │   ├── 0001_initial_schema.sql
│   │   │   └── 0002_rls_policies.sql
│   │   └── package.json
│   │
│   ├── n8n-templates/
│   │   └── workflows/
│   │       ├── restaurant-booking.json
│   │       ├── lead-capture.json
│   │       └── booking-reminder.json
│   │
│   └── ui/                             # Componentes compartidos (futuro)
│
├── turbo.json                          # Configuracion Turborepo
├── pnpm-workspace.yaml                 # Workspaces de pnpm
├── package.json
└── CLAUDE.md                           # Documentacion tecnica
```

---

## Tecnologias Utilizadas

### Para Novatos: Que Hace Cada Cosa

| Tecnologia | Que Es | Para Que Lo Usamos |
|------------|--------|-------------------|
| **Astro** | Un creador de webs super rapidas | Las webs de los clientes (restaurantes, etc) |
| **Next.js** | Un framework para apps web | El panel de administracion |
| **Tailwind CSS** | Una forma rapida de dar estilos | Todos los estilos visuales |
| **Supabase** | Una base de datos en la nube | Guardar reservas, leads, usuarios |
| **n8n** | Un automatizador visual | Enviar WhatsApp, emails automaticos |
| **Turborepo** | Un organizador de proyectos | Mantener todo ordenado |
| **pnpm** | Un instalador de paquetes | Instalar las dependencias |

### Para Desarrolladores: Stack Tecnico

| Componente | Tecnologia | Version | Justificacion |
|------------|------------|---------|---------------|
| Webs publicas | Astro | 5.x | SSG por defecto, 0 JS innecesario, SEO perfecto |
| Panel admin | Next.js | 15.x | App Router, Server Components, Server Actions |
| Estilos | Tailwind CSS | 4.x | Plugin Vite nativo, CSS-first config |
| Base de datos | Supabase | Latest | PostgreSQL, Auth integrada, RLS, Realtime |
| Automatizacion | n8n | Latest | Self-hosted, visual, webhooks nativos |
| Monorepo | Turborepo | Latest | Cache inteligente, builds paralelos |
| Package Manager | pnpm | 10.x | Workspaces, instalacion rapida, ahorro de disco |

---

## Como Funciona Todo

### El Flujo Completo (Explicacion Visual)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENTE FINAL                                │
│                   (persona que reserva mesa)                        │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     WEB DEL RESTAURANTE                             │
│                        (Astro)                                      │
│                                                                     │
│   [Hero con efectos 3D] [Menu] [Galeria] [Formulario Reserva]      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ POST /webhook/booking
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           n8n                                       │
│                   (Motor de Automatizacion)                         │
│                                                                     │
│   1. Recibe datos ──► 2. Guarda en DB ──► 3. Envia notificaciones │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌─────────┐ ┌─────────┐ ┌─────────┐
              │Supabase │ │  Email  │ │WhatsApp │
              │   DB    │ │  SMTP   │ │   API   │
              └─────────┘ └─────────┘ └─────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PANEL DE ADMIN                                   │
│                      (Next.js)                                      │
│                                                                     │
│   [Dashboard] [Reservas] [Leads] [Configuracion]                   │
│                                                                     │
│   El dueno del restaurante ve aqui sus reservas y                  │
│   puede activar/desactivar notificaciones                          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                │ Usado por
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLIENTE NEUMORSTUDIO                             │
│                (dueno del restaurante)                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Flujo de una Reserva (Paso a Paso)

1. **Usuario llena formulario** en la web del restaurante
2. **Formulario envia datos** al webhook de n8n
3. **n8n ejecuta el workflow**:
   - Guarda la reserva en Supabase (tabla `bookings`)
   - Consulta si el restaurante tiene notificaciones activas
   - Si tiene email activo → envia confirmacion por email
   - Si tiene WhatsApp activo → envia mensaje de WhatsApp
   - Registra la actividad en `activity_log`
4. **Restaurante ve la reserva** en su panel de admin
5. **Restaurante confirma/cancela** desde el panel
6. **(Opcional) 24h antes** → n8n envia recordatorio automatico

---

## Configuracion Inicial

### Paso 1: Requisitos Previos

```bash
# Necesitas tener instalado:
- Node.js 18+ (recomendado 20 LTS)
- pnpm (npm install -g pnpm)
- Git

# Cuentas necesarias:
- Supabase (gratis para empezar): https://supabase.com
- n8n (self-hosted o cloud): https://n8n.io
```

### Paso 2: Clonar e Instalar

```bash
# Clonar el repositorio
git clone <tu-repo> NeumorStudio
cd NeumorStudio

# Instalar dependencias
pnpm install
```

### Paso 3: Configurar Supabase

1. **Crear proyecto en Supabase**
   - Ve a https://supabase.com y crea un nuevo proyecto
   - Anota la URL y la ANON KEY

2. **Ejecutar migraciones**
   ```bash
   # Opcion A: Desde el SQL Editor de Supabase
   # Copia y pega el contenido de:
   # - packages/supabase/migrations/0001_initial_schema.sql
   # - packages/supabase/migrations/0002_rls_policies.sql

   # Opcion B: Usando Supabase CLI
   supabase db push
   ```

3. **Crear archivo .env**
   ```bash
   # En la raiz del proyecto, crea .env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
   ```

### Paso 4: Configurar n8n

1. **Instalar n8n** (si es self-hosted)
   ```bash
   # Con Docker
   docker run -d --name n8n -p 5678:5678 n8nio/n8n

   # O con npm
   npm install -g n8n
   n8n start
   ```

2. **Importar workflows**
   - Abre n8n en http://localhost:5678
   - Ve a "Workflows" → "Import from File"
   - Importa los archivos de `packages/n8n-templates/workflows/`

3. **Configurar credenciales en n8n**
   - Supabase: URL + Service Role Key
   - SMTP: Tu servidor de email
   - WhatsApp: API de tu proveedor

### Paso 5: Probar Localmente

```bash
# Iniciar todo el proyecto
pnpm dev

# O iniciar solo una parte:
pnpm --filter=@neumorstudio/admin dev          # Panel admin en :3001
pnpm --filter=@neumorstudio/template-restaurant dev  # Web restaurante en :4321
```

---

## Flujo de Trabajo con un Cliente

### Fase 1: Venta y Onboarding (Dia 1)

```
┌────────────────────────────────────────────────────────────────┐
│                    REUNION CON CLIENTE                         │
│                                                                │
│  1. Mostrar demos de las plantillas                           │
│  2. Elegir nicho (restaurante, clinica, etc)                  │
│  3. Elegir tema visual (dark, light, colorful, rustic, elegant)│
│  4. Definir que automatizaciones necesita:                    │
│     □ Reservas con confirmacion email                         │
│     □ Reservas con confirmacion WhatsApp                      │
│     □ Recordatorios 24h antes                                 │
│     □ Notificacion de nuevos leads                            │
│  5. Recopilar contenido:                                      │
│     - Logo                                                    │
│     - Textos (nombre, descripcion, horarios)                  │
│     - Fotos (local, platos, equipo)                          │
│     - Informacion de contacto                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Fase 2: Configuracion Interna (Dia 1-2)

```bash
# 1. Crear entrada en base de datos
INSERT INTO clients (email, business_name, business_type, phone)
VALUES ('restaurante@ejemplo.com', 'La Trattoria', 'restaurant', '+34612345678');

# 2. Crear website asociada
INSERT INTO websites (client_id, domain, theme)
VALUES ('<client_id>', 'latrattoria.neumorstudio.com', 'rustic');

# 3. Crear configuracion de notificaciones
INSERT INTO notification_settings (website_id, email_booking_confirmation, whatsapp_booking_confirmation)
VALUES ('<website_id>', true, true);
```

### Fase 3: Personalizacion de Plantilla (Dia 2-3)

```javascript
// apps/templates/restaurant/src/pages/index.astro

// Modificar el objeto config con los datos del cliente:
const config = {
  restaurantName: "La Trattoria",
  tagline: "Autentica cocina italiana desde 1985",
  theme: "rustic",
  heroTitle: "Sabores de Italia en tu mesa",
  heroSubtitle: "Reserva tu experiencia gastronomica",
  features: [
    { icon: "utensils", title: "Menu Degustacion", description: "..." },
    // ...
  ],
  contact: {
    phone: "+34 612 345 678",
    email: "reservas@latrattoria.com",
    address: "Calle Principal 123, Madrid"
  },
  webhookUrl: "https://tu-instancia-n8n.com/webhook/latrattoria-booking"
};
```

### Fase 4: Configuracion de Automatizaciones (Dia 3)

1. **Duplicar workflow base** en n8n
2. **Personalizar**:
   - Webhook URL unico para el cliente
   - Textos de emails/WhatsApp con nombre del negocio
   - Logo en plantillas de email
3. **Activar workflow**
4. **Probar** haciendo una reserva de prueba

### Fase 5: Deploy y Entrega (Dia 4)

```bash
# 1. Build de la plantilla personalizada
pnpm --filter=@neumorstudio/template-restaurant build

# 2. Deploy a Vercel/Netlify
# (configurar dominio del cliente o subdominio)

# 3. Crear usuario en Supabase Auth para el cliente
# (para acceder al panel de admin)

# 4. Enviar credenciales al cliente:
# - URL del panel: https://admin.neumorstudio.com
# - Email y contrasena temporal
```

### Fase 6: Formacion al Cliente (Dia 5)

```
┌────────────────────────────────────────────────────────────────┐
│                    SESION DE FORMACION                         │
│                      (30-60 minutos)                           │
│                                                                │
│  1. Acceso al panel                                           │
│     - Como iniciar sesion                                     │
│     - Cambiar contrasena                                      │
│                                                                │
│  2. Dashboard                                                  │
│     - Explicar las metricas                                   │
│     - Ver actividad reciente                                  │
│                                                                │
│  3. Gestion de Reservas                                       │
│     - Ver listado de reservas                                 │
│     - Filtrar por estado                                      │
│     - Confirmar/Cancelar reservas                             │
│     - Enviar recordatorios manuales                           │
│                                                                │
│  4. Gestion de Leads                                          │
│     - Ver contactos recibidos                                 │
│     - Marcar como contactado                                  │
│     - Convertir lead a reserva                                │
│                                                                │
│  5. Configuracion                                             │
│     - Activar/desactivar notificaciones                       │
│     - Cambiar hora de recordatorios                           │
│                                                                │
│  6. Soporte                                                   │
│     - Como contactar para problemas                           │
│     - Que incluye el servicio                                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Timeline Resumen

| Dia | Actividad | Responsable |
|-----|-----------|-------------|
| 1 | Reunion + recopilar contenido | Comercial |
| 1-2 | Configurar DB + n8n | Desarrollador |
| 2-3 | Personalizar plantilla | Desarrollador |
| 3 | Configurar automatizaciones | Desarrollador |
| 4 | Deploy + pruebas | Desarrollador |
| 5 | Formacion cliente | Soporte |

---

## Guia de Desarrollo

### Comandos Utiles

```bash
# Desarrollo
pnpm dev                                    # Todo el monorepo
pnpm --filter=@neumorstudio/admin dev       # Solo admin
pnpm --filter=@neumorstudio/template-restaurant dev  # Solo restaurante

# Build
pnpm build                                  # Todo
pnpm --filter=@neumorstudio/admin build     # Solo admin

# Linting
pnpm lint
pnpm type-check

# Agregar dependencia
pnpm add <paquete> --filter=@neumorstudio/admin
pnpm add <paquete> --filter=@neumorstudio/ui -D  # Como devDependency

# Agregar paquete interno como dependencia
pnpm add @neumorstudio/ui --filter=@neumorstudio/admin --workspace
```

### Estructura de un Componente Neumorfico

```css
/* Clases disponibles en neumorphic.css */

.neumor-card        /* Tarjeta con sombra elevada */
.neumor-card-sm     /* Tarjeta pequena */
.neumor-inset       /* Elemento hundido */
.neumor-btn         /* Boton base */
.neumor-btn-accent  /* Boton con color accent */
.neumor-input       /* Input de formulario */
```

### Agregar un Nuevo Nicho (ej: Gimnasio)

1. **Duplicar plantilla existente**
   ```bash
   cp -r apps/templates/restaurant apps/templates/fitness
   ```

2. **Actualizar package.json**
   ```json
   {
     "name": "@neumorstudio/template-fitness",
     ...
   }
   ```

3. **Personalizar componentes**
   - Cambiar iconos relevantes
   - Adaptar formulario (clases en vez de reservas)
   - Ajustar textos de ejemplo

4. **Crear workflow n8n**
   - Duplicar `restaurant-booking.json`
   - Adaptar campos (instructor, tipo de clase, etc)

### Agregar un Nuevo Tema Visual

```css
/* packages/config/tailwind/neumorphic.css */

/* Agregar despues de los temas existentes */
[data-theme="tropical"] {
  --neumor-bg: oklch(0.95 0.05 180);
  --shadow-light: oklch(1 0 0);
  --shadow-dark: oklch(0.85 0.05 180);
  --text-primary: oklch(0.2 0.02 180);
  --text-secondary: oklch(0.5 0.02 180);
  --accent: oklch(0.7 0.2 150);
  --accent-rgb: 80, 200, 120;
}
```

---

## Mejoras Futuras

### Corto Plazo (1-2 meses)

| Mejora | Dificultad | Impacto | Descripcion |
|--------|-----------|---------|-------------|
| **Autenticacion real** | Media | Alto | Implementar login con Supabase Auth |
| **Dashboard con datos reales** | Media | Alto | Conectar stats del dashboard a Supabase |
| **Mas plantillas** | Baja | Alto | Crear clinic, salon, shop, fitness, realestate |
| **Preview de temas** | Baja | Medio | Selector de tema en vivo en las plantillas |
| **Notificaciones push** | Media | Medio | Alertas en el panel cuando hay nuevas reservas |

### Medio Plazo (3-6 meses)

| Mejora | Dificultad | Impacto | Descripcion |
|--------|-----------|---------|-------------|
| **Multi-idioma** | Media | Alto | Soporte para ES/EN/FR en plantillas |
| **Editor visual** | Alta | Muy Alto | Drag & drop para personalizar plantillas |
| **Integracion calendario** | Media | Alto | Sync con Google Calendar |
| **Pagos online** | Alta | Alto | Stripe para reservas con senal |
| **App movil** | Alta | Medio | React Native para el panel admin |

### Largo Plazo (6-12 meses)

| Mejora | Dificultad | Impacto | Descripcion |
|--------|-----------|---------|-------------|
| **IA para leads** | Alta | Alto | Clasificacion automatica de leads por calidad |
| **Chatbot** | Alta | Alto | Bot de WhatsApp/web para resolver dudas |
| **Analytics avanzado** | Media | Medio | Dashboards con graficos de conversion |
| **API publica** | Media | Medio | Permitir integraciones de terceros |
| **White-label** | Alta | Alto | Permitir que otros revendan las plantillas |

### Mejoras Tecnicas Recomendadas

```typescript
// 1. GENERAR TIPOS DE SUPABASE AUTOMATICAMENTE
// En vez de mantener types.ts manual:
npx supabase gen types typescript --project-id <tu-proyecto> > packages/supabase/src/database.types.ts

// 2. TESTS E2E
// Agregar Playwright para probar flujos criticos
pnpm add -D @playwright/test --filter=@neumorstudio/admin

// 3. STORYBOOK PARA UI
// Documentar componentes visuales
pnpm add -D storybook --filter=@neumorstudio/ui

// 4. CI/CD
// GitHub Actions para builds automaticos
// .github/workflows/ci.yml

// 5. MONITORING
// Agregar Sentry para errores en produccion
pnpm add @sentry/nextjs --filter=@neumorstudio/admin
```

---

## Preguntas Frecuentes

### Para el Equipo

**P: ¿Como agrego un nuevo campo a las reservas?**
1. Modificar migracion SQL (agregar columna a `bookings`)
2. Actualizar `types.ts` en el paquete supabase
3. Actualizar formulario en la plantilla
4. Actualizar workflow de n8n
5. Actualizar vista de reservas en admin

**P: ¿Como cambio los colores de un tema?**
Edita `packages/config/tailwind/neumorphic.css` y modifica las variables CSS del tema correspondiente.

**P: ¿Como pruebo las automatizaciones sin afectar produccion?**
Usa un proyecto de Supabase separado para desarrollo y configura n8n con credenciales de ese proyecto.

**P: ¿Como hago deploy de una plantilla?**
```bash
pnpm --filter=@neumorstudio/template-restaurant build
# Subir contenido de dist/ a Vercel/Netlify/tu-hosting
```

### Para Clientes

**P: ¿Puedo cambiar los textos de mi web?**
No directamente. Contacta con NeumorStudio y haremos los cambios por ti.

**P: ¿Puedo desactivar las notificaciones de WhatsApp?**
Si, desde Configuracion en tu panel de admin.

**P: ¿Donde veo mis reservas antiguas?**
En la seccion Reservas puedes filtrar por estado y fecha.

**P: ¿Que pasa si un cliente cancela?**
Puedes marcar la reserva como "Cancelada" desde el panel. No se envia notificacion automatica de cancelacion (por ahora).

---

## Contacto y Soporte

- **Documentacion tecnica**: Ver `CLAUDE.md` en la raiz del proyecto
- **Issues y bugs**: Crear issue en el repositorio
- **Soporte cliente**: soporte@neumorstudio.com

---

*Documento generado para NeumorStudio v0.1.0*
*Ultima actualizacion: Diciembre 2024*
