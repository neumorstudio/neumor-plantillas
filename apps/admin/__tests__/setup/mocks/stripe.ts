/**
 * Mock de Stripe para tests
 *
 * Proporciona mocks para:
 * - Stripe SDK
 * - Webhooks (constructEvent, signature validation)
 * - Payment Intents
 */

import { vi } from "vitest";

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────

export interface MockPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "requires_payment_method" | "requires_confirmation" | "succeeded" | "canceled";
  metadata: Record<string, string>;
  client_secret: string;
}

export interface MockStripeEvent {
  id: string;
  type: string;
  data: {
    object: unknown;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESTADO MUTABLE PARA TESTS
// ─────────────────────────────────────────────────────────────────────────────

export const mockStripeState = {
  // Payment intents creados
  paymentIntents: new Map<string, MockPaymentIntent>(),

  // Simular firma valida/invalida
  webhookSignatureValid: true,

  // Ultimo evento de webhook procesado
  lastWebhookEvent: null as MockStripeEvent | null,

  // Reset state entre tests
  reset() {
    this.paymentIntents.clear();
    this.webhookSignatureValid = true;
    this.lastWebhookEvent = null;
  },

  // Helpers
  createPaymentIntent(overrides: Partial<MockPaymentIntent> = {}): MockPaymentIntent {
    const id = overrides.id ?? `pi_test_${Date.now()}`;
    const intent: MockPaymentIntent = {
      id,
      amount: overrides.amount ?? 1000,
      currency: overrides.currency ?? "eur",
      status: overrides.status ?? "requires_payment_method",
      metadata: overrides.metadata ?? {},
      client_secret: `${id}_secret_test`,
    };
    this.paymentIntents.set(id, intent);
    return intent;
  },

  setWebhookSignatureValid(valid: boolean) {
    this.webhookSignatureValid = valid;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DEL SDK DE STRIPE
// ─────────────────────────────────────────────────────────────────────────────

export const mockStripeClient = {
  paymentIntents: {
    create: vi.fn().mockImplementation(async (params: {
      amount: number;
      currency: string;
      metadata?: Record<string, string>;
    }) => {
      return mockStripeState.createPaymentIntent({
        amount: params.amount,
        currency: params.currency,
        metadata: params.metadata,
      });
    }),

    retrieve: vi.fn().mockImplementation(async (id: string) => {
      const intent = mockStripeState.paymentIntents.get(id);
      if (!intent) {
        throw new Error(`PaymentIntent ${id} not found`);
      }
      return intent;
    }),

    update: vi.fn().mockImplementation(async (id: string, params: Partial<MockPaymentIntent>) => {
      const intent = mockStripeState.paymentIntents.get(id);
      if (!intent) {
        throw new Error(`PaymentIntent ${id} not found`);
      }
      const updated = { ...intent, ...params };
      mockStripeState.paymentIntents.set(id, updated);
      return updated;
    }),

    cancel: vi.fn().mockImplementation(async (id: string) => {
      const intent = mockStripeState.paymentIntents.get(id);
      if (!intent) {
        throw new Error(`PaymentIntent ${id} not found`);
      }
      intent.status = "canceled";
      return intent;
    }),
  },

  webhooks: {
    constructEvent: vi.fn().mockImplementation((payload: string, sig: string, secret: string) => {
      if (!mockStripeState.webhookSignatureValid) {
        const error = new Error("Webhook signature verification failed");
        (error as unknown as Record<string, unknown>).type = "StripeSignatureVerificationError";
        throw error;
      }

      // Parsear el payload y retornar como evento
      const event = JSON.parse(payload) as MockStripeEvent;
      mockStripeState.lastWebhookEvent = event;
      return event;
    }),
  },

  customers: {
    create: vi.fn().mockResolvedValue({ id: "cus_test_123" }),
    retrieve: vi.fn().mockResolvedValue({ id: "cus_test_123", email: "test@test.com" }),
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DEL MODULO STRIPE
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("stripe", () => {
  return {
    default: vi.fn(() => mockStripeClient),
    Stripe: vi.fn(() => mockStripeClient),
  };
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS PARA TESTS
// ─────────────────────────────────────────────────────────────────────────────

export const stripeTestHelpers = {
  /**
   * Crear un Payment Intent mock
   */
  createPaymentIntent(overrides: Partial<MockPaymentIntent> = {}) {
    return mockStripeState.createPaymentIntent(overrides);
  },

  /**
   * Simular firma de webhook valida
   */
  setWebhookSignatureValid() {
    mockStripeState.setWebhookSignatureValid(true);
  },

  /**
   * Simular firma de webhook invalida
   */
  setWebhookSignatureInvalid() {
    mockStripeState.setWebhookSignatureValid(false);
  },

  /**
   * Crear un evento de webhook mock
   */
  createWebhookEvent(
    type: string,
    data: unknown,
    id = `evt_test_${Date.now()}`
  ): MockStripeEvent {
    return {
      id,
      type,
      data: { object: data },
    };
  },

  /**
   * Crear payload y headers para simular webhook request
   */
  createWebhookRequest(event: MockStripeEvent) {
    const payload = JSON.stringify(event);
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = `t=${timestamp},v1=fake_signature_for_testing`;

    return {
      payload,
      headers: {
        "stripe-signature": signature,
      },
    };
  },

  /**
   * Reset todos los mocks
   */
  reset() {
    mockStripeState.reset();
    vi.clearAllMocks();
  },
};
