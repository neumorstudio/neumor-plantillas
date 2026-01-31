# Plan: Plantillas Radicalmente Diferentes

## Objetivo
Crear plantillas que se sientan como **webs completamente diferentes**, no solo variaciones de color/fuente.

---

## FASE 1: Nuevas Variantes de Hero

### 1.1 Hero "Fullscreen" (NUEVO)
**Archivo:** `apps/templates/salon/src/components/Hero/HeroFullscreen.astro`

**Características:**
- Imagen de fondo 100vh (toda la pantalla)
- Overlay oscuro con gradiente (70% opacidad)
- Logo/nombre centrado con tipografía GIGANTE
- Subtítulo debajo
- Scroll indicator animado (flecha abajo)
- Sin tarjetas ni elementos flotantes
- CTA "Reservar" en la parte inferior

**Diferencia visual:** Impacto máximo, sensación cinematográfica, ideal para Luxury/Premium

### 1.2 Hero "Split" (NUEVO)
**Archivo:** `apps/templates/salon/src/components/Hero/HeroSplit.astro`

**Características:**
- Pantalla dividida 50/50 (móvil: apilado)
- Izquierda: Imagen de fondo completa
- Derecha: Fondo sólido con texto alineado izquierda
- Tipografía muy grande y bold
- CTA grande y prominente
- Sin elementos decorativos

**Diferencia visual:** Moderno, editorial, ideal para Magazine/Corporate

---

## FASE 2: Actualizar Catálogo de Secciones

**Archivo:** `packages/supabase/src/sections-catalog.ts`

Añadir las nuevas variantes al catálogo:
```typescript
hero: {
  variants: [
    { value: "classic", label: "Clásico" },
    { value: "modern", label: "Moderno" },
    { value: "bold", label: "Impactante" },
    { value: "minimal", label: "Minimalista" },
    { value: "fullscreen", label: "Pantalla Completa" },  // NUEVO
    { value: "split", label: "Dividido" },                // NUEVO
  ]
}
```

---

## FASE 3: 5 Nuevos Presets Radicales

### Preset 1: "Dark Elegance"
**Concepto:** Hotel boutique / Restaurante fine dining

| Aspecto | Valor |
|---------|-------|
| Hero | **fullscreen** (nuevo) |
| Theme | midnight |
| Skin | glass |
| Colors | Dorado `#c9a227` sobre negro |
| Typography | Playfair Display + Cormorant (serif elegante) |
| Font Scale | 1.5 (títulos enormes) |
| Effects | Glassmorphism ON, shadows 30%, radius soft |
| Services | list (elegante, sin cards) |
| Features | icons |
| Reviews | minimal |
| Footer | centered |

**Por qué es diferente:** Fondo oscuro total, tipografía serif dorada enorme, glassmorphism crea profundidad, sensación de exclusividad.

---

### Preset 2: "Bold Energy"
**Concepto:** Gym / Entrenador personal / CrossFit

| Aspecto | Valor |
|---------|-------|
| Hero | **split** (nuevo) |
| Theme | dark |
| Skin | brutalist |
| Colors | Lima neón `#84cc16` + Blanco |
| Typography | Oswald + Inter (bold sans) |
| Font Scale | 1.414 (títulos grandes) |
| Effects | Shadows 100%, radius sharp, NO glassmorphism |
| Services | grid (compacto, muchas opciones) |
| Features | banner (denso) |
| Reviews | grid |
| Footer | minimal |

**Por qué es diferente:** Alto contraste, bordes duros, colores neón sobre negro, tipografía condensada, sensación de energía y fuerza.

---

### Preset 3: "Pure Minimal"
**Concepto:** Salón zen / Spa premium / Clínica estética

| Aspecto | Valor |
|---------|-------|
| Hero | minimal |
| Theme | minimal |
| Skin | outline |
| Colors | Casi negro `#1a1a1a` + Gris `#666` |
| Typography | Jost + Jost (ultra limpia) |
| Font Scale | 1.125 (títulos moderados) |
| Effects | Shadows 0%, radius soft, NO glassmorphism |
| Services | list |
| Features | icons |
| Reviews | minimal |
| Footer | minimal |

**Por qué es diferente:** Casi sin color, solo líneas/outlines, muchísimo espacio en blanco, sensación zen y premium.

---

### Preset 4: "Magazine Editorial"
**Concepto:** Salón de moda / Peluquería trendy / Barbería hipster

| Aspecto | Valor |
|---------|-------|
| Hero | **split** (nuevo) |
| Theme | minimal |
| Skin | flat |
| Colors | Negro puro `#000` + Rojo `#e63946` |
| Typography | Playfair Display + Source Serif (editorial) |
| Font Scale | 1.618 (golden ratio, títulos ENORMES) |
| Effects | Shadows 0%, radius sharp |
| Services | list |
| Features | banner |
| Reviews | minimal |
| Footer | minimal |

**Por qué es diferente:** Blanco y negro con acento rojo dramático, tipografía gigante tipo revista de moda, sin sombras, máximo contraste.

---

### Preset 5: "Tropical Paradise"
**Concepto:** Beach bar / Restaurante playero / Cafetería surf

| Aspecto | Valor |
|---------|-------|
| Hero | classic (con parallax) |
| Theme | summer |
| Skin | 3d |
| Colors | Coral `#ff6b6b` + Turquesa `#40e0d0` + Arena `#f5deb3` |
| Typography | Pacifico + Poppins (divertida) |
| Font Scale | 1.25 |
| Effects | Shadows 80%, radius pill (muy redondeado) |
| Services | carousel |
| Features | cards |
| Reviews | carousel |
| Footer | centered |

**Por qué es diferente:** Colores tropicales saturados, bordes muy redondeados, sombras 3D, fuente manuscrita, sensación playera y relajada.

---

## FASE 4: Actualizar Types

**Archivo:** `packages/supabase/src/types/customization.ts`

Añadir las nuevas variantes de hero al type:
```typescript
hero: "classic" | "modern" | "bold" | "minimal" | "fullscreen" | "split";
```

---

## Resumen de Archivos a Crear/Modificar

### CREAR:
1. `apps/templates/salon/src/components/Hero/HeroFullscreen.astro`
2. `apps/templates/salon/src/components/Hero/HeroSplit.astro`

### MODIFICAR:
1. `apps/templates/salon/src/components/Hero/index.ts` - Exportar nuevos heroes
2. `packages/supabase/src/sections-catalog.ts` - Añadir variantes
3. `packages/supabase/src/types/customization.ts` - Actualizar types
4. `apps/admin/src/lib/personalizacion/presets.ts` - Añadir 5 presets

---

## Resultado Esperado

| Plantilla | Primera Impresión |
|-----------|-------------------|
| Dark Elegance | "Esto parece un hotel de lujo" |
| Bold Energy | "Esto parece un gym serio" |
| Pure Minimal | "Esto parece un spa zen" |
| Magazine Editorial | "Esto parece una revista de moda" |
| Tropical Paradise | "Esto parece un chiringuito de playa" |

Cada plantilla debe ser **inmediatamente reconocible** como un tipo de negocio diferente.
