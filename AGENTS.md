# Instrucciones para Agentes IA en este Proyecto

Este archivo contiene reglas para cualquier agente de IA (Codex, Claude, etc.) que trabaje en NeumorStudio.

> **Actualizado (2026-01-31):** estructura repo (template `unified`), notas del middleware/cache, seccion Personalizacion/Section Builder, alias business_type gym/store, migraciones 0001-0056.

## Estructura del Proyecto

```
neumor-plantillas/
├── apps/
│   ├── admin/          # Panel de administracion (Next.js 15)
│   │   └── src/app/api/  # APIs del backend (USAR ESTAS, no Supabase directo)
│   └── templates/      # Plantillas de sitios web (Astro)
│       ├── restaurant/
│       ├── repairs/
│       ├── gym/        # Entrenador personal
│       ├── salon/
│       ├── clinic/
│       ├── store/
│       └── unified/    # Template unificada (multi-vertical, uso interno)
├── packages/
│   ├── api-utils/      # Utilidades compartidas (CORS, rate-limit, validation)
│   ├── cli/            # Provisioning de clientes
│   ├── config/         # Config compartida (eslint, tailwind, ts)
│   ├── logger/         # Logger compartido
│   ├── n8n-templates/  # Automatizaciones
│   └── supabase/       # Migraciones y tipos de BD
│       └── migrations/ # Migraciones SQL (0001-0056)
└── supabase/           # Migraciones locales (Supabase CLI)
└── docs/               # Documentacion
    └── DATABASE.md     # Schema completo de la BD
```

## ⚠️ Reglas CRITICAS de Arquitectura

### NO duplicar funcionalidad
**ANTES de añadir codigo que guarde datos, VERIFICA:**
1. ¿Ya existe un endpoint API que hace esto? (`apps/admin/src/app/api/`)
2. ¿El formulario ya envia datos a algun sitio?
3. Si añades un nuevo metodo de guardado, ¿estas quitando el anterior?

**EJEMPLO DE ERROR GRAVE (no repetir):**
```javascript
// ❌ MAL: Añadir insert directo cuando ya existe webhook
if (supabaseUrl && supabaseKey) {
  await fetch(`${supabaseUrl}/rest/v1/bookings`, { method: "POST" }); // DUPLICADO!
}
if (webhookUrl) {
  await fetch(webhookUrl, { method: "POST" }); // Ya existia
}

// ✅ BIEN: Usar SOLO el endpoint API existente
if (webhookUrl) {
  await fetch(webhookUrl, { method: "POST", body: JSON.stringify(data) });
}
```

### Usar APIs del backend, NO Supabase directo desde frontend
| Accion | Endpoint correcto | NO hacer |
|--------|------------------|----------|
| Crear cita (salon/clinic) | `POST /api/citas` | `fetch(supabaseUrl/rest/v1/bookings)` |
| Crear reserva (restaurant) | `POST /api/reservas` | Insert directo |
| Crear presupuesto | `POST /api/presupuestos` | Insert directo |
| Subir imagen | `POST /api/upload` | Upload directo a storage |

**¿Por que?**
- El backend tiene validacion, rate-limiting, CORS
- Envia emails de confirmacion
- Registra en activity_log
- Usa service_role_key (seguro)
- Un solo punto de entrada = sin duplicados

### Antes de modificar formularios que envian datos
1. Buscar en el codigo `fetch(` o `webhookUrl` para ver a donde envia
2. Leer el endpoint API para entender que hace
3. Si necesitas añadir un campo, añadirlo al webhook data Y al endpoint API
4. NUNCA añadir un segundo metodo de guardado

## Reglas de Base de Datos

- **NO crear migraciones** sin autorizacion explicita
- **NO modificar tablas existentes** a menos que sea el objetivo
- Consultar `docs/DATABASE.md` antes de asumir estructura de tablas
- Si necesitas info de la BD, usar Supabase CLI: `npx supabase db dump`

## Reglas de Codigo

- **Respetar patrones existentes** - Mirar archivos similares antes de crear nuevos
- **NO crear archivos nuevos** si puedes modificar uno existente
- **NO instalar dependencias** sin justificacion
- Mantener cambios **minimos y acotados** al objetivo
- **NO duplicar logica** - buscar si ya existe antes de crear

## Plantillas (apps/templates/*)

- Cada plantilla tiene la misma estructura de componentes
- Los componentes tienen variantes: `Hero/HeroClassic.astro`, `Hero/HeroModern.astro`, etc.
- La configuracion viene de Supabase via `@lib/supabase.ts`
- **NO hardcodear datos** - todo debe venir de config o Supabase
- Los formularios envian a webhooks/APIs, **NO directamente a Supabase**
- `apps/templates/unified` renderiza multi-tenant y resuelve `subdomain`/`custom_domain` via middleware
- La cache del middleware dura ~60s; en preview (`?preview=1`) se omite la cache

### Componentes que envian datos (CUIDADO)
| Componente | Plantilla | Envia a |
|------------|-----------|---------|
| `AppointmentForm.astro` | salon, clinic | `/api/citas` via `webhookUrl` |
| `ReservationForm.astro` | restaurant | `/api/reservas` via `webhookUrl` |
| `ClassBookingForm.astro` | gym | `/api/entrenamientos` via `webhookUrl` |
| `ContactForm.astro` | store | `/api/contacto` via `webhookUrl` |
| `ContactForm.astro` | repairs | `/api/presupuestos` via `webhookUrl` |

## Admin (apps/admin)

