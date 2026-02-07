# Security

Checklist mínimo para contributors.

## Reglas básicas

- No loggear PII (emails completos, teléfonos, tokens, payloads sensibles).
- No exponer `SUPABASE_SERVICE_ROLE_KEY` en front o variables `PUBLIC_*`.
- No escribir directo a Supabase desde frontend; usar APIs del admin.
- Respetar RLS y las políticas existentes (ver `docs/DATABASE.md`).
- Evitar imprimir secretos en errores o logs.

## Pre-PR checklist

- [ ] No hay secretos en `.env` o docs
- [ ] No hay logs de PII
- [ ] No se añadió acceso directo a Supabase desde frontend
- [ ] Se ejecutaron `pnpm lint`, `pnpm type-check`, `pnpm test`, `pnpm build`
- [ ] Tests actualizados si cambió lógica

## Referencias

- `docs/security/SECURITY_CHANGELOG.md`
- `docs/security/public-api-verification.md`
- `docs/DATABASE.md`

