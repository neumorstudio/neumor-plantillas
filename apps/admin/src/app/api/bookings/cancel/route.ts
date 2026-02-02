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

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const allowedCancelKeys = new Set(["booking_id"]);

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
      .select("id, status, website_id, customer_id, website:websites(domain)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Reserva no encontrada" },
        { status: 404, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (origin) {
      const websiteDomain = Array.isArray(booking.website)
        ? booking.website[0]?.domain
        : booking.website?.domain;
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
