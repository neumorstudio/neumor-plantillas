import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getFitnessBookingConfirmationEmail,
  getFitnessBookingNotificationEmail,
} from "@/lib/email-templates";

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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
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

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;

function isValidUuid(value: string) {
  return uuidRegex.test(value);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getUnknownKeys(value: Record<string, unknown>, allowed: Set<string>) {
  return Object.keys(value).filter((key) => !allowed.has(key));
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
    if (!isPlainObject(rawBody)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (getUnknownKeys(rawBody, allowedBookingKeys).length > 0) {
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

    const nombre = body.nombre.trim().slice(0, 200);
    const telefono = body.telefono.trim().slice(0, 50);
    const clase = body.clase.trim().slice(0, 120);
    const nivel = body.nivel?.trim().slice(0, 120) || "";
    const notas = body.notas?.trim().slice(0, 1000) || "";
    const email = body.email?.trim().slice(0, 254) || "";

    if (!nombre || !telefono || !clase) {
      return NextResponse.json(
        { error: "Nombre, telefono y clase son requeridos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (!dateRegex.test(body.fecha) || !timeRegex.test(body.hora)) {
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
      console.error("Website no encontrado:", websiteError);
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
      console.error("Error creando reserva:", bookingError);
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
      if (!result.success) {
        console.error("Error enviando email al cliente:", result.error);
      }
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
      if (!result.success) {
        console.error("Error enviando email al negocio:", result.error);
      }
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
  } catch (error) {
    console.error("Error en API de entrenamientos:", error);
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
  const corsHeaders = await getCorsHeadersForOrigin(origin);

  if (!corsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
