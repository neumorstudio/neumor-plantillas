import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
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
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getSalonAppointmentCancellationEmail,
  getClinicAppointmentCancellationEmail,
} from "@/lib/email-templates";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const allowedCancelKeys = new Set(["booking_id"]);
const CANCEL_WINDOW_HOURS = 2;

type BookingWebsite = {
  domain?: string | null;
  config?: Record<string, unknown> | null;
  client_id?: string | null;
};

type BookingProfessional = { name?: string | null };

function parseBookingDateTime(bookingDate?: string | null, bookingTime?: string | null) {
  if (!bookingDate) return null;
  const timeValue = bookingTime && bookingTime.trim() ? bookingTime : "00:00";
  const date = new Date(`${bookingDate}T${timeValue}:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatPrice(totalPriceCents?: number | null) {
  if (!totalPriceCents || totalPriceCents <= 0) return undefined;
  return `${(totalPriceCents / 100).toFixed(2)} EUR`;
}

function buildAdminCancellationEmail(params: {
  businessName: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  date?: string | null;
  time?: string | null;
  service?: string | null;
  professional?: string | null;
  notes?: string | null;
  totalPrice?: string;
}) {
  const rows = [
    ["Cliente", params.customerName],
    ["Email", params.customerEmail],
    ["Telefono", params.customerPhone],
    ["Fecha", params.date],
    ["Hora", params.time],
    ["Servicio", params.service],
    ["Profesional", params.professional],
    ["Total", params.totalPrice],
  ]
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${label}</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600; font-size: 14px;">${value}</td>
      </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita cancelada</title>
</head>
<body style="margin:0;padding:0;font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;background-color:#f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;box-shadow:0 4px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="padding: 24px 28px; background:#fee2e2; border-radius:12px 12px 0 0;">
              <h1 style="margin:0; font-size:20px; color:#991b1b;">Cancelacion de cita</h1>
              <p style="margin:8px 0 0 0; color:#7f1d1d; font-size:14px;">${params.businessName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 28px;">
              <p style="margin:0 0 16px 0; color:#374151;">El cliente ha cancelado su cita.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${rows}
              </table>
              ${params.notes ? `<p style="margin:16px 0 0 0; color:#6b7280; font-size:14px;">Notas: ${params.notes}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

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

    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const rawBody = await request.json();
    if (!isPlainObject(rawBody)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (hasUnknownKeys(rawBody, allowedCancelKeys)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const bookingId = (rawBody as { booking_id?: string }).booking_id;
    if (!bookingId || !isValidUuid(bookingId)) {
      return NextResponse.json(
        { error: "Booking ID invalido" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, status, website_id, customer_id, customer_name, customer_email, customer_phone, booking_date, booking_time, notes, services, total_price_cents, professional:professionals(name), website:websites(domain, config, client_id)"
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (origin) {
      const websiteRelation = (booking as unknown as {
        website?: BookingWebsite | BookingWebsite[] | null;
      }).website;
      const websiteDomain = Array.isArray(websiteRelation)
        ? websiteRelation[0]?.domain
        : websiteRelation?.domain;
      if (!websiteDomain || !isAllowedOrigin(origin, websiteDomain)) {
        return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
      }
      responseCorsHeaders = buildCorsHeaders(origin);
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id, website_id")
      .eq("auth_user_id", authData.user.id)
      .eq("website_id", booking.website_id)
      .maybeSingle();

    if (!customer || customer.id !== booking.customer_id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403, headers: responseCorsHeaders }
      );
    }

    if (booking.status === "completed") {
      return NextResponse.json(
        { error: "No se puede cancelar una cita completada" },
        { status: 400, headers: responseCorsHeaders }
      );
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { success: true, status: "cancelled" },
        { headers: responseCorsHeaders }
      );
    }

    const bookingDateTime = parseBookingDateTime(booking.booking_date, booking.booking_time);
    if (bookingDateTime) {
      const minCancelTime = new Date(Date.now() + CANCEL_WINDOW_HOURS * 60 * 60 * 1000);
      if (bookingDateTime <= minCancelTime) {
        return NextResponse.json(
          { error: `No se puede cancelar con menos de ${CANCEL_WINDOW_HOURS} horas` },
          { status: 400, headers: responseCorsHeaders }
        );
      }
    }

    const ip = getClientIp(request.headers);
    const rateKey = getRateLimitKey(ip, booking.website_id);
    const rateStatus = checkRateLimit(rateKey, rateLimitPresets.standard);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes" },
        { status: 429, headers: responseCorsHeaders }
      );
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", bookingId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "No se pudo cancelar la cita" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    await supabase.from("activity_log").insert({
      website_id: booking.website_id,
      event_type: "booking_cancelled",
      event_data: {
        booking_id: bookingId,
        customer_id: customer.id,
        source: "customer_portal",
      },
    });

    const websiteInfo = Array.isArray(booking.website)
      ? booking.website[0]
      : booking.website;

    const { data: clientData } = await supabase
      .from("clients")
      .select("id, business_name, business_type, email")
      .eq("id", websiteInfo?.client_id ?? "")
      .maybeSingle();

    const config = (websiteInfo?.config || {}) as {
      businessName?: string;
      phone?: string;
      address?: string;
      email?: string;
      logo?: string;
      branding?: { logo?: string };
    };

    const businessName = config.businessName || clientData?.business_name || "Negocio";
    const logoUrl = config.branding?.logo || config.logo || undefined;

    const serviceNames = Array.isArray(booking.services)
      ? booking.services.map((item: { name?: string }) => item?.name).filter(Boolean).join(", ")
      : "";

    const emailData = {
      businessName,
      customerName: booking.customer_name,
      date: booking.booking_date,
      time: booking.booking_time,
      service: serviceNames,
      totalPrice: formatPrice(booking.total_price_cents),
      professional: (booking.professional as BookingProfessional | null)?.name || undefined,
      notes: booking.notes || undefined,
      phone: booking.customer_phone || undefined,
      email: booking.customer_email || undefined,
      businessPhone: config.phone,
      businessAddress: config.address,
      logoUrl,
    };

    if (booking.customer_email && clientData?.business_type) {
      const fromAddress = getFromAddress(businessName);
      const cancellationHtml =
        clientData.business_type === "clinic"
          ? getClinicAppointmentCancellationEmail(emailData)
          : getSalonAppointmentCancellationEmail(emailData);

      await sendEmail({
        to: booking.customer_email,
        subject: `Cita cancelada - ${businessName}`,
        html: cancellationHtml,
        from: fromAddress,
        replyTo: clientData.email || undefined,
      });
    }

    const adminEmail = clientData?.email || config.email;
    if (adminEmail) {
      const adminHtml = buildAdminCancellationEmail({
        businessName,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        date: booking.booking_date,
        time: booking.booking_time,
        service: serviceNames,
        professional: (booking.professional as BookingProfessional | null)?.name || undefined,
        notes: booking.notes,
        totalPrice: formatPrice(booking.total_price_cents),
      });

      await sendEmail({
        to: adminEmail,
        subject: `Cancelacion de cita - ${businessName}`,
        html: adminHtml,
        from: getFromAddress(businessName),
        replyTo: booking.customer_email || clientData?.email || undefined,
      });
    }

    return NextResponse.json(
      { success: true, status: "cancelled" },
      { headers: responseCorsHeaders }
    );
  } catch (error) {
    console.error("[bookings/cancel] Error interno:", error);
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
