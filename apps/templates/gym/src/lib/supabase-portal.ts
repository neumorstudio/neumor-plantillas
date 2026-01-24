import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";

// Tipos para el portal de clientes
export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  auth_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerBooking {
  id: string;
  date: string;
  time: string;
  service_name: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes: string | null;
  created_at: string;
}

export interface CustomerSession {
  id: string;
  date: string;
  time: string;
  class_name: string;
  trainer_name: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  notes: string | null;
}

export interface CustomerPackage {
  id: string;
  package_name: string;
  sessions_total: number;
  sessions_used: number;
  sessions_remaining: number;
  expires_at: string | null;
  status: "active" | "expired" | "depleted";
}

export interface CustomerProgress {
  id: string;
  date: string;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  notes: string | null;
}

export interface CustomerPayment {
  id: string;
  amount: number;
  description: string;
  status: "pending" | "paid" | "refunded";
  payment_date: string | null;
  created_at: string;
}

/**
 * Crea un cliente Supabase para el servidor con manejo de cookies
 * Usar en páginas Astro para autenticación SSR
 */
export function createPortalClient(cookies: AstroCookies) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase no configurado. Configura PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(cookies.get("sb-auth")?.value ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
            path: "/",
            ...options,
          });
        });
      },
    },
  });
}

/**
 * Crea cliente Supabase para el navegador (client-side)
 * Usar en scripts de cliente (client:load, etc.)
 */
