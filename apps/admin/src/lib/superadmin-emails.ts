/**
 * Utilidades para parsing de SUPERADMIN_EMAILS.
 * Unica fuente de verdad para la logica de superadmin emails.
 *
 * Usado por:
 * - src/lib/superadmin.ts (server-side checks)
 * - src/middleware.ts (edge middleware)
 */

/**
 * Parsea la variable de entorno SUPERADMIN_EMAILS.
 * Soporta: trimming, case-insensitive, ignora vacios.
 *
 * @param envValue - Valor de SUPERADMIN_EMAILS (comma-separated)
 * @returns Array de emails en lowercase, sin espacios
 */
export function parseSuperAdminEmails(envValue?: string): string[] {
  if (!envValue) return [];
  return envValue
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

/**
 * Verifica si un email es superadmin.
 * Lee SUPERADMIN_EMAILS del entorno y compara.
 *
 * Fail-safe: retorna false si:
 * - email es null/undefined/vacio
 * - SUPERADMIN_EMAILS no esta configurada
 *
 * @param email - Email a verificar
 * @returns true si el email esta en la lista de superadmins
 */
export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false;

  const superAdminEmails = parseSuperAdminEmails(process.env.SUPERADMIN_EMAILS);

  if (superAdminEmails.length === 0) {
    return false;
  }

  return superAdminEmails.includes(email.toLowerCase());
}
