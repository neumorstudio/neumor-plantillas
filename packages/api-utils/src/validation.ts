/**
 * Utilidades de validación para APIs públicas
 */

// Regex patterns comunes
export const patterns = {
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}(:\d{2})?$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s+()-]{6,20}$/,
} as const;

/**
 * Verifica si un valor es un UUID válido
 */
export function isValidUuid(value: unknown): value is string {
  return typeof value === "string" && patterns.uuid.test(value);
}

/**
 * Verifica si un valor es un objeto plano (no array, no null)
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Obtiene las claves de un objeto que no están en el set permitido
 */
export function getUnknownKeys(
  value: Record<string, unknown>,
  allowed: Set<string>
): string[] {
  return Object.keys(value).filter((key) => !allowed.has(key));
}

/**
 * Verifica si hay claves no permitidas en el objeto
 */
export function hasUnknownKeys(
  value: Record<string, unknown>,
  allowed: Set<string>
): boolean {
  return getUnknownKeys(value, allowed).length > 0;
}

/**
 * Valida que un valor sea una fecha válida en formato YYYY-MM-DD
 */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== "string" || !patterns.date.test(value)) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Valida que un valor sea una hora válida en formato HH:MM o HH:MM:SS
 */
export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && patterns.time.test(value);
}

/**
 * Valida que una fecha+hora estén en el futuro
 */
export function isDateTimeInFuture(date: string, time: string): boolean {
  const combined = new Date(`${date}T${time}`);
  if (isNaN(combined.getTime())) return false;
  return combined.getTime() >= Date.now();
}

/**
 * Sanitiza un string: trim + slice a máximo
 */
export function sanitizeString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

/**
 * Crea un validador de campos para un endpoint
 */
export function createFieldValidator(allowedFields: string[]) {
  const allowedSet = new Set(allowedFields);

  return {
    /**
     * Verifica que el body sea válido (objeto plano sin campos extra)
     */
    validateBody(body: unknown): { valid: boolean; error?: string } {
      if (!isPlainObject(body)) {
        return { valid: false, error: "Datos invalidos" };
      }
      if (hasUnknownKeys(body, allowedSet)) {
        return { valid: false, error: "Datos invalidos" };
      }
      return { valid: true };
    },

    /**
     * Verifica campos requeridos
     */
    checkRequired(
      body: Record<string, unknown>,
      required: string[]
    ): { valid: boolean; missing?: string[] } {
      const missing = required.filter(
        (field) => body[field] === undefined || body[field] === null || body[field] === ""
      );
      if (missing.length > 0) {
        return { valid: false, missing };
      }
      return { valid: true };
    },
  };
}
