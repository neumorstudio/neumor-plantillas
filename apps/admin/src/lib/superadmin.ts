import { createClient } from "./supabase-server";
import { parseSuperAdminEmails, isSuperAdminEmail } from "./superadmin-emails";

/**
 * Verifica si el usuario actual es superadmin.
 * Solo debe usarse en server-side (Server Components, Server Actions, Route Handlers).
 *
 * @returns true si el usuario es superadmin, false en caso contrario
 */
export async function isSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return false;
  }

  const superAdminEmails = parseSuperAdminEmails(process.env.SUPERADMIN_EMAILS);

  if (superAdminEmails.length === 0) {
    // Si no hay emails configurados, denegar acceso por seguridad
    return false;
  }

  return isSuperAdminEmail(user.email);
}

/**
 * Verifica superadmin y lanza error si no tiene acceso.
 * Util para proteger server actions y route handlers.
 */
export async function requireSuperAdmin(): Promise<void> {
  const isSuper = await isSuperAdmin();
  if (!isSuper) {
    throw new Error("Unauthorized: SuperAdmin access required");
  }
}

/**
 * Obtiene el email del usuario actual (si existe).
 */
export async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email || null;
}
