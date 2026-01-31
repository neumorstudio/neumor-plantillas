import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getClinicAppointmentConfirmationEmail,
  getClinicAppointmentNotificationEmail,
  getSalonAppointmentConfirmationEmail,
  getSalonAppointmentNotificationEmail,
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

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ServiceItem {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
}

interface AppointmentData {
  website_id: string;
  nombre: string;
  email?: string;
  telefono: string;
  servicio: string;
  services?: ServiceItem[];
  total_price_cents?: number;
  total_duration_minutes?: number;
  profesional?: string;
  professional_id?: string;
  customer_id?: string;
  fecha: string;
  hora: string;
  notas?: string;
}

const allowedAppointmentKeys = new Set([
  "website_id",
  "nombre",
  "email",
  "telefono",
  "servicio",
  "services",
  "total_price_cents",
  "total_duration_minutes",
  "profesional",
  "professional_id",
  "customer_id",
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

    if (hasUnknownKeys(rawBody, allowedAppointmentKeys)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const body = rawBody as unknown as AppointmentData;

    if (
      !body.website_id ||
      !body.nombre ||
      !body.telefono ||
      !body.servicio ||
      !body.fecha ||
      !body.hora ||
      !isValidUuid(body.website_id)
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: website_id, nombre, telefono, servicio, fecha, hora" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (
      typeof body.nombre !== "string" ||
      typeof body.telefono !== "string" ||
      typeof body.servicio !== "string" ||
      typeof body.fecha !== "string" ||
      typeof body.hora !== "string" ||
      (body.email && typeof body.email !== "string") ||
      (body.profesional && typeof body.profesional !== "string") ||
      (body.professional_id && typeof body.professional_id !== "string") ||
      (body.professional_id && !isValidUuid(body.professional_id)) ||
      (body.customer_id && typeof body.customer_id !== "string") ||
      (body.customer_id && !isValidUuid(body.customer_id)) ||
      (body.notas && typeof body.notas !== "string") ||
      (body.services && !Array.isArray(body.services)) ||
      (body.total_price_cents && typeof body.total_price_cents !== "number") ||
      (body.total_duration_minutes && typeof body.total_duration_minutes !== "number")
    ) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const nombre = sanitizeString(body.nombre, 200);
    const telefono = sanitizeString(body.telefono, 50);
    const servicio = sanitizeString(body.servicio, 120);
    const profesional = sanitizeString(body.profesional || "", 120);
    const notas = sanitizeString(body.notas || "", 1000);
    const email = sanitizeString(body.email || "", 254);

    if (!nombre || !telefono || !servicio) {
      return NextResponse.json(
        { error: "Nombre, telefono y servicio son requeridos" },
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
      servicio ? `Servicio: ${servicio}` : "",
      profesional ? `Profesional: ${profesional}` : "",
      notas ? `Notas: ${notas}` : "",
    ].filter(Boolean);

    let customerId: string | null = body.customer_id || null;
    if (customerId) {
      const { data: customer, error: customerError } = await getSupabaseAdmin()
        .from("customers")
        .select("id, phone, email")
        .eq("id", customerId)
        .eq("website_id", body.website_id)
        .single();

      if (customerError || !customer) {
        customerId = null;
      } else if (telefono && telefono !== (customer.phone || "")) {
        await getSupabaseAdmin()
          .from("customers")
          .update({ phone: telefono })
          .eq("id", customer.id);
      }
    }

    const { data: booking, error: bookingError } = await getSupabaseAdmin()
      .from("bookings")
      .insert({
        website_id: body.website_id,
        customer_name: nombre,
        customer_email: email || null,
        customer_phone: telefono,
        customer_id: customerId,
        booking_date: body.fecha,
        booking_time: body.hora,
        guests: 1,
        notes: noteParts.join(" | ").slice(0, 1000) || null,
        status: "confirmed",
        source: "website",
        professional_id: body.professional_id || null,
        services: body.services || null,
        total_price_cents: body.total_price_cents || null,
        total_duration_minutes: body.total_duration_minutes || null,
      })
      .select()
      .single();

    if (bookingError) {
      return NextResponse.json(
        { error: "Error al guardar la cita" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const businessName =
      (website.config as { businessName?: string })?.businessName ||
      client?.business_name ||
      "Clinica";
    const businessLogo =
      (website.config as { branding?: { logo?: string } })?.branding?.logo ||
      (website.config as { logo?: string })?.logo ||
      undefined;
    const businessPhone = (website.config as { phone?: string })?.phone;
    const businessAddress = (website.config as { address?: string })?.address;
    const businessEmail = client?.email;
    const businessType = client?.business_type;
    const isSalon = businessType === "salon";

      const totalPrice =
        typeof body.total_price_cents === "number"
          ? `${(body.total_price_cents / 100).toFixed(2)} EUR`
          : undefined;

      const emailData = {
        businessName,
        customerName: nombre,
        date: formatDate(body.fecha),
        time: body.hora,
        service: servicio,
        totalPrice,
        professional: profesional || undefined,
        notes: notas || undefined,
        phone: telefono,
        email: email || undefined,
        businessPhone,
        businessAddress,
        logoUrl: businessLogo,
      };

    const emailResults = {
      customerEmail: false,
      businessEmail: false,
    };

    const fromAddress = getFromAddress(businessName);

    if (email && notificationSettings?.email_booking_confirmation !== false) {
      const customerHtml = isSalon
        ? getSalonAppointmentConfirmationEmail(emailData)
        : getClinicAppointmentConfirmationEmail(emailData);
      const result = await sendEmail({
        to: email,
        subject: `Confirmacion de cita - ${businessName}`,
        html: customerHtml,
        from: fromAddress,
        replyTo: businessEmail || undefined,
      });
      emailResults.customerEmail = result.success;
    }

    if (businessEmail) {
      const businessHtml = isSalon
        ? getSalonAppointmentNotificationEmail(emailData)
        : getClinicAppointmentNotificationEmail(emailData);
      const result = await sendEmail({
        to: businessEmail,
        subject: `Nueva cita: ${nombre} - ${formatDate(body.fecha)} ${body.hora}`,
        html: businessHtml,
        from: fromAddress,
      });
      emailResults.businessEmail = result.success;
    }

    await getSupabaseAdmin().from("activity_log").insert({
      website_id: body.website_id,
      action: "booking_created",
      details: {
        booking_id: booking.id,
        customer_name: nombre,
        date: body.fecha,
        time: body.hora,
        service: servicio,
        emails_sent: emailResults,
        type: "appointment",
      },
    });

    return NextResponse.json(
      {
        success: true,
        booking_id: booking.id,
        message: "Cita creada correctamente",
        emails: emailResults,
      },
      { headers: responseCorsHeaders }
    );
  } catch (error) {
    console.error("[citas] Error interno:", error);
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