- Next.js 15 con App Router
- Server Components por defecto, Client Components solo cuando sea necesario
- El sidebar se configura dinamicamente segun `business_type_config`
- Acciones del servidor en `src/lib/actions.ts`
- **APIs en `src/app/api/`** - SIEMPRE usar estas para operaciones de datos
- Personalizacion guarda en `websites.config` (no crear config paralela)
- Live preview usa `postMessage` + `data-content` en templates (no borrar esos atributos)

### Personalizacion y Section Builder
- `config.sectionsConfig` controla orden/visible/variant (ver `packages/supabase/src/sections-catalog.ts`)
- Textos por seccion viven en `websites.config`:
  - `reviewsTitle`, `reviewsSubtitle`
  - `teamTitle`, `teamSubtitle`
  - `galleryTitle`, `gallerySubtitle`, `galleryImages` (array de URLs)
  - `faqTitle`, `faqSubtitle`
  - `plansTitle`, `plansSubtitle`
  - `contactTitle`, `contactSubtitle`
- **Legacy:** algunos datos pueden existir en `config.content`. Las plantillas deben leer `config` + `config.content` (merge).

### APIs disponibles (usar estas desde templates)
```
/api/citas          - Crear citas (salon, clinic)
/api/reservas       - Crear reservas (restaurant)
/api/presupuestos   - Crear presupuestos (repairs)
/api/entrenamientos - Solicitudes de entrenamiento (gym)
/api/contacto       - Formularios de contacto
/api/newsletter     - Suscripciones newsletter
/api/upload         - Subir archivos
```

## Patrones a Seguir

### Nombrado
- Componentes: PascalCase (`BookingCard.tsx`)
- Archivos de pagina: `page.tsx` (Next.js) o `index.astro` (Astro)
- Migraciones: `0XXX_descripcion.sql`
- Tipos: sufijo con tipo (`BookingRow`, `CustomerInsert`)

### Imports
```typescript
// Orden: externos, internos (@/), relativos
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/Button";
import { formatDate } from "./utils";
```

### Componentes React/Astro
```typescript
// Props tipadas siempre
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  // ...
}
```

## Antes de Hacer Cambios

1. **Leer archivos relacionados** para entender el patron actual
2. **Verificar que no existe** algo similar que puedas reutilizar
3. **Buscar si hay un endpoint API** para la operacion
4. **Preguntar si hay dudas** sobre el enfoque correcto
5. **Probar localmente** antes de confirmar que funciona

## Archivos Clave de Referencia

| Archivo | Descripcion |
|---------|-------------|
| `docs/DATABASE.md` | Schema completo de la BD |
| `apps/admin/src/app/api/citas/route.ts` | API para crear citas |
| `apps/admin/src/app/api/reservas/route.ts` | API para crear reservas |
| `apps/admin/src/app/dashboard/layout.tsx` | Layout del admin con config dinamica |
| `apps/admin/src/app/dashboard/Sidebar.tsx` | Navegacion segun tipo de negocio |
| `apps/templates/salon/src/components/AppointmentForm.astro` | Ejemplo de formulario que usa API |
| `apps/templates/gym/src/components/ClassBookingForm.astro` | Formulario multipaso (gym) |
| `packages/supabase/migrations/` | Todas las migraciones de BD |

## Tipos de Negocio Soportados

| Tipo | Plantilla | Secciones Admin |
|------|-----------|-----------------|
| `restaurant` | restaurant | reservas, newsletter, clientes |
| `repairs` | repairs | presupuestos, trabajos, pagos, clientes |
| `fitness` | gym | sesiones, progreso, paquetes, servicios, pagos |
| `salon` | salon | reservas, profesionales, servicios, clientes |
| `clinic` | clinic | reservas, newsletter, clientes |
| `shop` | store | newsletter, clientes |

**Nota:** la BD permite `gym` y `store` como alias, pero el admin y las configs usan `fitness` y `shop`.

## Comandos Utiles

```bash
# Desarrollo
pnpm dev                    # Iniciar todos los proyectos
pnpm dev --filter admin     # Solo el admin
pnpm dev --filter restaurant # Solo plantilla restaurant

# Build
pnpm build                  # Build de todo
pnpm typecheck              # Verificar tipos

# Supabase
npx supabase db diff        # Ver cambios pendientes
npx supabase db push        # Aplicar migraciones
```

## Carpetas generadas (ruido, evitar tocar)

- `**/node_modules/`
- `**/dist/`
- `**/.astro/`
- `**/.turbo/`
- `**/.vercel/`

## ❌ Errores Comunes a Evitar

### Arquitectura
- **NO añadir inserts directos a Supabase desde frontend** - usar APIs
- **NO duplicar metodos de guardado** - verificar que no existe ya
- **NO crear endpoints nuevos** si ya existe uno que hace lo mismo

### Codigo
- No usar `"use client"` en componentes que no lo necesitan
- No olvidar `revalidatePath()` despues de mutaciones
- No asumir que las columnas existen sin verificar el schema
- No crear componentes duplicados - buscar primero en `apps/admin/src/components/ui` y componentes existentes en templates
- No hardcodear URLs - usar variables de entorno

### Formularios
- **NO añadir `fetch()` adicionales** sin verificar los existentes
- Si un formulario ya tiene `webhookUrl`, USAR ESE
- Si necesitas añadir un campo, añadirlo al data que se envia al webhook

---

> **Ante la duda, preguntar.** Es mejor confirmar el enfoque que romper algo existente.

> **Si vas a tocar un formulario que envia datos: LEE PRIMERO todo el handler de submit.**
