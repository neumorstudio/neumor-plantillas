/**
 * Rate limiting para APIs públicas de NeumorStudio
 * Implementación en memoria con buckets por IP+resource
 */

export interface RateLimitConfig {
  windowMs: number;      // Ventana de tiempo en ms
  maxRequests: number;   // Máximo de requests en la ventana
}

export interface RateLimitResult {
  allowed: boolean;
  resetAt: number;       // Timestamp cuando se resetea el bucket
  remaining: number;     // Requests restantes en la ventana
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

// Almacenamiento global de buckets (en memoria)
const buckets = new Map<string, RateLimitBucket>();

// Limpieza periódica de buckets expirados (cada 5 minutos)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredBuckets(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Verifica el rate limit para una clave dada
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 20 }
): RateLimitResult {
  cleanupExpiredBuckets();

  const now = Date.now();
  const entry = buckets.get(key);

  // Bucket nuevo o expirado
  if (!entry || entry.resetAt <= now) {
    const resetAt = now + config.windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, resetAt, remaining: config.maxRequests - 1 };
  }

  // Bucket existente - verificar límite
  if (entry.count >= config.maxRequests) {
    return { allowed: false, resetAt: entry.resetAt, remaining: 0 };
  }

  // Incrementar contador
  entry.count += 1;
  return {
    allowed: true,
    resetAt: entry.resetAt,
    remaining: config.maxRequests - entry.count,
  };
}

/**
 * Extrae la IP del cliente de una request
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") || "unknown";
}

/**
 * Genera la clave de rate limit combinando IP y resource
 */
export function getRateLimitKey(ip: string, resourceId: string): string {
  return `${ip}:${resourceId}`;
}

/**
 * Crea un rate limiter configurado
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    /**
     * Verifica rate limit para IP + resource
     */
    check: (ip: string, resourceId: string): RateLimitResult =>
      checkRateLimit(getRateLimitKey(ip, resourceId), config),

    /**
     * Extrae IP y verifica rate limit en un solo paso
     */
    checkRequest: (headers: Headers, resourceId: string): RateLimitResult => {
      const ip = getClientIp(headers);
      return checkRateLimit(getRateLimitKey(ip, resourceId), config);
    },
  };
}

// Configuraciones predefinidas
export const rateLimitPresets = {
  /** Rate limit estándar: 20 requests por minuto */
  standard: { windowMs: 60_000, maxRequests: 20 },
  /** Rate limit para pagos: 15 requests por minuto */
  payments: { windowMs: 60_000, maxRequests: 15 },
  /** Rate limit estricto: 5 requests por minuto */
  strict: { windowMs: 60_000, maxRequests: 5 },
  /** Rate limit relajado: 60 requests por minuto */
  relaxed: { windowMs: 60_000, maxRequests: 60 },
} as const;
