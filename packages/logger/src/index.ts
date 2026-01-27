/**
 * Logger estructurado para NeumorStudio
 * Proporciona logging consistente con contexto y niveles apropiados
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  service?: string;
  requestId?: string;
  websiteId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error | unknown;
  timestamp: string;
}

const isProduction = process.env.NODE_ENV === "production";
const logLevel = (process.env.LOG_LEVEL || (isProduction ? "info" : "debug")) as LogLevel;

const levelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function shouldLog(level: LogLevel): boolean {
  return levelPriority[level] >= levelPriority[logLevel];
}

function formatError(error: unknown): object | undefined {
  if (!error) return undefined;
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isProduction ? undefined : error.stack,
    };
  }
  return { raw: String(error) };
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
): LogEntry {
  return {
    level,
    message,
    context,
    error: formatError(error),
    timestamp: new Date().toISOString(),
  };
}

function output(entry: LogEntry): void {
  if (isProduction) {
    // En producción: JSON estructurado para herramientas de logging
    const consoleFn = entry.level === "error" ? console.error :
                      entry.level === "warn" ? console.warn : console.log;
    consoleFn(JSON.stringify(entry));
  } else {
    // En desarrollo: formato legible
    const prefix = `[${entry.level.toUpperCase()}]`;
    const service = entry.context?.service ? `[${entry.context.service}]` : "";
    const msg = `${prefix}${service} ${entry.message}`;

    const consoleFn = entry.level === "error" ? console.error :
                      entry.level === "warn" ? console.warn :
                      entry.level === "debug" ? console.debug : console.log;

    if (entry.context && Object.keys(entry.context).length > 1) {
      consoleFn(msg, entry.context);
    } else {
      consoleFn(msg);
    }

    if (entry.error) {
      consoleFn(entry.error);
    }
  }
}

/**
 * Crea un logger con contexto predefinido (ej: nombre del servicio)
 */
export function createLogger(defaultContext: LogContext = {}) {
  return {
    debug(message: string, context?: LogContext): void {
      if (!shouldLog("debug")) return;
      output(createLogEntry("debug", message, { ...defaultContext, ...context }));
    },

    info(message: string, context?: LogContext): void {
      if (!shouldLog("info")) return;
      output(createLogEntry("info", message, { ...defaultContext, ...context }));
    },

    warn(message: string, context?: LogContext, error?: unknown): void {
      if (!shouldLog("warn")) return;
      output(createLogEntry("warn", message, { ...defaultContext, ...context }, error));
    },

    error(message: string, context?: LogContext, error?: unknown): void {
      if (!shouldLog("error")) return;
      output(createLogEntry("error", message, { ...defaultContext, ...context }, error));
    },

    /**
     * Crea un child logger con contexto adicional
     */
    child(additionalContext: LogContext) {
      return createLogger({ ...defaultContext, ...additionalContext });
    },
  };
}

/**
 * Logger por defecto sin contexto
 */
export const logger = createLogger();

/**
 * Genera un ID de request único para correlación
 */
export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
