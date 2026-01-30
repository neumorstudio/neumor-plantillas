/**
 * Setup global para tests
 *
 * Este archivo se ejecuta antes de cada test suite.
 * Configura mocks globales y variables de entorno de test.
 */

import { vi, beforeAll, afterAll, afterEach } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// VARIABLES DE ENTORNO DE TEST
// ─────────────────────────────────────────────────────────────────────────────

// Configurar env vars ANTES de que se importen los modulos
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-role-key";
process.env.SUPERADMIN_EMAILS = "admin@test.com,superadmin@test.com";
process.env.TOKEN_ENCRYPTION_KEY = "0".repeat(64); // 32 bytes hex para tests
process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_fake_secret";
process.env.RESEND_API_KEY = "re_test_fake_key";
process.env.NODE_ENV = "test";

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTAR MOCKS
// ─────────────────────────────────────────────────────────────────────────────

import "./mocks/supabase";
import "./mocks/next";
import "./mocks/stripe";

// ─────────────────────────────────────────────────────────────────────────────
// LIFECYCLE HOOKS
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  // Setup global antes de todos los tests
});

afterEach(() => {
  // Limpiar mocks despues de cada test
  vi.clearAllMocks();
});

afterAll(() => {
  // Cleanup global despues de todos los tests
  vi.restoreAllMocks();
});
