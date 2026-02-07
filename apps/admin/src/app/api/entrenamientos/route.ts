import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getFitnessBookingConfirmationEmail,
  getFitnessBookingNotificationEmail,
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

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface FitnessBookingData {
  website_id: string;
  nombre: string;
  email?: string;
  telefono: string;
  clase: string;
  nivel?: string;
  fecha: string;
  hora: string;
  notas?: string;
}

const allowedBookingKeys = new Set([
  "website_id",
  "nombre",
  "email",
  "telefono",
  "clase",
  "nivel",
  "fecha",
  "hora",
  "notas",
]);

async function getCorsHeaders(origin: string | null) {
  return getCorsHeadersForOrigin(
    origin,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

    const rawBody = await request.json();
    if (!isPlainObject(rawBody)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (hasUnknownKeys(rawBody, allowedBookingKeys)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const body = rawBody as unknown as FitnessBookingData;

    if (
      !body.website_id ||
      !body.nombre ||
      !body.telefono ||
      !body.clase ||
      !body.fecha ||
      !body.hora ||
      !isValidUuid(body.website_id)
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: website_id, nombre, telefono, clase, fecha, hora" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (
      typeof body.nombre !== "string" ||
      typeof body.telefono !== "string" ||
      typeof body.clase !== "string" ||
      typeof body.fecha !== "string" ||
      typeof body.hora !== "string" ||
      (body.email && typeof body.email !== "string") ||
      (body.nivel && typeof body.nivel !== "string") ||
      (body.notas && typeof body.notas !== "string")
    ) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const nombre = sanitizeString(body.nombre, 200);
    const telefono = sanitizeString(body.telefono, 50);
    const clase = sanitizeString(body.clase, 120);
    const nivel = sanitizeString(body.nivel || "", 120);
    const notas = sanitizeString(body.notas || "", 1000);
    const email = sanitizeString(body.email || "", 254);

    if (!nombre || !telefono || !clase) {
      return NextResponse.json(
        { error: "Nombre, telefono y clase son requeridos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!isValidDate(body.fecha) || !isValidTime(body.hora)) {
      return NextResponse.json(
        { error: "Fecha u hora no valida" },
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

    const { data: client } = await getSupabaseAdmin()
      .from("clients")
      .select("email, business_name, business_type")
      .eq("id", website.client_id)
      .single();

    const { data: notificationSettings } = await getSupabaseAdmin()
      .from("notification_settings")
      .select("*")
      .eq("website_id", body.website_id)
      .single();

    const noteParts = [
      clase ? `Clase: ${clase}` : "",
      nivel ? `Nivel: ${nivel}` : "",
      notas ? `Notas: ${notas}` : "",
    ].filter(Boolean);

    const { data: booking, error: bookingError } = await getSupabaseAdmin()
      .from("bookings")
      .insert({
        website_id: body.website_id,
        customer_name: nombre,
        customer_email: email || null,
        customer_phone: telefono,
        booking_date: body.fecha,
        booking_time: body.hora,
        guests: 1,
        notes: noteParts.join(" | ").slice(0, 1000) || null,
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

    const businessName =
      (website.config as { businessName?: string })?.businessName ||
      client?.business_name ||
      "Entrenamiento";
    const businessPhone = (website.config as { phone?: string })?.phone;
    const businessAddress = (website.config as { address?: string })?.address;
    const businessEmail = client?.email;

    const emailData = {
      businessName,
      customerName: nombre,
      date: formatDate(body.fecha),
      time: body.hora,
      className: clase,
      level: nivel || undefined,
      notes: notas || undefined,
      phone: telefono,
      email: email || undefined,
      businessPhone,
      businessAddress,
    };

    const emailResults = {
      customerEmail: false,
      businessEmail: false,
    };

    const fromAddress = getFromAddress(businessName);

    if (email && notificationSettings?.email_booking_confirmation !== false) {
      const customerHtml = getFitnessBookingConfirmationEmail(emailData);
      const result = await sendEmail({
        to: email,
        subject: `Confirmacion de reserva - ${businessName}`,
        html: customerHtml,
        from: fromAddress,
        replyTo: businessEmail || undefined,
      });
      emailResults.customerEmail = result.success;
    }

    if (businessEmail) {
      const businessHtml = getFitnessBookingNotificationEmail(emailData);
      const result = await sendEmail({
        to: businessEmail,
        subject: `Nueva reserva: ${nombre} - ${formatDate(body.fecha)} ${body.hora}`,
        html: businessHtml,
        from: fromAddress,
      });
      emailResults.businessEmail = result.success;
    }

    if (notificationSettings?.whatsapp_booking_confirmation !== false) {
      await sendPushNotification(getSupabaseAdmin(), body.website_id, {
        title: `Nueva sesion · ${businessName}`,
        body: `${nombre} · ${clase || "Sesion"} · ${formatDate(body.fecha)} ${body.hora}`,
        url: `/dashboard/sesiones?date=${body.fecha}`,
        tag: "booking",
        data: {
          bookingId: booking.id,
          type: "fitness",
        },
      });
    }

    await getSupabaseAdmin().from("activity_log").insert({
      website_id: body.website_id,
      action: "booking_created",
      details: {
        booking_id: booking.id,
        customer_name: nombre,
        date: body.fecha,
        time: body.hora,
        class: clase,
        emails_sent: emailResults,
        type: "fitness",
      },
    });

    return NextResponse.json(
      {
        success: true,
        booking_id: booking.id,
        message: "Reserva creada correctamente",
        emails: emailResults,
      },
      { headers: responseCorsHeaders }
    );
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: responseCorsHeaders }
    );
  }
}

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
