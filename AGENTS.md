# Instrucciones para Agentes IA en este Proyecto

Este archivo contiene reglas para cualquier agente de IA (Codex, Claude, etc.) que trabaje en NeumorStudio.

## Estructura del Proyecto

```
neumor-plantillas/
├── apps/
│   ├── admin/          # Panel de administracion (Next.js 15)
│   └── templates/      # Plantillas de sitios web (Astro)
│       ├── restaurant/
│       ├── repairs/
│       ├── gym/        # Entrenador personal
│       ├── salon/
│       ├── clinic/
│       └── store/
├── packages/
│   ├── supabase/       # Migraciones y tipos de BD
│   │   └── migrations/ # Migraciones SQL (0001-0027)
│   └── ui/             # Componentes compartidos
└── docs/               # Documentacion
    └── DATABASE.md     # Schema completo de la BD
```

## Reglas Criticas

### Base de Datos
- **NO crear migraciones** sin autorizacion explicita
- **NO modificar tablas existentes** a menos que sea el objetivo
- Consultar `docs/DATABASE.md` antes de asumir estructura de tablas
- Si necesitas info de la BD, usar Supabase CLI: `npx supabase db dump`

### Codigo
- **Respetar patrones existentes** - Mirar archivos similares antes de crear nuevos
- **NO crear archivos nuevos** si puedes modificar uno existente
- **NO instalar dependencias** sin justificacion
- Mantener cambios **minimos y acotados** al objetivo

### Plantillas (apps/templates/*)
- Cada plantilla tiene la misma estructura de componentes
- Los componentes tienen variantes: `Hero/HeroClassic.astro`, `Hero/HeroModern.astro`, etc.
- La configuracion viene de Supabase via `@lib/supabase.ts`
- **NO hardcodear datos** - todo debe venir de config o Supabase

### Admin (apps/admin)
- Next.js 15 con App Router
- Server Components por defecto, Client Components solo cuando sea necesario
- El sidebar se configura dinamicamente segun `business_type_config`
- Acciones del servidor en `src/lib/actions.ts`

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
3. **Preguntar si hay dudas** sobre el enfoque correcto
4. **Probar localmente** antes de confirmar que funciona

## Archivos Clave de Referencia

| Archivo | Descripcion |
|---------|-------------|
| `docs/DATABASE.md` | Schema completo de la BD |
| `apps/admin/src/app/dashboard/layout.tsx` | Layout del admin con config dinamica |
| `apps/admin/src/app/dashboard/Sidebar.tsx` | Navegacion segun tipo de negocio |
| `apps/templates/restaurant/src/pages/index.astro` | Ejemplo de plantilla completa |
| `packages/supabase/migrations/` | Todas las migraciones de BD |

## Tipos de Negocio Soportados

| Tipo | Plantilla | Secciones Admin |
|------|-----------|-----------------|
| `restaurant` | restaurant | reservas, newsletter, clientes |
| `repairs` | repairs | presupuestos, trabajos, pagos, clientes |
| `fitness` | gym | sesiones, progreso, paquetes, servicios, pagos |
| `salon` | salon | reservas, newsletter, clientes |
| `clinic` | clinic | reservas, newsletter, clientes |
| `shop` | store | newsletter, clientes |

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

## Errores Comunes a Evitar

- No usar `"use client"` en componentes que no lo necesitan
- No olvidar `revalidatePath()` despues de mutaciones
- No asumir que las columnas existen sin verificar el schema
- No crear componentes duplicados - buscar primero en `packages/ui`
- No hardcodear URLs - usar variables de entorno

---

> **Ante la duda, preguntar.** Es mejor confirmar el enfoque que romper algo existente.
