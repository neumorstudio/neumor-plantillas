# README Dev (Onboarding)

Guía corta y accionable para levantar el repo en local y ejecutar checks.

## Prerrequisitos

- Node.js 20+
- pnpm 10+
- Acceso a Supabase (URL + keys)
- (Opcional) Supabase CLI (`npx supabase ...`)
- (Opcional) Vercel CLI para deploy manual

## Setup rápido

```bash
pnpm install
cp .env.example .env
```

Completa en `.env` al menos las variables de Supabase (ver `docs/configuration.md`).

## Variables por app

- Admin: usa `apps/admin/.env.example` como base.
- Templates: usa `apps/templates/<template>/.env.example` como base.
- Unified: usa las mismas `PUBLIC_*` que el resto de templates.

Notas:
- En Astro, las variables públicas deben empezar con `PUBLIC_`.
- No expongas `SUPABASE_SERVICE_ROLE_KEY` fuera de server-side.

## Levantar apps

```bash
# Todo el monorepo
pnpm dev

# Solo admin
pnpm dev:admin

# Templates
pnpm dev:restaurant
pnpm dev:salon
pnpm dev:clinic
pnpm dev:gym
pnpm dev:store
pnpm dev:repairs

# Admin + unified
pnpm local
```

Puertos por template (según `docs/getting-started.md`):

| Template | Puerto |
|---|---|
| restaurant | 4321 |
| salon | 4322 |
| clinic | 4323 |
| gym | 4324 |
| store | 4325 |
| repairs | 4326 |

## Checks locales (antes de PR)

```bash
pnpm lint
pnpm type-check   # alias: pnpm typecheck
pnpm test
pnpm build
```

## Supabase local (opcional)

Si necesitas BD local:

```bash
npx supabase start
npx supabase db diff
npx supabase db push
```

Migrations:
- `packages/supabase/migrations/` (migraciones fuente)
- `supabase/migrations/` (migraciones locales CLI)

## Troubleshooting rápido

- `eslint: not found` → asegúrate de `pnpm install` y usar los scripts del repo.
- Errores de conexión Supabase → revisa `.env` y `PUBLIC_*` en templates.
- Fallos de build en templates → ejecuta `pnpm type-check` para ver el archivo exacto.

## Referencias

- `docs/getting-started.md`
- `docs/configuration.md`
- `docs/ARCHITECTURE.md`
- `docs/TESTING.md`
- `docs/SECURITY.md`
