import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  isValidDate,
  isValidTime,
  isDateTimeInFuture,
  sanitizeString,
  createFieldValidator,
} from "@neumorstudio/api-utils";

describe("api-utils validation", () => {
  describe("isValidDate", () => {
    it("acepta fechas válidas YYYY-MM-DD", () => {
      expect(isValidDate("2025-01-31")).toBe(true);
    });

    it("rechaza formatos inválidos", () => {
      expect(isValidDate("31-01-2025")).toBe(false);
      expect(isValidDate("2025/01/31")).toBe(false);
    });
  });

  describe("isValidTime", () => {
    it("acepta HH:MM y HH:MM:SS", () => {
      expect(isValidTime("09:30")).toBe(true);
      expect(isValidTime("09:30:45")).toBe(true);
    });

    it("rechaza formatos inválidos", () => {
      expect(isValidTime("9:30")).toBe(false);
      expect(isValidTime("0930")).toBe(false);
    });
  });

  describe("isDateTimeInFuture", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2025, 0, 1, 10, 0, 0));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("retorna true si la fecha/hora es igual o futura", () => {
      expect(isDateTimeInFuture("2025-01-01", "10:00:00")).toBe(true);
      expect(isDateTimeInFuture("2025-01-01", "10:01:00")).toBe(true);
    });

    it("retorna false si es pasada o inválida", () => {
      expect(isDateTimeInFuture("2025-01-01", "09:59:00")).toBe(false);
      expect(isDateTimeInFuture("invalid", "10:00:00")).toBe(false);
    });
  });

  describe("sanitizeString", () => {
    it("aplica trim y límite de longitud", () => {
      expect(sanitizeString("  hola mundo  ", 4)).toBe("hola");
    });

    it("retorna string vacío si no es string", () => {
      expect(sanitizeString(null, 10)).toBe("");
    });
  });

  describe("createFieldValidator", () => {
    it("detecta campos desconocidos y faltantes", () => {
      const validator = createFieldValidator(["name", "email"]);
      const result = validator.validateBody({ name: "Test", extra: "x" } as Record<string, unknown>);
      expect(result.valid).toBe(false);

      const required = validator.checkRequired({ name: "" }, ["name", "email"]);
      expect(required.valid).toBe(false);
      expect(required.missing).toEqual(["name", "email"]);
    });
  });
});
