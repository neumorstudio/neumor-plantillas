/**
 * Tests exhaustivos para la logica de SuperAdmin
 *
 * Archivo bajo test: apps/admin/src/lib/superadmin.ts
 *
 * Estos tests verifican:
 * - Parsing correcto de SUPERADMIN_EMAILS
 * - Case-insensitivity
 * - Trimming de espacios
 * - Manejo de env var vacia/undefined/malformada
 * - Comportamiento de requireSuperAdmin
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────────────────────

// Mock del modulo supabase-server
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
  })),
}));

// Guardar valor original de env var
const originalSuperadminEmails = process.env.SUPERADMIN_EMAILS;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function setSuperadminEmails(value: string | undefined) {
  if (value === undefined) {
    delete process.env.SUPERADMIN_EMAILS;
  } else {
    process.env.SUPERADMIN_EMAILS = value;
  }
}

function mockAuthenticatedUser(email: string) {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-123", email } },
    error: null,
  });
}

function mockUnauthenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
}

function mockUserWithoutEmail() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-123", email: null } },
    error: null,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("SuperAdmin Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env var a valor de test por defecto
    setSuperadminEmails("admin@test.com,superadmin@test.com");
  });

  afterEach(() => {
    // Restaurar valor original
    if (originalSuperadminEmails !== undefined) {
      process.env.SUPERADMIN_EMAILS = originalSuperadminEmails;
    } else {
      delete process.env.SUPERADMIN_EMAILS;
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // isSuperAdmin - Casos basicos
  // ═══════════════════════════════════════════════════════════════════════════

  describe("isSuperAdmin", () => {
    // Importacion dinamica para que use los mocks
    const getIsSuperAdmin = async () => {
      // Limpiar cache del modulo para que re-lea env vars
      vi.resetModules();
      const module = await import("@/lib/superadmin");
      return module.isSuperAdmin;
    };

    describe("casos basicos", () => {
      it("retorna true si email esta en SUPERADMIN_EMAILS", async () => {
        setSuperadminEmails("admin@test.com,other@test.com");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("retorna false si email NO esta en SUPERADMIN_EMAILS", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("hacker@evil.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("retorna false si usuario no esta autenticado", async () => {
        setSuperadminEmails("admin@test.com");
        mockUnauthenticatedUser();

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("retorna false si usuario no tiene email", async () => {
        setSuperadminEmails("admin@test.com");
        mockUserWithoutEmail();

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // isSuperAdmin - Case sensitivity
    // ═══════════════════════════════════════════════════════════════════════════

    describe("case-insensitivity", () => {
      it("acepta email en mayusculas cuando env var esta en minusculas", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("ADMIN@TEST.COM");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("acepta email en minusculas cuando env var esta en mayusculas", async () => {
        setSuperadminEmails("ADMIN@TEST.COM");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("acepta email con case mixto", async () => {
        setSuperadminEmails("Admin@Test.COM");
        mockAuthenticatedUser("aDMIN@tEST.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // isSuperAdmin - Trimming de espacios
    // ═══════════════════════════════════════════════════════════════════════════

    describe("trimming de espacios", () => {
      it("acepta email con espacios al inicio en env var", async () => {
        setSuperadminEmails(" admin@test.com");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("acepta email con espacios al final en env var", async () => {
        setSuperadminEmails("admin@test.com ");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("acepta email con espacios alrededor de comas", async () => {
        setSuperadminEmails("admin@test.com , other@test.com , third@test.com");
        mockAuthenticatedUser("other@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("acepta email con multiples espacios", async () => {
        setSuperadminEmails("   admin@test.com   ");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // isSuperAdmin - Multiples emails
    // ═══════════════════════════════════════════════════════════════════════════

    describe("multiples emails separados por coma", () => {
      it("acepta primer email de la lista", async () => {
        setSuperadminEmails("first@test.com,second@test.com,third@test.com");
        mockAuthenticatedUser("first@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("acepta email del medio de la lista", async () => {
        setSuperadminEmails("first@test.com,second@test.com,third@test.com");
        mockAuthenticatedUser("second@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("acepta ultimo email de la lista", async () => {
        setSuperadminEmails("first@test.com,second@test.com,third@test.com");
        mockAuthenticatedUser("third@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("rechaza email que no esta en lista de multiples", async () => {
        setSuperadminEmails("first@test.com,second@test.com,third@test.com");
        mockAuthenticatedUser("fourth@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("funciona con un solo email (sin comas)", async () => {
        setSuperadminEmails("only@test.com");
        mockAuthenticatedUser("only@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // isSuperAdmin - Env var vacia
    // ═══════════════════════════════════════════════════════════════════════════

    describe("env var vacia", () => {
      it("retorna false cuando SUPERADMIN_EMAILS es string vacio", async () => {
        setSuperadminEmails("");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("retorna false cuando SUPERADMIN_EMAILS es solo espacios", async () => {
        setSuperadminEmails("   ");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // isSuperAdmin - Env var undefined
    // ═══════════════════════════════════════════════════════════════════════════

    describe("env var undefined", () => {
      it("retorna false cuando SUPERADMIN_EMAILS no existe", async () => {
        setSuperadminEmails(undefined);
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // isSuperAdmin - Env var malformada
    // ═══════════════════════════════════════════════════════════════════════════

    describe("env var malformada", () => {
      it("ignora comas consecutivas sin email", async () => {
        setSuperadminEmails("admin@test.com,,other@test.com");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("ignora patron de solo comas y espacios", async () => {
        setSuperadminEmails(" , , , ");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("ignora coma al inicio", async () => {
        setSuperadminEmails(",admin@test.com");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("ignora coma al final", async () => {
        setSuperadminEmails("admin@test.com,");
        mockAuthenticatedUser("admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });

      it("maneja mezcla de comas, espacios y emails validos", async () => {
        setSuperadminEmails(" , admin@test.com ,  , other@test.com , ");
        mockAuthenticatedUser("other@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(true);
      });
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // isSuperAdmin - Edge cases de seguridad
    // ═══════════════════════════════════════════════════════════════════════════

    describe("edge cases de seguridad", () => {
      it("no acepta substring parcial de email", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("admin@test"); // falta .com

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("no acepta email con prefijo extra", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("hacker+admin@test.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("no acepta email con sufijo extra", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("admin@test.com.hacker.com");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("es estricto con el dominio", async () => {
        setSuperadminEmails("admin@company.com");
        mockAuthenticatedUser("admin@company.com.br");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });

      it("no acepta email vacio en lista", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("");

        const isSuperAdmin = await getIsSuperAdmin();
        const result = await isSuperAdmin();

        expect(result).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // requireSuperAdmin
  // ═══════════════════════════════════════════════════════════════════════════

  describe("requireSuperAdmin", () => {
    const getRequireSuperAdmin = async () => {
      vi.resetModules();
      const module = await import("@/lib/superadmin");
      return module.requireSuperAdmin;
    };

    describe("casos basicos", () => {
      it("no lanza error si usuario es superadmin", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("admin@test.com");

        const requireSuperAdmin = await getRequireSuperAdmin();

        await expect(requireSuperAdmin()).resolves.toBeUndefined();
      });

      it("lanza error si usuario NO es superadmin", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("hacker@evil.com");

        const requireSuperAdmin = await getRequireSuperAdmin();

        await expect(requireSuperAdmin()).rejects.toThrow();
      });

      it("lanza error si usuario no esta autenticado", async () => {
        setSuperadminEmails("admin@test.com");
        mockUnauthenticatedUser();

        const requireSuperAdmin = await getRequireSuperAdmin();

        await expect(requireSuperAdmin()).rejects.toThrow();
      });
    });

    describe("mensaje de error", () => {
      it("mensaje de error contiene 'Unauthorized'", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("hacker@evil.com");

        const requireSuperAdmin = await getRequireSuperAdmin();

        await expect(requireSuperAdmin()).rejects.toThrow("Unauthorized");
      });

      it("mensaje de error contiene 'SuperAdmin'", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("hacker@evil.com");

        const requireSuperAdmin = await getRequireSuperAdmin();

        await expect(requireSuperAdmin()).rejects.toThrow("SuperAdmin");
      });

      it("mensaje de error es exacto", async () => {
        setSuperadminEmails("admin@test.com");
        mockAuthenticatedUser("hacker@evil.com");

        const requireSuperAdmin = await getRequireSuperAdmin();

        await expect(requireSuperAdmin()).rejects.toThrow(
          "Unauthorized: SuperAdmin access required"
        );
      });
    });

    describe("comportamiento con env var faltante", () => {
      it("lanza error si SUPERADMIN_EMAILS esta vacio", async () => {
        setSuperadminEmails("");
        mockAuthenticatedUser("admin@test.com");

        const requireSuperAdmin = await getRequireSuperAdmin();

        await expect(requireSuperAdmin()).rejects.toThrow(
          "Unauthorized: SuperAdmin access required"
        );
      });

      it("lanza error si SUPERADMIN_EMAILS es undefined", async () => {
        setSuperadminEmails(undefined);
        mockAuthenticatedUser("admin@test.com");

        const requireSuperAdmin = await getRequireSuperAdmin();

        await expect(requireSuperAdmin()).rejects.toThrow(
          "Unauthorized: SuperAdmin access required"
        );
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // getCurrentUserEmail
  // ═══════════════════════════════════════════════════════════════════════════

  describe("getCurrentUserEmail", () => {
    const getGetCurrentUserEmail = async () => {
      vi.resetModules();
      const module = await import("@/lib/superadmin");
      return module.getCurrentUserEmail;
    };

    it("retorna email del usuario autenticado", async () => {
      mockAuthenticatedUser("user@test.com");

      const getCurrentUserEmail = await getGetCurrentUserEmail();
      const result = await getCurrentUserEmail();

      expect(result).toBe("user@test.com");
    });

    it("retorna null si usuario no esta autenticado", async () => {
      mockUnauthenticatedUser();

      const getCurrentUserEmail = await getGetCurrentUserEmail();
      const result = await getCurrentUserEmail();

      expect(result).toBeNull();
    });

    it("retorna null si usuario no tiene email", async () => {
      mockUserWithoutEmail();

      const getCurrentUserEmail = await getGetCurrentUserEmail();
      const result = await getCurrentUserEmail();

      expect(result).toBeNull();
    });
  });
});
