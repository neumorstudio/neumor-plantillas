import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";

/**
 * Crea un cliente Supabase para el servidor con manejo de cookies
 * Usar en paginas Astro para autenticacion SSR
 */
export function createPortalClient(cookies: AstroCookies, request?: Request) {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase no configurado. Configura PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  // Extract project ref from URL for cookie naming
  const projectRef =
    supabaseUrl.match(/https:\/\/([^.]+)\.supabase/)?.[1] || "";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Parse all cookies from the raw Cookie header
        if (request) {
          return parseCookieHeader(request.headers.get("Cookie") ?? "");
        }

        // Fallback: try to get Supabase auth cookies by known patterns
        const allCookies: { name: string; value: string }[] = [];
        const baseName = `sb-${projectRef}-auth-token`;

        const cookieNames = [
          baseName,
          `${baseName}.0`,
          `${baseName}.1`,
          `${baseName}.2`,
          `${baseName}.3`,
          `${baseName}.4`,
        ];

        for (const name of cookieNames) {
          const cookie = cookies.get(name);
          if (cookie?.value) {
            allCookies.push({ name, value: cookie.value });
          }
        }

        return allCookies;
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookies.set(name, value, {
            path: "/",
            secure: true,
            sameSite: "lax",
            ...options,
          });
        });
      },
    },
  });
}

// Tipos para el portal
export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface ServiceItem {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

export interface CustomerBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  services: ServiceItem[];
  total_price_cents: number | null;
  notes: string | null;
}

/**
 * Obtiene el perfil del cliente autenticado
 */
export async function getCustomerProfile(
  cookies: AstroCookies,
  websiteId: string,
  request?: Request
): Promise<CustomerProfile | null> {
  const supabase = createPortalClient(cookies, request);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: customer, error } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("website_id", websiteId)
    .eq("auth_user_id", user.id)
    .single();

  if (error || !customer) return null;

  return customer as CustomerProfile;
}

/**
 * Parsea el campo services que puede venir como string JSON o como array
 */
function parseServices(services: unknown): ServiceItem[] {
  if (!services) return [];
  if (Array.isArray(services)) return services as ServiceItem[];
  if (typeof services === "string") {
    try {
      const parsed = JSON.parse(services);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Extrae el nombre del servicio del campo notes para bookings antiguos
 * Format: "Servicio: NombreServicio | Profesional: NombreProfesional"
 */
function extractServiceFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Servicio:\s*([^|]+)/i);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

/**
 * Obtiene las reservas del cliente
 */
export async function getCustomerBookings(
  cookies: AstroCookies,
  customerId: string,
  request?: Request
): Promise<CustomerBooking[]> {
  const supabase = createPortalClient(cookies, request);

  console.log("[getCustomerBookings] Querying bookings for customer_id:", customerId);

  const { data, error } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, services, total_price_cents, notes, customer_id, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !data) return [];

  // Parsear services que puede venir como string JSON
  // Para bookings antiguos sin services, extraer del campo notes
  return data.map((booking) => {
    let services = parseServices(booking.services);

    // Fallback: si no hay services, intentar extraer del campo notes
    if (services.length === 0 && booking.notes) {
      const serviceName = extractServiceFromNotes(booking.notes);
      if (serviceName) {
        services = [{ id: "legacy", name: serviceName, price_cents: 0, duration_minutes: 0 }];
      }
    }

    return {
      ...booking,
      services,
    };
  }) as CustomerBooking[];
}

/**
 * Cierra sesion del usuario
 */
export async function signOut(cookies: AstroCookies, request?: Request) {
  const supabase = createPortalClient(cookies, request);
  await supabase.auth.signOut();
}
