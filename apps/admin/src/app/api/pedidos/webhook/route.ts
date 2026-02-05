import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getOrderCustomerEmail,
  getOrderRestaurantEmail,
} from "@/lib/email-templates";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function formatDate(dateStr: string) {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    return new NextResponse("Stripe no configurado", { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    return new NextResponse("Firma no encontrada", { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[pedidos webhook] Firma invalida:", err);
    return new NextResponse("Firma invalida", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id || session.client_reference_id;

    if (orderId) {
      const supabase = getSupabaseAdmin();
      const paidAt = session.payment_status === "paid" ? new Date().toISOString() : null;
      const paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

      await supabase
        .from("orders")
        .update({
          status: session.payment_status === "paid" ? "paid" : "pending",
          paid_at: paidAt,
          stripe_payment_intent_id: paymentIntentId,
          stripe_payment_status: session.payment_status || null,
        })
        .eq("id", orderId);

      const { data: order } = await supabase
        .from("orders")
        .select("id, website_id, customer_name, customer_email, customer_phone, pickup_date, pickup_time, notes, total_amount")
        .eq("id", orderId)
        .single();

      if (order) {
        const isPaid = session.payment_status === "paid";
        const { data: items } = await supabase
          .from("order_items")
          .select("item_name, quantity, total_price")
          .eq("order_id", orderId);

        const { data: website } = await supabase
          .from("websites")
          .select("id, config, client_id")
          .eq("id", order.website_id)
          .single();

        const { data: client } = website?.client_id
          ? await supabase
              .from("clients")
              .select("email, business_name")
              .eq("id", website.client_id)
              .single()
          : { data: null };

        const businessName =
          (website?.config as { businessName?: string })?.businessName ||
          client?.business_name ||
          "Restaurante";
        const businessPhone = (website?.config as { phone?: string })?.phone;
        const businessAddress = (website?.config as { address?: string })?.address;

        const emailData = {
          businessName,
          customerName: order.customer_name,
          items: (items || []).map((item) => ({
            name: item.item_name,
            quantity: item.quantity,
            total: formatCurrency(item.total_price),
          })),
          total: formatCurrency(order.total_amount),
          pickupDate: formatDate(order.pickup_date),
          pickupTime: order.pickup_time,
          notes: order.notes || undefined,
          phone: order.customer_phone || undefined,
          email: order.customer_email || undefined,
          businessPhone,
          businessAddress,
        };

        const fromAddress = getFromAddress(businessName);
        const emailResults = {
          customerEmail: false,
          restaurantEmail: false,
        };

        if (isPaid) {
          if (order.customer_email) {
            const customerHtml = getOrderCustomerEmail(emailData);
            const result = await sendEmail({
              to: order.customer_email,
              subject: `Pedido confirmado - ${businessName}`,
              html: customerHtml,
              from: fromAddress,
              replyTo: client?.email || undefined,
            });
            emailResults.customerEmail = result.success;
          }

          if (client?.email) {
            const restaurantHtml = getOrderRestaurantEmail(emailData);
            const result = await sendEmail({
              to: client.email,
              subject: `Nuevo pedido para recoger - ${order.customer_name}`,
              html: restaurantHtml,
              from: fromAddress,
            });
            emailResults.restaurantEmail = result.success;
          }

          await supabase.from("activity_log").insert({
            website_id: order.website_id,
            action: "order_paid",
            details: {
              order_id: orderId,
              customer_name: order.customer_name,
              total_amount: order.total_amount,
              pickup_date: order.pickup_date,
              pickup_time: order.pickup_time,
              emails_sent: emailResults,
            },
          });
        }
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
