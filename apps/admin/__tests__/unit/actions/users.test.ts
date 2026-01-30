/**
 * Tests para apps/admin/src/lib/actions/users.ts
 *
 * Estos tests verifican:
 * - Filtrado de superadmin emails en getUsers()
 * - Parsing robusto (coma/espacios/case)
 * - Fail-safe si env var falta/vacia
 * - Consistencia con SUPERADMIN_EMAILS (no SUPER_ADMIN_EMAILS)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────────────────────

// Mock de requireSuperAdmin
vi.mock("@/lib/superadmin", () => ({
  requireSuperAdmin: vi.fn().mockResolvedValue(undefined),
}));

// Mock de revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock de supabase client
const mockListUsers = vi.fn();
const mockFromSelect = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {
      admin: {
        listUsers: mockListUsers,
        createUser: vi.fn(),
        updateUserById: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
    from: vi.fn(() => ({
      select: mockFromSelect,
    })),
  })),
}));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Guardar valores originales
const originalSuperadminEmails = process.env.SUPERADMIN_EMAILS;

function setEnvVars(vars: { SUPERADMIN_EMAILS?: string; SUPER_ADMIN_EMAILS?: string }) {
  // SUPERADMIN_EMAILS es la variable correcta que se usa en produccion
  if (vars.SUPERADMIN_EMAILS === undefined) {
    delete process.env.SUPERADMIN_EMAILS;
  } else {
    process.env.SUPERADMIN_EMAILS = vars.SUPERADMIN_EMAILS;
  }
  // SUPER_ADMIN_EMAILS (legacy) - solo para tests de consistencia
  if (vars.SUPER_ADMIN_EMAILS === undefined) {
    delete process.env.SUPER_ADMIN_EMAILS;
  } else {
    process.env.SUPER_ADMIN_EMAILS = vars.SUPER_ADMIN_EMAILS;
  }
}

function mockAuthUsers(users: Array<{ id: string; email: string; created_at: string; last_sign_in_at?: string }>) {
  mockListUsers.mockResolvedValue({
    data: { users },
    error: null,
  });
}

function mockClients(clients: Array<{ id: string; business_name: string; business_type: string; auth_user_id: string | null }>) {
  mockFromSelect.mockReturnValue({
    data: clients,
    error: null,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("users.ts - getUsers()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup env var por defecto (solo SUPERADMIN_EMAILS)
    setEnvVars({ SUPERADMIN_EMAILS: "superadmin@test.com" });
  });

  afterEach(() => {
    // Restaurar valor original
    if (originalSuperadminEmails !== undefined) {
      process.env.SUPERADMIN_EMAILS = originalSuperadminEmails;
    } else {
      delete process.env.SUPERADMIN_EMAILS;
    }
    // Limpiar variable legacy por si algun test la seteo
    delete process.env.SUPER_ADMIN_EMAILS;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Filtrado basico de superadmin
  // ═══════════════════════════════════════════════════════════════════════════

  describe("filtrado basico de superadmin", () => {
    it("excluye usuarios superadmin de la lista", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "admin@company.com" });

      mockAuthUsers([
        { id: "1", email: "admin@company.com", created_at: "2024-01-01" },
        { id: "2", email: "user@company.com", created_at: "2024-01-02" },
        { id: "3", email: "other@company.com", created_at: "2024-01-03" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      // El superadmin NO debe aparecer en la lista
      expect(result).toHaveLength(2);
      expect(result.map((u) => u.email)).not.toContain("admin@company.com");
      expect(result.map((u) => u.email)).toContain("user@company.com");
      expect(result.map((u) => u.email)).toContain("other@company.com");
    });

    it("incluye todos los usuarios si no hay superadmin configurado", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "" });

      mockAuthUsers([
        { id: "1", email: "user1@test.com", created_at: "2024-01-01" },
        { id: "2", email: "user2@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(2);
    });

    it("excluye multiples superadmins", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "admin1@test.com,admin2@test.com" });

      mockAuthUsers([
        { id: "1", email: "admin1@test.com", created_at: "2024-01-01" },
        { id: "2", email: "admin2@test.com", created_at: "2024-01-02" },
        { id: "3", email: "user@test.com", created_at: "2024-01-03" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("user@test.com");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Case-insensitivity
  // ═══════════════════════════════════════════════════════════════════════════

  describe("case-insensitivity", () => {
    it("excluye superadmin independiente del case en env var", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "ADMIN@TEST.COM" });

      mockAuthUsers([
        { id: "1", email: "admin@test.com", created_at: "2024-01-01" },
        { id: "2", email: "user@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("user@test.com");
    });

    it("excluye superadmin independiente del case en user email", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "admin@test.com" });

      mockAuthUsers([
        { id: "1", email: "ADMIN@TEST.COM", created_at: "2024-01-01" },
        { id: "2", email: "user@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("user@test.com");
    });

    it("excluye superadmin con mixed case", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "Admin@Test.Com" });

      mockAuthUsers([
        { id: "1", email: "aDMIN@tEST.cOM", created_at: "2024-01-01" },
        { id: "2", email: "user@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Trimming de espacios
  // ═══════════════════════════════════════════════════════════════════════════

  describe("trimming de espacios", () => {
    it("excluye superadmin con espacios al inicio de env var", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: " admin@test.com" });

      mockAuthUsers([
        { id: "1", email: "admin@test.com", created_at: "2024-01-01" },
        { id: "2", email: "user@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("user@test.com");
    });

    it("excluye superadmin con espacios alrededor de comas", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "admin1@test.com , admin2@test.com , admin3@test.com" });

      mockAuthUsers([
        { id: "1", email: "admin2@test.com", created_at: "2024-01-01" },
        { id: "2", email: "user@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("user@test.com");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Fail-safe con env var faltante/vacia
  // ═══════════════════════════════════════════════════════════════════════════

  describe("fail-safe con env var faltante/vacia", () => {
    it("no falla si SUPERADMIN_EMAILS es undefined", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: undefined });

      mockAuthUsers([
        { id: "1", email: "user@test.com", created_at: "2024-01-01" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");

      // No debe lanzar error
      await expect(getUsers()).resolves.toBeDefined();
    });

    it("no falla si SUPERADMIN_EMAILS es string vacio", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "" });

      mockAuthUsers([
        { id: "1", email: "user@test.com", created_at: "2024-01-01" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");

      await expect(getUsers()).resolves.toBeDefined();
    });

    it("retorna todos los usuarios si env var esta vacia", async () => {
      setEnvVars({ SUPERADMIN_EMAILS: "" });

      mockAuthUsers([
        { id: "1", email: "anyone@test.com", created_at: "2024-01-01" },
        { id: "2", email: "admin@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      // Sin filtro, todos los usuarios deben aparecer
      expect(result).toHaveLength(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Consistencia de env var (POST-FIX)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("consistencia de env var - usa SOLO SUPERADMIN_EMAILS", () => {
    it("usa SUPERADMIN_EMAILS para filtrar superadmins", async () => {
      // Solo configurar SUPERADMIN_EMAILS (la variable correcta)
      setEnvVars({
        SUPER_ADMIN_EMAILS: undefined,  // NO debe afectar
        SUPERADMIN_EMAILS: "admin@test.com",  // ESTA es la que se usa
      });

      mockAuthUsers([
        { id: "1", email: "admin@test.com", created_at: "2024-01-01" },
        { id: "2", email: "user@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      // El superadmin DEBE ser filtrado usando SUPERADMIN_EMAILS
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("user@test.com");
      expect(result.map((u) => u.email)).not.toContain("admin@test.com");
    });

    it("SUPER_ADMIN_EMAILS (con underscore extra) NO afecta el resultado", async () => {
      // Configurar SOLO la variable legacy (incorrecta)
      setEnvVars({
        SUPER_ADMIN_EMAILS: "admin@test.com",  // NO debe tener efecto
        SUPERADMIN_EMAILS: undefined,  // NO configurada
      });

      mockAuthUsers([
        { id: "1", email: "admin@test.com", created_at: "2024-01-01" },
        { id: "2", email: "user@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      // SUPER_ADMIN_EMAILS NO debe filtrar nada (se ignora)
      expect(result).toHaveLength(2);
      expect(result.map((u) => u.email)).toContain("admin@test.com");
      expect(result.map((u) => u.email)).toContain("user@test.com");
    });

    it("consistente con superadmin.ts - ambos usan SUPERADMIN_EMAILS", async () => {
      // Verificar que usa la misma variable que superadmin.ts
      setEnvVars({
        SUPERADMIN_EMAILS: "shared-admin@test.com",
      });

      mockAuthUsers([
        { id: "1", email: "shared-admin@test.com", created_at: "2024-01-01" },
        { id: "2", email: "regular@test.com", created_at: "2024-01-02" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      // El superadmin configurado en SUPERADMIN_EMAILS es filtrado
      expect(result).toHaveLength(1);
      expect(result[0].email).toBe("regular@test.com");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Asociacion con clientes
  // ═══════════════════════════════════════════════════════════════════════════

  describe("asociacion con clientes", () => {
    it("incluye datos del cliente cuando existe asociacion", async () => {
      setEnvVars({ SUPER_ADMIN_EMAILS: "" });

      mockAuthUsers([
        { id: "user-1", email: "user@test.com", created_at: "2024-01-01" },
      ]);
      mockClients([
        { id: "client-1", business_name: "Mi Negocio", business_type: "salon", auth_user_id: "user-1" },
      ]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].client).not.toBeNull();
      expect(result[0].client?.business_name).toBe("Mi Negocio");
      expect(result[0].client?.business_type).toBe("salon");
    });

    it("retorna null para cliente cuando no hay asociacion", async () => {
      setEnvVars({ SUPER_ADMIN_EMAILS: "" });

      mockAuthUsers([
        { id: "user-1", email: "user@test.com", created_at: "2024-01-01" },
      ]);
      mockClients([
        { id: "client-1", business_name: "Otro Negocio", business_type: "restaurant", auth_user_id: "other-user" },
      ]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result).toHaveLength(1);
      expect(result[0].client).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Ordenamiento
  // ═══════════════════════════════════════════════════════════════════════════

  describe("ordenamiento", () => {
    it("ordena usuarios por fecha de creacion descendente (mas reciente primero)", async () => {
      setEnvVars({ SUPER_ADMIN_EMAILS: "" });

      mockAuthUsers([
        { id: "1", email: "oldest@test.com", created_at: "2024-01-01T00:00:00Z" },
        { id: "2", email: "middle@test.com", created_at: "2024-06-01T00:00:00Z" },
        { id: "3", email: "newest@test.com", created_at: "2024-12-01T00:00:00Z" },
      ]);
      mockClients([]);

      vi.resetModules();
      const { getUsers } = await import("@/lib/actions/users");
      const result = await getUsers();

      expect(result[0].email).toBe("newest@test.com");
      expect(result[1].email).toBe("middle@test.com");
      expect(result[2].email).toBe("oldest@test.com");
    });
  });
});
