import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getCustomerConfirmationEmail,
  getRestaurantNotificationEmail,
} from "@/lib/email-templates";
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
import { sendPushNotification } from "@/lib/push";

export const runtime = "nodejs";

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

const allowedReservationKeys = new Set([
  "website_id",
  "nombre",
  "email",
  "telefono",
  "fecha",
  "hora",
  "personas",
  "zona",
  "ocasion",
  "notas",
]);

const timeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const getWeekdayIndex = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return (date.getDay() + 6) % 7;
};

type TimeRange = { start: number; end: number };

async function getAvailableRangesForDate(websiteId: string, dateValue: string) {
  const supabase = getSupabaseAdmin();
  const { data: specialDay } = await supabase
    .from("special_days")
    .select("id, is_open, open_time, close_time")
    .eq("website_id", websiteId)
    .eq("date", dateValue)
    .maybeSingle();

  if (specialDay) {
    if (!specialDay.is_open) return [];
    const { data: specialSlots } = await supabase
      .from("special_day_slots")
      .select("open_time, close_time, sort_order")
      .eq("special_day_id", specialDay.id)
      .order("sort_order", { ascending: true });

    if (specialSlots?.length) {
      return specialSlots
        .map((slot) => ({
          start: timeToMinutes(slot.open_time),
          end: timeToMinutes(slot.close_time),
        }))
        .filter((slot): slot is TimeRange => slot.start !== null && slot.end !== null);
    }

    const open = timeToMinutes(specialDay.open_time || "");
    const close = timeToMinutes(specialDay.close_time || "");
    if (open !== null && close !== null) return [{ start: open, end: close }];
    return [];
  }

  const weekdayIndex = getWeekdayIndex(dateValue);
  if (weekdayIndex === null) return [];

  const { data: slotRows } = await supabase
    .from("business_hour_slots")
    .select("open_time, close_time, sort_order")
    .eq("website_id", websiteId)
    .eq("day_of_week", weekdayIndex)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (slotRows?.length) {
    return slotRows
      .map((slot) => ({
        start: timeToMinutes(slot.open_time),
        end: timeToMinutes(slot.close_time),
      }))
      .filter((slot): slot is TimeRange => slot.start !== null && slot.end !== null);
  }

  const { data: hourRow } = await supabase
    .from("business_hours")
    .select("is_open, open_time, close_time")
    .eq("website_id", websiteId)
    .eq("day_of_week", weekdayIndex)
    .maybeSingle();

  if (!hourRow || !hourRow.is_open) return [];
  const open = timeToMinutes(hourRow.open_time);
  const close = timeToMinutes(hourRow.close_time);
  if (open !== null && close !== null) return [{ start: open, end: close }];
  return [];
}

// Helper CORS configurado
async function getCorsHeaders(origin: string | null) {
  return getCorsHeadersForOrigin(
    origin,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST - Crear nueva reserva
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
    if (!isPlainObject(rawBody)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (hasUnknownKeys(rawBody, allowedReservationKeys)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const body = rawBody as unknown as ReservationData;

    // Validar campos requeridos
    if (
      !body.website_id ||
      !body.nombre ||
      !body.telefono ||
      !body.fecha ||
      !body.hora ||
      !isValidUuid(body.website_id)
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: website_id, nombre, telefono, fecha, hora" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (
      typeof body.nombre !== "string" ||
      typeof body.telefono !== "string" ||
      typeof body.fecha !== "string" ||
      typeof body.hora !== "string" ||
      (body.email && typeof body.email !== "string") ||
      (body.zona && typeof body.zona !== "string") ||
      (body.ocasion && typeof body.ocasion !== "string") ||
      (body.notas && typeof body.notas !== "string") ||
      (body.personas !== undefined &&
        typeof body.personas !== "number" &&
        typeof body.personas !== "string")
    ) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const nombre = sanitizeString(body.nombre, 200);
    const telefono = sanitizeString(body.telefono, 50);
    const guests = Number.isFinite(Number(body.personas))
      ? Math.max(1, Math.floor(Number(body.personas)))
      : 1;

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: "Nombre y telefono son requeridos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!isValidDate(body.fecha) || !isValidTime(body.hora)) {
      return NextResponse.json(
        { error: "Fecha u hora no valida" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    // Obtener configuracion del website
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

    // Rate limiting
    const ip = getClientIp(request.headers);
    const rateKey = getRateLimitKey(ip, body.website_id);
    const rateStatus = checkRateLimit(rateKey, rateLimitPresets.standard);

    if (!rateStatus.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes" },
        { status: 429, headers: responseCorsHeaders }
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
    const bookingMinutes = timeToMinutes(body.hora);
    if (bookingMinutes === null) {
      return NextResponse.json(
        { error: "Hora no valida" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    const availableRanges = await getAvailableRangesForDate(body.website_id, body.fecha);
    const isWithinRange = availableRanges.some(
      (range) => bookingMinutes >= range.start && bookingMinutes < range.end
    );

    if (!isWithinRange) {
      return NextResponse.json(
        { error: "Horario no disponible para esa fecha" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    const { data: booking, error: bookingError } = await getSupabaseAdmin()
      .from("bookings")
      .insert({
        website_id: body.website_id,
        customer_name: nombre,
        customer_email: body.email?.slice(0, 254) || null,
        customer_phone: telefono,
        booking_date: body.fecha,
        booking_time: body.hora,
        guests,
        notes: [body.zona, body.ocasion, body.notas].filter(Boolean).join(" | ").slice(0, 1000) || null,
        status: "pending",
        source: "website",
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: "Error al guardar la reserva" },
        { status: 500, headers: responseCorsHeaders }
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
    }

    if (notificationSettings?.whatsapp_booking_confirmation !== false) {
      await sendPushNotification(getSupabaseAdmin(), body.website_id, {
        title: `Nueva reserva · ${restaurantName}`,
        body: `${body.nombre} · ${formatDate(body.fecha)} ${body.hora} · ${body.personas || 1} personas`,
        url: `/dashboard/reservas?date=${body.fecha}`,
        tag: "booking",
        data: {
          bookingId: booking.id,
          type: "reservation",
        },
      });
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
    }, { headers: responseCorsHeaders });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: responseCorsHeaders }
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
