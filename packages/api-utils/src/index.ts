/**
 * @neumorstudio/api-utils
 * Utilidades compartidas para APIs públicas
 */

// CORS
export {
  normalizeDomain,
  stripPort,
  getOriginHost,
  isDevHost,
  isAllowedOrigin,
  buildCorsHeaders,
  getCorsHeadersForOrigin,
  createCorsHelper,
  type CorsHeaders,
} from "./cors.js";

// Rate Limiting
export {
  checkRateLimit,
  getClientIp,
  getRateLimitKey,
  createRateLimiter,
  rateLimitPresets,
  type RateLimitConfig,
  type RateLimitResult,
} from "./rate-limit.js";

// Validation
export {
  patterns,
  isValidUuid,
  isPlainObject,
  getUnknownKeys,
  hasUnknownKeys,
  isValidDate,
  isValidTime,
  isDateTimeInFuture,
  sanitizeString,
  createFieldValidator,
} from "./validation.js";
