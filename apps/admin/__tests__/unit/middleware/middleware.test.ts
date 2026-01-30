/**
 * Tests exhaustivos para el middleware de autenticacion y permisos
 *
 * Archivo bajo test: apps/admin/src/middleware.ts
 *
 * El middleware maneja:
 * - Proteccion de rutas /dashboard (requiere autenticacion)
 * - Proteccion de rutas /super (requiere autenticacion + superadmin)
 * - Forzar cambio de password en primer login
 * - Redirects post-login basados en rol
 * - Separacion entre dashboard normal y panel superadmin
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

interface MockUser {
  id: string;
  email: string;
  user_metadata?: {
    must_change_password?: boolean;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO MUTABLE PARA TESTS
// ─────────────────────────────────────────────────────────────────────────────

let mockUser: MockUser | null = null;
const originalEnv = { ...process.env };

// ─────────────────────────────────────────────────────────────────────────────
// MOCKS
// ─────────────────────────────────────────────────────────────────────────────

// Mock de @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockImplementation(async () => ({
        data: { user: mockUser },
        error: null,
      })),
    },
  })),
}));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

function createMockRequest(
  pathname: string,
  options?: {
    method?: string;
    cookies?: Record<string, string>;
    headers?: Record<string, string>;
  }
): NextRequest {
  const url = `http://localhost:3001${pathname}`;
  const request = new NextRequest(url, {
    method: options?.method || "GET",
    headers: options?.headers,
  });

  // Agregar cookies si se proporcionan
  if (options?.cookies) {
    Object.entries(options.cookies).forEach(([name, value]) => {
      request.cookies.set(name, value);
    });
  }

  return request;
}

function setMockUser(user: MockUser | null) {
  mockUser = user;
}

function mockAuthenticatedUser(
  email: string,
  metadata?: { must_change_password?: boolean }
) {
  setMockUser({
    id: "user-123",
    email,
    user_metadata: metadata,
  });
}

function mockUnauthenticated() {
  setMockUser(null);
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe("Admin Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = null;

    // Configurar env vars de test
    setEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    setEnv("SUPERADMIN_EMAILS", "admin@test.com,superadmin@test.com");
  });

  afterEach(() => {
    // Restaurar env original
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  // Importacion dinamica para que use los mocks
  const getMiddleware = async () => {
    vi.resetModules();
    const module = await import("@/middleware");
    return module.middleware;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTENTICACION - Rutas protegidas basicas
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Autenticacion", () => {
    describe("rutas /dashboard", () => {
      it("redirige a /login si no hay sesion", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/dashboard");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307); // Redirect
        expect(response.headers.get("location")).toContain("/login");
      });

      it("redirige a /login desde subrutas de dashboard", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/dashboard/settings");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/login");
      });

      it("permite acceso si usuario autenticado", async () => {
        mockAuthenticatedUser("user@test.com");
        const request = createMockRequest("/dashboard");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        // No deberia ser redirect
        expect(response.status).toBe(200);
      });

      it("permite acceso a subrutas si usuario autenticado", async () => {
        mockAuthenticatedUser("user@test.com");
        const request = createMockRequest("/dashboard/calendario");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });
    });

    describe("ruta /change-password", () => {
      it("redirige a /login si no autenticado", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/change-password");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/login");
      });

      it("permite acceso si usuario autenticado", async () => {
        mockAuthenticatedUser("user@test.com");
        const request = createMockRequest("/change-password");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });
    });

    describe("rutas publicas", () => {
      it("permite acceso a /login sin autenticacion", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/login");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });

      it("permite acceso a ruta raiz sin autenticacion", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUPERADMIN - Rutas /super
  // ═══════════════════════════════════════════════════════════════════════════

  describe("SuperAdmin", () => {
    describe("acceso a /super", () => {
      it("redirige a /login si no autenticado", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/login");
      });

      it("retorna 403 si autenticado pero NO es superadmin", async () => {
        mockAuthenticatedUser("normal@test.com");
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(403);
      });

      it("permite acceso si es superadmin", async () => {
        mockAuthenticatedUser("admin@test.com"); // Esta en SUPERADMIN_EMAILS
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });

      it("permite acceso a subrutas /super/* si es superadmin", async () => {
        mockAuthenticatedUser("superadmin@test.com");
        const request = createMockRequest("/super/users");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });
    });

    describe("mensaje de error 403", () => {
      it("contiene mensaje descriptivo", async () => {
        mockAuthenticatedUser("hacker@evil.com");
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(403);
        const text = await response.text();
        expect(text).toContain("Forbidden");
        expect(text).toContain("SuperAdmin");
      });
    });

    describe("case sensitivity de email", () => {
      it("acepta email en mayusculas", async () => {
        setEnv("SUPERADMIN_EMAILS", "admin@test.com");
        mockAuthenticatedUser("ADMIN@TEST.COM");
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });

      it("acepta email con case mixto", async () => {
        setEnv("SUPERADMIN_EMAILS", "Admin@Test.COM");
        mockAuthenticatedUser("admin@test.com");
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });
    });

    describe("superadmin no accede a dashboard normal", () => {
      it("redirige superadmin de /dashboard a /super", async () => {
        mockAuthenticatedUser("admin@test.com");
        const request = createMockRequest("/dashboard");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/super");
      });

      it("redirige superadmin de subrutas dashboard a /super", async () => {
        mockAuthenticatedUser("superadmin@test.com");
        const request = createMockRequest("/dashboard/settings");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/super");
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // REDIRECT POST-LOGIN
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Redirect post-login", () => {
    it("redirige usuario normal de /login a /dashboard", async () => {
      mockAuthenticatedUser("normal@test.com");
      const request = createMockRequest("/login");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/dashboard");
    });

    it("redirige superadmin de /login a /super", async () => {
      mockAuthenticatedUser("admin@test.com");
      const request = createMockRequest("/login");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/super");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FORZAR CAMBIO DE PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Forzar cambio de password", () => {
    it("redirige a /change-password desde /dashboard si must_change_password", async () => {
      mockAuthenticatedUser("user@test.com", { must_change_password: true });
      const request = createMockRequest("/dashboard");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/change-password");
    });

    it("redirige a /change-password desde /super si must_change_password", async () => {
      mockAuthenticatedUser("admin@test.com", { must_change_password: true });
      const request = createMockRequest("/super");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/change-password");
    });

    it("redirige a /change-password desde /login si must_change_password", async () => {
      mockAuthenticatedUser("user@test.com", { must_change_password: true });
      const request = createMockRequest("/login");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toContain("/change-password");
    });

    it("permite permanecer en /change-password si must_change_password", async () => {
      mockAuthenticatedUser("user@test.com", { must_change_password: true });
      const request = createMockRequest("/change-password");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it("no redirige si must_change_password es false", async () => {
      mockAuthenticatedUser("user@test.com", { must_change_password: false });
      const request = createMockRequest("/dashboard");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });

    it("no redirige si user_metadata no existe", async () => {
      mockAuthenticatedUser("user@test.com");
      const request = createMockRequest("/dashboard");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      expect(response.status).toBe(200);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Edge cases", () => {
    describe("env vars faltantes o vacias", () => {
      it("deniega acceso a /super si SUPERADMIN_EMAILS esta vacio", async () => {
        setEnv("SUPERADMIN_EMAILS", "");
        mockAuthenticatedUser("admin@test.com");
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(403);
      });

      it("deniega acceso a /super si SUPERADMIN_EMAILS es undefined", async () => {
        setEnv("SUPERADMIN_EMAILS", undefined);
        mockAuthenticatedUser("admin@test.com");
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(403);
      });
    });

    describe("metodos HTTP", () => {
      it("maneja request POST a ruta protegida", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/dashboard", { method: "POST" });

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/login");
      });

      it("maneja request PUT a ruta protegida", async () => {
        mockAuthenticatedUser("user@test.com");
        const request = createMockRequest("/dashboard/api", { method: "PUT" });

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });

      it("maneja request DELETE a ruta protegida", async () => {
        mockAuthenticatedUser("user@test.com");
        const request = createMockRequest("/dashboard/item", {
          method: "DELETE",
        });

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });
    });

    describe("rutas edge", () => {
      it("maneja ruta con query params", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/dashboard?tab=settings&id=123");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307);
        expect(response.headers.get("location")).toContain("/login");
      });

      it("maneja ruta con hash fragment", async () => {
        mockAuthenticatedUser("user@test.com");
        const request = createMockRequest("/dashboard#section");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });

      it("maneja ruta /dashboard exacta vs /dashboard/", async () => {
        mockUnauthenticated();
        const request1 = createMockRequest("/dashboard");
        const request2 = createMockRequest("/dashboard/");

        const middleware = await getMiddleware();
        const response1 = await middleware(request1);
        const response2 = await middleware(request2);

        // Ambas deben redirigir
        expect(response1.status).toBe(307);
        expect(response2.status).toBe(307);
      });

      it("/dashboardx NO debe considerarse ruta protegida de dashboard", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/dashboardx");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        // /dashboardx NO es /dashboard ni /dashboard/*
        expect(response.status).toBe(200);
      });

      it("/dashboard-admin NO debe considerarse ruta protegida de dashboard", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/dashboard-admin");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        // /dashboard-admin NO es /dashboard ni /dashboard/*
        expect(response.status).toBe(200);
      });

      it("/superx NO debe considerarse ruta protegida de super", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/superx");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        // /superx NO es /super ni /super/*
        expect(response.status).toBe(200);
      });

      it("/super-admin NO debe considerarse ruta protegida de super", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/super-admin");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        // /super-admin NO es /super ni /super/*
        expect(response.status).toBe(200);
      });
    });

    describe("usuarios con email null/undefined", () => {
      it("trata usuario sin email como no-superadmin", async () => {
        setMockUser({
          id: "user-123",
          email: "", // Email vacio
        });
        const request = createMockRequest("/super");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(403);
      });
    });

    describe("cookies y headers", () => {
      it("procesa request con cookies de sesion", async () => {
        mockAuthenticatedUser("user@test.com");
        const request = createMockRequest("/dashboard", {
          cookies: {
            "sb-access-token": "fake-token",
            "sb-refresh-token": "fake-refresh",
          },
        });

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });

      it("procesa request sin cookies", async () => {
        mockUnauthenticated();
        const request = createMockRequest("/dashboard");

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(307);
      });

      it("procesa request con headers custom", async () => {
        mockAuthenticatedUser("user@test.com");
        const request = createMockRequest("/dashboard", {
          headers: {
            "x-custom-header": "test-value",
            "user-agent": "TestBot/1.0",
          },
        });

        const middleware = await getMiddleware();
        const response = await middleware(request);

        expect(response.status).toBe(200);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SEGURIDAD
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Seguridad", () => {
    it("no expone informacion sensible en redirect a login", async () => {
      mockUnauthenticated();
      const request = createMockRequest("/dashboard/admin/secrets");

      const middleware = await getMiddleware();
      const response = await middleware(request);

      const location = response.headers.get("location") || "";
      // No debe incluir la ruta original en el redirect
      expect(location).not.toContain("secrets");
      expect(location).not.toContain("admin");
    });

    it("no permite bypass de /super con caracteres especiales", async () => {
      mockAuthenticatedUser("normal@test.com");

      const paths = ["/super", "/super/", "/super/users", "/super/../super"];

      const middleware = await getMiddleware();

      for (const path of paths) {
        const request = createMockRequest(path);
        const response = await middleware(request);
        // Todos deben ser 403 para usuario no-superadmin
        expect(response.status).toBe(403);
      }
    });

    it("mantiene 403 consistente sin revelar existencia de rutas", async () => {
      mockAuthenticatedUser("normal@test.com");

      const paths = [
        "/super",
        "/super/users",
        "/super/nonexistent",
        "/super/admin/secret",
      ];

      const middleware = await getMiddleware();

      for (const path of paths) {
        const request = createMockRequest(path);
        const response = await middleware(request);
        // Todos retornan 403 sin revelar si la ruta existe
        expect(response.status).toBe(403);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIG MATCHER
  // ═══════════════════════════════════════════════════════════════════════════

  describe("Config matcher", () => {
    it("exporta config con matcher correcto", async () => {
      vi.resetModules();
      const module = await import("@/middleware");

      expect(module.config).toBeDefined();
      expect(module.config.matcher).toBeDefined();
      expect(Array.isArray(module.config.matcher)).toBe(true);
    });
  });
});