export async function createBrowserClient() {
  const { createBrowserClient: createClient } = await import("@supabase/ssr");

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase no configurado");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

// Cache del website para evitar queries repetidas
let cachedWebsite: { id: string; domain: string } | null = null;

/**
 * Obtiene el website_id por dominio actual
 * Primero intenta usar PUBLIC_WEBSITE_ID si está definido (útil para desarrollo)
 * Si no, busca el website por el dominio actual
 */
export async function getWebsiteByDomain(
  cookies: AstroCookies,
  currentDomain: string
): Promise<{ id: string; domain: string } | null> {
  // Si hay variable de entorno, usarla (desarrollo local)
  const envWebsiteId = import.meta.env.PUBLIC_WEBSITE_ID;
  if (envWebsiteId) {
    return { id: envWebsiteId, domain: currentDomain };
  }

  // Usar cache si el dominio coincide
  if (cachedWebsite && cachedWebsite.domain === currentDomain) {
    return cachedWebsite;
  }

  const supabase = createPortalClient(cookies);

  // Limpiar dominio (quitar protocolo y puerto)
  const cleanDomain = currentDomain
    .replace(/^https?:\/\//, "")
    .split(":")[0]
    .split("/")[0];

  const { data, error } = await supabase
    .from("websites")
    .select("id, domain")
    .eq("domain", cleanDomain)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    console.error("Website no encontrado para dominio:", cleanDomain);
    return null;
  }

  // Guardar en cache
  cachedWebsite = { id: data.id, domain: cleanDomain };
  return cachedWebsite;
}

/**
 * Helper para obtener website_id (para compatibilidad)
 */
export function getWebsiteId(): string {
  const websiteId = import.meta.env.PUBLIC_WEBSITE_ID;
  if (!websiteId) {
    throw new Error("PUBLIC_WEBSITE_ID no configurado. Usa getWebsiteByDomain() en su lugar.");
  }
  return websiteId;
}

/**
 * Verifica si el usuario está autenticado y obtiene su perfil de cliente
 * @param cookies - Cookies de Astro
 * @param currentDomain - Dominio actual (ej: Astro.url.host)
 */
export async function getCustomerProfile(
  cookies: AstroCookies,
  currentDomain: string
): Promise<CustomerProfile | null> {
  const supabase = createPortalClient(cookies);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const website = await getWebsiteByDomain(cookies, currentDomain);
  if (!website) return null;

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, email, phone, address, auth_user_id, created_at, updated_at")
    .eq("website_id", website.id)
    .eq("auth_user_id", user.id)
    .single();

  if (error || !customer) return null;

  return customer as CustomerProfile;
}

/**
 * Obtiene las reservas/sesiones del cliente
 */
export async function getCustomerBookings(
  cookies: AstroCookies,
  currentDomain: string
): Promise<CustomerBooking[]> {
  const supabase = createPortalClient(cookies);
  const customer = await getCustomerProfile(cookies, currentDomain);
  if (!customer) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id,
      date,
      time,
      status,
      notes,
      created_at,
      services(name)
    `)
    .eq("customer_id", customer.id)
    .order("date", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((booking: any) => ({
    id: booking.id,
    date: booking.date,
    time: booking.time,
    service_name: booking.services?.name || "Sesión",
    status: booking.status,
    notes: booking.notes,
    created_at: booking.created_at,
  }));
}

/**
 * Obtiene las sesiones de fitness del cliente (específico de gym)
 */
export async function getCustomerSessions(
  cookies: AstroCookies,
  currentDomain: string
): Promise<CustomerSession[]> {
  const supabase = createPortalClient(cookies);
  const customer = await getCustomerProfile(cookies, currentDomain);
  if (!customer) return [];

  const { data, error } = await supabase
    .from("sessions")
    .select(`
      id,
      date,
      time,
      status,
      notes,
      classes(name),
      trainers(name)
    `)
    .eq("customer_id", customer.id)
    .order("date", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data.map((session: any) => ({
    id: session.id,
    date: session.date,
    time: session.time,
    class_name: session.classes?.name || "Sesión",
    trainer_name: session.trainers?.name || null,
    status: session.status,
    notes: session.notes,
  }));
}

/**
 * Obtiene los paquetes del cliente
 */
export async function getCustomerPackages(
  cookies: AstroCookies,
  currentDomain: string
): Promise<CustomerPackage[]> {
  const supabase = createPortalClient(cookies);
  const customer = await getCustomerProfile(cookies, currentDomain);
  if (!customer) return [];

  const { data, error } = await supabase
    .from("client_packages")
    .select(`
      id,
      sessions_total,
      sessions_used,
      expires_at,
      status,
      packages(name)
    `)
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((pkg: any) => ({
    id: pkg.id,
    package_name: pkg.packages?.name || "Paquete",
    sessions_total: pkg.sessions_total,
    sessions_used: pkg.sessions_used,
    sessions_remaining: pkg.sessions_total - pkg.sessions_used,
    expires_at: pkg.expires_at,
    status: pkg.status,
  }));
}

/**
 * Obtiene el progreso del cliente (métricas fitness)
 */
export async function getCustomerProgress(
  cookies: AstroCookies,
  currentDomain: string
): Promise<CustomerProgress[]> {
  const supabase = createPortalClient(cookies);
  const customer = await getCustomerProfile(cookies, currentDomain);
  if (!customer) return [];

  const { data, error } = await supabase
    .from("client_progress")
    .select("id, date, weight, body_fat, muscle_mass, notes")
    .eq("customer_id", customer.id)
    .order("date", { ascending: false })
    .limit(30);

  if (error || !data) return [];

  return data as CustomerProgress[];
}

/**
 * Obtiene los pagos del cliente
 */
export async function getCustomerPayments(
  cookies: AstroCookies,
  currentDomain: string
): Promise<CustomerPayment[]> {
  const supabase = createPortalClient(cookies);
  const customer = await getCustomerProfile(cookies, currentDomain);
  if (!customer) return [];

  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, description, status, payment_date, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  return data as CustomerPayment[];
}

/**
 * Actualiza el perfil del cliente (solo campos permitidos)
 */
export async function updateCustomerProfile(
  cookies: AstroCookies,
  currentDomain: string,
  updates: { name?: string; phone?: string; address?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = createPortalClient(cookies);
  const customer = await getCustomerProfile(cookies, currentDomain);
  if (!customer) return { success: false, error: "No autenticado" };

  const { error } = await supabase
    .from("customers")
    .update({
      name: updates.name,
      phone: updates.phone,
      address: updates.address,
      updated_at: new Date().toISOString(),
    })
    .eq("id", customer.id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}

/**
 * Inicia el flujo de login con Google
 */
export async function signInWithGoogle(cookies: AstroCookies, redirectTo: string) {
  const supabase = createPortalClient(cookies);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  return { data, error };
}

/**
 * Cierra sesión
 */
export async function signOut(cookies: AstroCookies) {
  const supabase = createPortalClient(cookies);
  await supabase.auth.signOut();
}
