import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getCustomerConfirmationEmail,
  getRestaurantNotificationEmail,
} from "@/lib/email-templates";

// Cliente Supabase con service role para bypass RLS (lazy init)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Tipos
interface ReservationData {
  website_id: string;
  nombre: string;
  email?: string;
  telefono: string;
  fecha: string;
  hora: string;
  personas: number;
  zona?: string;
  ocasion?: string;
  notas?: string;
}

// Headers CORS comunes
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// POST - Crear nueva reserva
export async function POST(request: NextRequest) {
  try {
    const body: ReservationData = await request.json();

    // Validar campos requeridos
    if (!body.website_id || !body.nombre || !body.telefono || !body.fecha || !body.hora) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: website_id, nombre, telefono, fecha, hora" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Obtener configuracion del website
    const { data: website, error: websiteError } = await getSupabaseAdmin()
      .from("websites")
      .select("id, domain, config, client_id")
      .eq("id", body.website_id)
      .single();

    if (websiteError || !website) {
      console.error("Website no encontrado:", websiteError);
      return NextResponse.json(
        { error: "Website no encontrado" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Obtener cliente para email del restaurante
    const { data: client } = await getSupabaseAdmin()
      .from("clients")
      .select("email, business_name")
      .eq("id", website.client_id)
      .single();

    // Obtener configuracion de notificaciones
    const { data: notificationSettings } = await getSupabaseAdmin()
      .from("notification_settings")
      .select("*")
      .eq("website_id", body.website_id)
      .single();

    // Insertar reserva en la base de datos
    const { data: booking, error: bookingError } = await getSupabaseAdmin()
      .from("bookings")
      .insert({
        website_id: body.website_id,
        customer_name: body.nombre,
        customer_email: body.email || null,
        customer_phone: body.telefono,
        booking_date: body.fecha,
        booking_time: body.hora,
        guests: body.personas || 1,
        notes: [body.zona, body.ocasion, body.notas].filter(Boolean).join(" | ") || null,
        status: "pending",
        source: "website",
      })
      .select()
      .single();

    if (bookingError) {
      console.error("Error creando reserva:", bookingError);
      return NextResponse.json(
        { error: "Error al guardar la reserva" },
        { status: 500, headers: corsHeaders }
      );
    }

    // Preparar datos para emails
    const restaurantName = website.config?.businessName || client?.business_name || "Restaurante";
    const restaurantPhone = website.config?.phone;
    const restaurantAddress = website.config?.address;
    const restaurantEmail = client?.email;

    const emailData = {
      restaurantName,
      customerName: body.nombre,
      date: formatDate(body.fecha),
      time: body.hora,
      guests: body.personas || 1,
      zone: body.zona,
      occasion: body.ocasion,
      notes: body.notas,
      phone: body.telefono,
      email: body.email,
      restaurantPhone,
      restaurantAddress,
    };

    const emailResults = {
      customerEmail: false,
      restaurantEmail: false,
    };

    // Remitente con nombre del restaurante
    const fromAddress = getFromAddress(restaurantName);

    // Enviar email de confirmacion al CLIENTE
    if (body.email && notificationSettings?.email_booking_confirmation !== false) {
      const customerHtml = getCustomerConfirmationEmail(emailData);
      const result = await sendEmail({
        to: body.email,
        subject: `Confirmacion de Reserva - ${restaurantName}`,
        html: customerHtml,
        from: fromAddress,
        replyTo: restaurantEmail || undefined,
      });
      emailResults.customerEmail = result.success;
      if (!result.success) {
        console.error("Error enviando email al cliente:", result.error);
      }
    }

    // Enviar notificacion al RESTAURANTE
    if (restaurantEmail) {
      const restaurantHtml = getRestaurantNotificationEmail(emailData);
      const result = await sendEmail({
        to: restaurantEmail,
        subject: `Nueva Reserva: ${body.nombre} - ${formatDate(body.fecha)} ${body.hora}`,
        html: restaurantHtml,
        from: fromAddress,
      });
      emailResults.restaurantEmail = result.success;
      if (!result.success) {
        console.error("Error enviando email al restaurante:", result.error);
      }
    }

    // Registrar en activity_log
    await getSupabaseAdmin().from("activity_log").insert({
      website_id: body.website_id,
      action: "booking_created",
      details: {
        booking_id: booking.id,
        customer_name: body.nombre,
        date: body.fecha,
        time: body.hora,
        guests: body.personas,
        emails_sent: emailResults,
      },
    });

    return NextResponse.json({
      success: true,
      booking_id: booking.id,
      message: "Reserva creada correctamente",
      emails: emailResults,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error en API de reservas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Utilidad para formatear fecha
function formatDate(dateStr: string): string {
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

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
