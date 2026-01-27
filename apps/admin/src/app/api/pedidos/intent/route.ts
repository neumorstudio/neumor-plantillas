import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  isPlainObject,
  hasUnknownKeys,
  isValidUuid,
} from "@neumorstudio/api-utils/validation";
import {
  isAllowedOrigin,
  buildCorsHeaders,
  getCorsHeadersForOrigin,
} from "@neumorstudio/api-utils/cors";
import {
  checkRateLimit,
  getClientIp,
  getRateLimitKey,
  rateLimitPresets,
} from "@neumorstudio/api-utils/rate-limit";

interface OrderItemInput {
  id: string;
  quantity: number;
}

interface OrderIntentPayload {
  website_id: string;
  items: OrderItemInput[];
  customer: {
    name: string;
    email?: string;
    phone?: string;
  };
  pickup_date: string;
  pickup_time: string;
  notes?: string;
}

const allowedPayloadKeys = new Set([
  "website_id",
  "items",
  "customer",
  "pickup_date",
  "pickup_time",
  "notes",
]);
const allowedCustomerKeys = new Set(["name", "email", "phone"]);
const allowedItemKeys = new Set(["id", "quantity"]);

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

async function getCorsHeaders(origin: string | null) {
  return getCorsHeadersForOrigin(
    origin,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type PaymentMode = "stripe" | "local";

function resolvePaymentMode(websiteConfig: unknown): PaymentMode {
  if (!websiteConfig || typeof websiteConfig !== "object") {
    return "stripe";
  }
  const config = websiteConfig as Record<string, unknown>;
  const restaurant = config.restaurant as Record<string, unknown> | undefined;
  const orders = (restaurant?.orders as Record<string, unknown> | undefined) ?? (config.orders as Record<string, unknown> | undefined);
  const mode = typeof orders?.paymentMode === "string" ? orders.paymentMode.toLowerCase() : "";
  if (mode === "local" || mode === "cash" || mode === "in_person") {
    return "local";
  }
  return "stripe";
}

function isOrdersEnabled(websiteConfig: unknown): boolean {
  if (!websiteConfig || typeof websiteConfig !== "object") {
    return true;
  }
  const config = websiteConfig as Record<string, unknown>;
  const restaurant = config.restaurant as Record<string, unknown> | undefined;
  const orders = (restaurant?.orders as Record<string, unknown> | undefined) ?? (config.orders as Record<string, unknown> | undefined);
  if (typeof orders?.enabled === "boolean") {
    return orders.enabled;
  }
  return true;
}

function normalizeItems(items: OrderItemInput[]) {
  if (!Array.isArray(items)) return [];
  const map = new Map<string, number>();
  items.forEach((item) => {
    // Math.floor previene floats que podrían causar problemas en Stripe
    const quantity = Math.floor(Math.max(0, Number(item.quantity) || 0));
    const id = typeof item.id === "string" ? item.id : "";
    if (!id || quantity <= 0) return;
    map.set(id, (map.get(id) || 0) + quantity);
  });
  return Array.from(map.entries()).map(([id, quantity]) => ({ id, quantity }));
}

function isValidDateTime(date: string, time: string) {
  const combined = new Date(`${date}T${time}`);
  if (Number.isNaN(combined.getTime())) return false;
  return combined.getTime() >= Date.now();
}

function normalizeTime(value: string) {
  if (!value) return "";
  return value.slice(0, 5);
}

// POST - Create PaymentIntent for online pickup orders
export async function POST(request: NextRequest) {
  let responseCorsHeaders: Record<string, string> | undefined;
  try {
    const origin = request.headers.get("origin");
    let fallbackCorsHeaders: Record<string, string> | null = null;
    const getFallbackCorsHeaders = async () => {
      if (fallbackCorsHeaders === null) {
        fallbackCorsHeaders = await getCorsHeaders(origin);
      }
      return fallbackCorsHeaders;
    };
    const rawBody = await request.json();

    // Validar que el body es un objeto plano
    if (!isPlainObject(rawBody)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    // Rechazar campos inesperados en el body principal
    if (hasUnknownKeys(rawBody, allowedPayloadKeys)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    // Validar estructura de customer
    if (rawBody.customer !== undefined) {
      if (!isPlainObject(rawBody.customer)) {
        return NextResponse.json(
          { error: "Datos de cliente invalidos" },
          { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
        );
      }
      if (hasUnknownKeys(rawBody.customer as Record<string, unknown>, allowedCustomerKeys)) {
        return NextResponse.json(
          { error: "Datos de cliente invalidos" },
          { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
        );
      }
    }

    // Validar estructura de items
    if (rawBody.items !== undefined) {
      if (!Array.isArray(rawBody.items)) {
        return NextResponse.json(
          { error: "Items invalidos" },
          { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
        );
      }
      for (const item of rawBody.items) {
        if (!isPlainObject(item) || hasUnknownKeys(item, allowedItemKeys)) {
          return NextResponse.json(
            { error: "Items invalidos" },
            { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
          );
        }
      }
    }

    const body = rawBody as unknown as OrderIntentPayload;
    const items = normalizeItems(body.items || []);

    if (
      !body.website_id ||
      !body.customer?.name ||
      !body.pickup_date ||
      !body.pickup_time ||
      !isValidUuid(body.website_id)
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: website_id, customer.name, pickup_date, pickup_time" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (
      typeof body.customer?.name !== "string" ||
      (body.customer?.email && typeof body.customer.email !== "string") ||
      (body.customer?.phone && typeof body.customer.phone !== "string")
    ) {
      return NextResponse.json(
        { error: "Datos de cliente invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const customerName = body.customer.name.trim().slice(0, 200);

    if (!customerName) {
      return NextResponse.json(
        { error: "Nombre requerido" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const customerPhone = body.customer.phone?.trim().slice(0, 50) || "";

    if (!customerPhone) {
      return NextResponse.json(
        { error: "Telefono requerido para la recogida" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "El carrito esta vacio" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (items.length > 50) {
      return NextResponse.json(
        { error: "Demasiados items en el carrito" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (
      typeof body.pickup_date !== "string" ||
      typeof body.pickup_time !== "string" ||
      !dateRegex.test(body.pickup_date) ||
      !timeRegex.test(body.pickup_time) ||
      !isValidDateTime(body.pickup_date, body.pickup_time)
    ) {
      return NextResponse.json(
        { error: "Fecha u hora de recogida no valida" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: website } = await supabase
      .from("websites")
      .select("id, domain, is_active, config")
      .eq("id", body.website_id)
      .single();

    if (!website || !website.is_active) {
      return NextResponse.json(
        { error: "Website no encontrado" },
        { status: 404, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!isOrdersEnabled(website.config)) {
      return NextResponse.json(
        { error: "Pedidos desactivados para este sitio" },
        { status: 403, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!isAllowedOrigin(origin, website.domain)) {
      return NextResponse.json(
        { error: "Origen no permitido" },
        { status: 403 }
      );
    }

    responseCorsHeaders = buildCorsHeaders(origin!);
    const ip = getClientIp(request.headers);
    const rateKey = getRateLimitKey(ip, body.website_id);
    const rateStatus = checkRateLimit(rateKey, rateLimitPresets.payments);

    if (!rateStatus.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes" },
        { status: 429, headers: responseCorsHeaders }
      );
    }

    const { data: orderSettings } = await supabase
      .from("order_settings")
      .select("pickup_start_time, pickup_end_time")
      .eq("website_id", body.website_id)
      .single();

    const pickupStart = normalizeTime(orderSettings?.pickup_start_time || "12:00");
    const pickupEnd = normalizeTime(orderSettings?.pickup_end_time || "22:00");
    const pickupTime = normalizeTime(body.pickup_time);

    if (pickupTime < pickupStart || pickupTime > pickupEnd) {
      return NextResponse.json(
        { error: "Hora fuera del rango de recogida" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    const itemIds = items.map((item) => item.id);

    const { data: menuItems, error: menuError } = await supabase
      .from("menu_items")
      .select("id, website_id, name, price_cents, is_active")
      .eq("website_id", body.website_id)
      .in("id", itemIds)
      .eq("is_active", true);

    if (menuError || !menuItems || menuItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: "Platos no validos o no disponibles" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    const menuMap = new Map(menuItems.map((item) => [item.id, item]));
    let totalAmount = 0;

    const orderItemsPayload = items.map((item) => {
      const menuItem = menuMap.get(item.id)!;
      const unitPrice = menuItem.price_cents;
      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;
      return {
        menu_item_id: menuItem.id,
        item_name: menuItem.name,
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: lineTotal,
      };
    });

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "Total invalido" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        website_id: body.website_id,
        customer_name: customerName,
        customer_email: body.customer.email?.slice(0, 254) || null,
        customer_phone: customerPhone,
        pickup_date: body.pickup_date,
        pickup_time: body.pickup_time,
        notes: body.notes?.slice(0, 1000) || null,
        total_amount: totalAmount,
        status: "pending",
        currency: "eur",
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Error creando pedido:", orderError);
      return NextResponse.json(
        { error: "Error al crear el pedido" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsPayload.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) {
      console.error("Error creando items del pedido:", itemsError);
      await supabase.from("orders").delete().eq("id", order.id);
      return NextResponse.json(
        { error: "Error al crear el detalle del pedido" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const paymentMode = resolvePaymentMode(website.config);
    const stripeEnabled = paymentMode === "stripe" && Boolean(process.env.STRIPE_SECRET_KEY);

    if (!stripeEnabled) {
      // Modo "pago en local": no Stripe, no client_secret.
      return NextResponse.json(
        { order_id: order.id, status: order.status, payment_mode: "local" },
        { headers: responseCorsHeaders }
      );
    }

    const stripeModule = await import("stripe");
    const stripe = new stripeModule.default(process.env.STRIPE_SECRET_KEY!);
    let intent: Stripe.PaymentIntent;
    try {
      intent = await stripe.paymentIntents.create({
        amount: totalAmount,
        currency: "eur",
        automatic_payment_methods: { enabled: true },
        metadata: {
          order_id: order.id,
          website_id: body.website_id,
        },
      });
    } catch (stripeError) {
      console.error("Error creando PaymentIntent:", stripeError);
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);
      return NextResponse.json(
        { error: "Error al crear el pago" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    await supabase
      .from("orders")
      .update({
        stripe_payment_intent_id: intent.id,
        stripe_payment_status: intent.status,
      })
      .eq("id", order.id);

    return NextResponse.json(
      { client_secret: intent.client_secret, order_id: order.id, payment_mode: "stripe" },
      { headers: responseCorsHeaders }
    );
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: responseCorsHeaders }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const corsHeaders = await getCorsHeaders(origin);

  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
