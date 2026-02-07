# Testing

Objetivo: detectar regresiones sin sobreingeniería.

## Qué se testea

- Unit tests de helpers puros (validación, normalización, helpers de UI).
- Unit tests de server actions (mocks de Supabase / auth).
- Smoke tests: **no implementados** (solo si se incorpora Playwright u otra herramienta ligera).

## Dónde están los tests

- `apps/admin/__tests__/unit/**` (Vitest)
- Configuración global: `vitest.config.ts`
- Setup global: `apps/admin/__tests__/setup/index.ts`

## Cómo ejecutar

```bash
# Rápido (unit tests actuales)
pnpm test

# Coverage
pnpm test:coverage
```

## Patrones para escribir tests

- Preferir funciones puras y módulos sin side-effects.
- Evitar dependencias externas (API/DB real).
- Para server actions, usar mocks (ej. `vi.mock`) y validar shape de respuesta.

## Reglas prácticas

- Si cambias lógica, añade/actualiza tests del módulo afectado.
- Evita tests “vacíos” sin asserts significativos.

