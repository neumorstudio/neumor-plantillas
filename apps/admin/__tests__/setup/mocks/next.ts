/**
 * Mock de Next.js para tests
 *
 * Proporciona mocks para:
 * - next/headers (cookies, headers)
 * - next/navigation (redirect, useRouter)
 * - NextRequest / NextResponse
 */

import { vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO MUTABLE PARA TESTS
// ─────────────────────────────────────────────────────────────────────────────

export const mockNextState = {
  // Cookies almacenadas
  cookies: new Map<string, string>(),

  // Headers almacenados
  headers: new Map<string, string>(),

  // Ultima redireccion
  lastRedirect: null as string | null,

  // Reset state entre tests
  reset() {
    this.cookies.clear();
    this.headers.clear();
    this.lastRedirect = null;
  },

  // Helpers
  setCookie(name: string, value: string) {
    this.cookies.set(name, value);
  },

  setHeader(name: string, value: string) {
    this.headers.set(name, value);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DE COOKIES
// ─────────────────────────────────────────────────────────────────────────────

export const mockCookieStore = {
  get: vi.fn((name: string) => {
    const value = mockNextState.cookies.get(name);
    return value ? { name, value } : undefined;
  }),

  getAll: vi.fn(() => {
    return Array.from(mockNextState.cookies.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }),

  set: vi.fn((name: string, value: string) => {
    mockNextState.cookies.set(name, value);
  }),

  delete: vi.fn((name: string) => {
    mockNextState.cookies.delete(name);
  }),

  has: vi.fn((name: string) => {
    return mockNextState.cookies.has(name);
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DE HEADERS
// ─────────────────────────────────────────────────────────────────────────────

export const mockHeadersStore = {
  get: vi.fn((name: string) => mockNextState.headers.get(name) ?? null),

  getAll: vi.fn((name: string) => {
    const value = mockNextState.headers.get(name);
    return value ? [value] : [];
  }),

  has: vi.fn((name: string) => mockNextState.headers.has(name)),

  entries: vi.fn(() => mockNextState.headers.entries()),

  forEach: vi.fn((callback: (value: string, key: string) => void) => {
    mockNextState.headers.forEach(callback);
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DE NEXT/HEADERS
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => mockCookieStore),
  headers: vi.fn(() => mockHeadersStore),
}));

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DE NEXT/NAVIGATION
// ─────────────────────────────────────────────────────────────────────────────

export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    mockNextState.lastRedirect = url;
    // Simular el comportamiento de redirect (throw para detener ejecucion)
    const error = new Error("NEXT_REDIRECT");
    (error as unknown as Record<string, unknown>).digest = `NEXT_REDIRECT;${url}`;
    throw error;
  }),

  useRouter: vi.fn(() => mockRouter),

  usePathname: vi.fn(() => "/"),

  useSearchParams: vi.fn(() => new URLSearchParams()),

  notFound: vi.fn(() => {
    const error = new Error("NEXT_NOT_FOUND");
    (error as unknown as Record<string, unknown>).digest = "NEXT_NOT_FOUND";
    throw error;
  }),
}));

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DE NextRequest / NextResponse
// ─────────────────────────────────────────────────────────────────────────────

export class MockNextRequest {
  url: string;
  method: string;
  headers: Headers;
  nextUrl: URL;
  cookies: Map<string, { name: string; value: string }>;

  constructor(url: string, init?: { method?: string; headers?: Record<string, string> }) {
    this.url = url;
    this.method = init?.method ?? "GET";
    this.headers = new Headers(init?.headers);
    this.nextUrl = new URL(url);
    this.cookies = new Map();
  }

  json() {
    return Promise.resolve({});
  }

  text() {
    return Promise.resolve("");
  }
}

export class MockNextResponse {
  status: number;
  headers: Headers;
  body: unknown;

  constructor(body?: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    this.body = body;
    this.status = init?.status ?? 200;
    this.headers = new Headers(init?.headers);
  }

  static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    const response = new MockNextResponse(JSON.stringify(data), init);
    response.headers.set("content-type", "application/json");
    return response;
  }

  static redirect(url: string | URL, status = 307) {
    const response = new MockNextResponse(null, { status });
    response.headers.set("location", url.toString());
    return response;
  }

  static next(init?: { headers?: Record<string, string> }) {
    return new MockNextResponse(null, { status: 200, headers: init?.headers });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS PARA TESTS
// ─────────────────────────────────────────────────────────────────────────────

export const nextTestHelpers = {
  /**
   * Crear un MockNextRequest para testing de middleware/API routes
   */
  createRequest(
    url: string,
    options?: {
      method?: string;
      headers?: Record<string, string>;
      cookies?: Record<string, string>;
    }
  ) {
    const request = new MockNextRequest(url, {
      method: options?.method,
      headers: options?.headers,
    });

    if (options?.cookies) {
      Object.entries(options.cookies).forEach(([name, value]) => {
        request.cookies.set(name, { name, value });
      });
    }

    return request;
  },

  /**
   * Verificar que hubo redireccion a URL especifica
   */
  assertRedirectedTo(url: string) {
    if (mockNextState.lastRedirect !== url) {
      throw new Error(
        `Expected redirect to "${url}" but got "${mockNextState.lastRedirect}"`
      );
    }
  },

  /**
   * Reset todos los mocks
   */
  reset() {
    mockNextState.reset();
    vi.clearAllMocks();
  },
};
