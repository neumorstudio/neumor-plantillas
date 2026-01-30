/**
 * Mock de Supabase para tests
 *
 * Proporciona mocks controlables para:
 * - createClient (cliente browser)
 * - createServerClient (cliente server con cookies)
 * - Operaciones de base de datos (select, insert, update, delete)
 * - Autenticacion (getUser, signIn, signOut)
 */

import { vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  email: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}

export interface MockQueryResult<T = unknown> {
  data: T | null;
  error: { message: string; code: string } | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO MUTABLE PARA TESTS
// ─────────────────────────────────────────────────────────────────────────────

export const mockSupabaseState = {
  // Usuario autenticado actual (null = no autenticado)
  currentUser: null as MockUser | null,

  // Datos mock para queries
  queryResults: new Map<string, MockQueryResult>(),

  // Reset state entre tests
  reset() {
    this.currentUser = null;
    this.queryResults.clear();
  },

  // Helpers para configurar estado
  setUser(user: MockUser | null) {
    this.currentUser = user;
  },

  setQueryResult<T>(table: string, result: MockQueryResult<T>) {
    this.queryResults.set(table, result as MockQueryResult);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DEL CLIENTE SUPABASE
// ─────────────────────────────────────────────────────────────────────────────

const createMockQueryBuilder = () => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockReturnThis(),

    // Resolver la query - retorna el resultado configurado o default
    then: vi.fn((resolve) => {
      resolve({ data: null, error: null });
    }),
  };

  return builder;
};

export const mockSupabaseClient = {
  auth: {
    getUser: vi.fn().mockImplementation(async () => {
      if (mockSupabaseState.currentUser) {
        return { data: { user: mockSupabaseState.currentUser }, error: null };
      }
      return { data: { user: null }, error: null };
    }),

    getSession: vi.fn().mockImplementation(async () => {
      if (mockSupabaseState.currentUser) {
        return {
          data: {
            session: {
              user: mockSupabaseState.currentUser,
              access_token: "mock-access-token",
            },
          },
          error: null,
        };
      }
      return { data: { session: null }, error: null };
    }),

    signInWithPassword: vi.fn(),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },

  from: vi.fn().mockImplementation((table: string) => {
    const builder = createMockQueryBuilder();

    // Si hay un resultado configurado para esta tabla, usarlo
    const configuredResult = mockSupabaseState.queryResults.get(table);
    if (configuredResult) {
      builder.then = vi.fn((resolve) => resolve(configuredResult));
    }

    return builder;
  }),

  rpc: vi.fn(),
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCKS DE MODULOS
// ─────────────────────────────────────────────────────────────────────────────

// Mock de @supabase/ssr
vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
  createBrowserClient: vi.fn(() => mockSupabaseClient),
}));

// Mock de @supabase/supabase-js
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS PARA TESTS
// ─────────────────────────────────────────────────────────────────────────────

export const supabaseTestHelpers = {
  /**
   * Simular usuario autenticado
   */
  mockAuthenticatedUser(user: Partial<MockUser> = {}) {
    const fullUser: MockUser = {
      id: user.id ?? "test-user-id",
      email: user.email ?? "user@test.com",
      app_metadata: user.app_metadata ?? {},
      user_metadata: user.user_metadata ?? {},
    };
    mockSupabaseState.setUser(fullUser);
    return fullUser;
  },

  /**
   * Simular usuario no autenticado
   */
  mockUnauthenticated() {
    mockSupabaseState.setUser(null);
  },

  /**
   * Simular resultado de query
   */
  mockQueryResult<T>(table: string, data: T, error: MockQueryResult["error"] = null) {
    mockSupabaseState.setQueryResult(table, { data, error });
  },

  /**
   * Simular error de query
   */
  mockQueryError(table: string, message: string, code = "PGRST000") {
    mockSupabaseState.setQueryResult(table, {
      data: null,
      error: { message, code },
    });
  },

  /**
   * Reset todos los mocks
   */
  reset() {
    mockSupabaseState.reset();
    vi.clearAllMocks();
  },
};
