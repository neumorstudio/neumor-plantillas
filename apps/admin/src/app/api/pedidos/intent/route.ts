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

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

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
    const quantity = Math.max(0, Number(item.quantity) || 0);
    if (!item.id || quantity <= 0) return;
    map.set(item.id, (map.get(item.id) || 0) + quantity);
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
  try {
    const body: OrderIntentPayload = await request.json();
    const items = normalizeItems(body.items || []);

    if (!body.website_id || !body.customer?.name || !body.pickup_date || !body.pickup_time) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: website_id, customer.name, pickup_date, pickup_time" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!body.customer?.phone) {
      return NextResponse.json(
        { error: "Telefono requerido para la recogida" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (items.length === 0) {
      return NextResponse.json(
        { error: "El carrito esta vacio" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!isValidDateTime(body.pickup_date, body.pickup_time)) {
      return NextResponse.json(
        { error: "Fecha u hora de recogida no valida" },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = getSupabaseAdmin();

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
        { status: 400, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
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
        { status: 400, headers: corsHeaders }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        website_id: body.website_id,
        customer_name: body.customer.name,
        customer_email: body.customer.email || null,
        customer_phone: body.customer.phone || null,
        pickup_date: body.pickup_date,
        pickup_time: body.pickup_time,
        notes: body.notes || null,
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
        { status: 500, headers: corsHeaders }
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
        { status: 500, headers: corsHeaders }
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
        { status: 500, headers: corsHeaders }
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
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("Error creando PaymentIntent:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
