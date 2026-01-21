import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

// Campos permitidos para validación estricta
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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getUnknownKeys(value: Record<string, unknown>, allowed: Set<string>) {
  return Object.keys(value).filter((key) => !allowed.has(key));
}

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

function isValidUuid(value: string) {
  return uuidRegex.test(value);
}

function normalizeDomain(value: string) {
  return value.replace(/^https?:\/\//i, "").split("/")[0].toLowerCase();
}

function stripPort(value: string) {
  return value.split(":")[0];
}

function getOriginHost(origin: string) {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isDevHost(host: string) {
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0";
}

function isAllowedOrigin(origin: string | null, websiteDomain: string) {
  if (!origin) return false;
  const host = getOriginHost(origin);
  if (!host) return false;
  const domain = stripPort(normalizeDomain(websiteDomain));
  const hostNoPort = stripPort(host);

  if (hostNoPort === domain || hostNoPort === `www.${domain}`) return true;
  if (domain === `www.${hostNoPort}`) return true;
  if (process.env.NODE_ENV !== "production" && isDevHost(hostNoPort)) return true;
  return false;
}

async function getCorsHeadersForOrigin(origin: string | null) {
  if (!origin) return null;
  const host = getOriginHost(origin);
  if (!host) return null;
  const hostNoPort = stripPort(host);

  if (process.env.NODE_ENV !== "production" && isDevHost(hostNoPort)) {
    return buildCorsHeaders(origin);
  }

  const candidates = hostNoPort.startsWith("www.")
    ? [hostNoPort, hostNoPort.replace(/^www\./, "")]
    : [hostNoPort, `www.${hostNoPort}`];

  const { data } = await getSupabaseAdmin()
    .from("websites")
    .select("id")
    .in("domain", candidates)
    .eq("is_active", true)
    .limit(1);

  if (!data || data.length === 0) {
    return null;
  }

  return buildCorsHeaders(origin);
}

function buildCorsHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  const entry = rateLimitBuckets.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitBuckets.set(key, { count: 1, resetAt });
    return { allowed: true, resetAt };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { allowed: true, resetAt: entry.resetAt };
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
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
        fallbackCorsHeaders = await getCorsHeadersForOrigin(origin);
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
    if (getUnknownKeys(rawBody, allowedPayloadKeys).length > 0) {
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
      if (getUnknownKeys(rawBody.customer as Record<string, unknown>, allowedCustomerKeys).length > 0) {
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
        if (!isPlainObject(item) || getUnknownKeys(item, allowedItemKeys).length > 0) {
          return NextResponse.json(
            { error: "Items invalidos" },
            { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
          );
        }
      }
    }

    const body = rawBody as OrderIntentPayload;
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
      .select("id, domain, is_active")
      .eq("id", body.website_id)
      .single();

    if (!website || !website.is_active) {
      return NextResponse.json(
        { error: "Website no encontrado" },
        { status: 404, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!isAllowedOrigin(origin, website.domain)) {
      return NextResponse.json(
        { error: "Origen no permitido" },
        { status: 403 }
      );
    }

    responseCorsHeaders = buildCorsHeaders(origin!);
    const rateKey = `${getClientIp(request)}:${body.website_id}`;
    const rateStatus = checkRateLimit(rateKey);

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

    const stripe = getStripe();
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
      { client_secret: intent.client_secret, order_id: order.id },
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
  const corsHeaders = await getCorsHeadersForOrigin(origin);

  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
