/**
 * CORS utilities para APIs públicas de NeumorStudio
 */

import { createClient } from "@supabase/supabase-js";

export type CorsHeaders = Record<string, string> & {
  "Access-Control-Allow-Origin": string;
  "Access-Control-Allow-Methods": string;
  "Access-Control-Allow-Headers": string;
  Vary: string;
};

/**
 * Normaliza un dominio eliminando protocolo y path
 */
export function normalizeDomain(value: string): string {
  return value.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
}

/**
 * Elimina el puerto de un host
 */
export function stripPort(value: string): string {
  return value.split(":")[0];
}

/**
 * Extrae el hostname de un origin URL
 */
export function getOriginHost(origin: string): string | null {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Verifica si es un host de desarrollo
 */
export function isDevHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

/**
 * Verifica si el origin está permitido para el dominio del website
 */
export function isAllowedOrigin(origin: string | null, websiteDomain: string): boolean {
  if (!origin) return false;
  const host = getOriginHost(origin);
  if (!host) return false;
  const domain = stripPort(normalizeDomain(websiteDomain));
  const hostNoPort = stripPort(host);

  if (hostNoPort === domain || hostNoPort === `www.${domain}`) return true;
  if (domain === `www.${hostNoPort}`) return true;
  if (process.env.NODE_ENV !== "production" && isDevHost(hostNoPort)) return true;
  return false;
}

/**
 * Construye los headers CORS
 */
export function buildCorsHeaders(origin: string): CorsHeaders {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

/**
 * Obtiene CORS headers verificando el origin contra la BD
 */
export async function getCorsHeadersForOrigin(
  origin: string | null,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<CorsHeaders | null> {
  if (!origin) return null;
  const host = getOriginHost(origin);
  if (!host) return null;
  const hostNoPort = stripPort(host);

  if (process.env.NODE_ENV !== "production" && isDevHost(hostNoPort)) {
    return buildCorsHeaders(origin);
  }

  const candidates = hostNoPort.startsWith("www.")
    ? [hostNoPort, hostNoPort.replace(/^www\./, "")]
    : [hostNoPort, `www.${hostNoPort}`];

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data } = await supabase
    .from("websites")
    .select("id")
    .in("domain", candidates)
    .eq("is_active", true)
    .limit(1);

  if (!data || data.length === 0) {
    return null;
  }

  return buildCorsHeaders(origin);
}

/**
 * Crea un helper de CORS configurado para el contexto actual
 */
export function createCorsHelper(supabaseUrl: string, supabaseServiceKey: string) {
  return {
    /**
     * Obtiene CORS headers para un origin
     */
    getHeadersForOrigin: (origin: string | null) =>
      getCorsHeadersForOrigin(origin, supabaseUrl, supabaseServiceKey),

    /**
     * Verifica si un origin está permitido para un dominio
     */
    isAllowed: isAllowedOrigin,

    /**
     * Construye headers CORS
     */
    build: buildCorsHeaders,
  };
}
