import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import {
  isPlainObject,
  hasUnknownKeys,
  isValidUuid,
  isValidDate,
  isValidTime,
  sanitizeString,
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

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

interface OrderItemInput {
  id: string;
  quantity: number;
}

interface OrderPayload {
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

const allowedOrderKeys = new Set([
  "website_id",
  "items",
  "customer",
  "pickup_date",
  "pickup_time",
  "notes",
]);

async function getCorsHeaders(origin: string | null) {
  return getCorsHeadersForOrigin(
    origin,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeItems(items: OrderItemInput[]) {
  const map = new Map<string, number>();
  items.forEach((item) => {
    const qty = Number(item.quantity);
    if (!Number.isFinite(qty) || qty <= 0) return;
    map.set(item.id, (map.get(item.id) || 0) + Math.floor(qty));
  });
  return Array.from(map.entries()).map(([id, quantity]) => ({ id, quantity }));
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

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

    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe no configurado" },
        { status: 500, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const rawBody = await request.json();
    if (!isPlainObject(rawBody)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (hasUnknownKeys(rawBody, allowedOrderKeys)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const body = rawBody as unknown as OrderPayload;

    if (!body.website_id || !isValidUuid(body.website_id)) {
      return NextResponse.json(
        { error: "Website invalido" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "El pedido esta vacio" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!isPlainObject(body.customer) || typeof body.customer.name !== "string") {
      return NextResponse.json(
        { error: "Datos del cliente invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!isValidDate(body.pickup_date) || !isValidTime(body.pickup_time)) {
      return NextResponse.json(
        { error: "Fecha u hora de recogida invalida" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const items = normalizeItems(
      body.items.filter((item) => isValidUuid(item.id))
    );

    if (items.length === 0) {
      return NextResponse.json(
        { error: "El pedido esta vacio" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const customerName = sanitizeString(body.customer.name, 200);
    const customerEmail = sanitizeString(body.customer.email || "", 254);
    const customerPhone = sanitizeString(body.customer.phone || "", 50);
    const notes = sanitizeString(body.notes || "", 2000);

    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Nombre y telefono son requeridos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const { data: website, error: websiteError } = await getSupabaseAdmin()
      .from("websites")
      .select("id, domain, config, client_id, is_active")
      .eq("id", body.website_id)
      .single();

    if (websiteError || !website || !website.is_active) {
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

    const ip = getClientIp(request.headers);
    const rateKey = getRateLimitKey(ip, body.website_id);
    const rateStatus = checkRateLimit(rateKey, rateLimitPresets.standard);

    if (!rateStatus.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes" },
        { status: 429, headers: responseCorsHeaders }
      );
    }

    const { data: orderSettings } = await getSupabaseAdmin()
      .from("order_settings")
      .select("pickup_start_time, pickup_end_time")
      .eq("website_id", body.website_id)
      .maybeSingle();

    if (orderSettings?.pickup_start_time && orderSettings?.pickup_end_time) {
      const start = timeToMinutes(orderSettings.pickup_start_time);
      const end = timeToMinutes(orderSettings.pickup_end_time);
      const pickup = timeToMinutes(body.pickup_time);
      if (start !== null && end !== null && pickup !== null) {
        if (pickup < start || pickup > end) {
          return NextResponse.json(
            { error: "Hora de recogida fuera del horario disponible" },
            { status: 400, headers: responseCorsHeaders }
          );
        }
      }
    }

    const itemIds = items.map((item) => item.id);
    const { data: menuItems } = await getSupabaseAdmin()
      .from("menu_items")
      .select("id, name, price_cents, is_active")
      .eq("website_id", body.website_id)
      .in("id", itemIds);

    if (!menuItems || menuItems.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron los platos seleccionados" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    const menuMap = new Map(
      menuItems
        .filter((item) => item.is_active)
        .map((item) => [item.id, item])
    );

    const orderLineItems = items
      .map((item) => {
        const menuItem = menuMap.get(item.id);
        if (!menuItem) return null;
        return {
          menuItem,
          quantity: item.quantity,
          unitPrice: menuItem.price_cents,
          totalPrice: menuItem.price_cents * item.quantity,
        };
      })
      .filter(Boolean) as Array<{
        menuItem: { id: string; name: string; price_cents: number };
        quantity: number;
        unitPrice: number;
        totalPrice: number;
      }>;

    if (orderLineItems.length !== items.length) {
      return NextResponse.json(
        { error: "Algunos platos no estan disponibles" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    if (orderLineItems.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron platos validos" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    const totalAmount = orderLineItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const { data: order, error: orderError } = await getSupabaseAdmin()
      .from("orders")
      .insert({
        website_id: body.website_id,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        pickup_date: body.pickup_date,
        pickup_time: body.pickup_time,
        notes: notes || null,
        status: "pending",
        total_amount: totalAmount,
        currency: "EUR",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "No se pudo crear el pedido" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const orderItemsPayload = orderLineItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItem.id,
      item_name: item.menuItem.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
    }));

    const { error: orderItemsError } = await getSupabaseAdmin()
      .from("order_items")
      .insert(orderItemsPayload);

    if (orderItemsError) {
      return NextResponse.json(
        { error: "No se pudo guardar el pedido" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const successUrl = `${origin}/?order=success`;
    const cancelUrl = `${origin}/?order=cancel`;

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail || undefined,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        website_id: body.website_id,
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          website_id: body.website_id,
        },
      },
      line_items: orderLineItems.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: "eur",
          unit_amount: item.unitPrice,
          product_data: {
            name: item.menuItem.name,
          },
        },
      })),
    });

    if (!stripeSession.url) {
      return NextResponse.json(
        { error: "No se pudo iniciar el pago" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const paymentIntentId = typeof stripeSession.payment_intent === "string"
      ? stripeSession.payment_intent
      : stripeSession.payment_intent?.id ?? null;

    await getSupabaseAdmin()
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntentId,
        stripe_payment_status: stripeSession.payment_status || null,
      })
      .eq("id", order.id);

    return NextResponse.json(
      { url: stripeSession.url },
      { headers: responseCorsHeaders }
    );
  } catch {
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
