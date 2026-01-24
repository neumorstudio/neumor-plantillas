import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getRepairsQuoteConfirmationEmail,
  getRepairsQuoteNotificationEmail,
} from "@/lib/email-templates";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface QuoteDetails {
  work_type?: string;
  property_type?: string;
  location?: string;
  area?: string;
  timeline?: string;
  budget?: string;
}

interface QuoteData {
  website_id: string;
  name: string;
  email?: string;
  phone: string;
  message: string;
  lead_type?: string;
  source?: string;
  details?: QuoteDetails;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
const allowedQuoteKeys = new Set([
  "website_id",
  "name",
  "email",
  "phone",
  "message",
  "lead_type",
  "source",
  "details",
]);

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

function getLabel(value: string, map: Record<string, string>) {
  return map[value] || value;
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

    if (getUnknownKeys(rawBody, allowedQuoteKeys).length > 0) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const body = rawBody as unknown as QuoteData;

    if (!body.website_id || !body.name || !body.phone || !body.message || !isValidUuid(body.website_id)) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: website_id, name, phone, message" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (
      typeof body.name !== "string" ||
      typeof body.phone !== "string" ||
      typeof body.message !== "string" ||
      (body.email && typeof body.email !== "string") ||
      (body.lead_type && typeof body.lead_type !== "string") ||
      (body.source && typeof body.source !== "string") ||
      (body.details && !isPlainObject(body.details))
    ) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const name = body.name.trim().slice(0, 200);
    const phone = body.phone.trim().slice(0, 50);
    const message = body.message.trim().slice(0, 2000);
    const email = body.email?.trim().slice(0, 254) || "";

    if (!name || !phone || !message) {
      return NextResponse.json(
        { error: "Nombre, telefono y mensaje son requeridos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const rawDetails = (body.details || {}) as QuoteDetails;
    const details: QuoteDetails = {
      work_type: typeof rawDetails.work_type === "string" ? rawDetails.work_type.trim().slice(0, 120) : "",
      property_type: typeof rawDetails.property_type === "string" ? rawDetails.property_type.trim().slice(0, 120) : "",
      location: typeof rawDetails.location === "string" ? rawDetails.location.trim().slice(0, 200) : "",
      area: typeof rawDetails.area === "string" ? rawDetails.area.trim().slice(0, 120) : "",
      timeline: typeof rawDetails.timeline === "string" ? rawDetails.timeline.trim().slice(0, 120) : "",
      budget: typeof rawDetails.budget === "string" ? rawDetails.budget.trim().slice(0, 120) : "",
    };
    const cleanedDetails = Object.fromEntries(
      Object.entries(details).filter(([, value]) => value)
    );

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
      .select("email, business_name")
      .eq("id", website.client_id)
      .single();

    const { data: notificationSettings } = await getSupabaseAdmin()
      .from("notification_settings")
      .select("*")
      .eq("website_id", body.website_id)
      .single();

    const { data: lead, error: leadError } = await getSupabaseAdmin()
      .from("leads")
      .insert({
        website_id: body.website_id,
        name,
        email: email || null,
        phone: phone,
        message,
        lead_type: body.lead_type || "quote",
        source: body.source || "website",
        details: cleanedDetails,
      })
      .select()
      .single();

    if (leadError) {
      console.error("Error creando presupuesto:", leadError);
      return NextResponse.json(
        { error: "Error al guardar la solicitud" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const workTypeLabels: Record<string, string> = {
      "reforma-integral": "Reforma integral",
      "reforma-bano": "Reforma de bano",
      "reforma-cocina": "Reforma de cocina",
      pintura: "Pintura y acabados",
      instalaciones: "Instalaciones",
      reparacion: "Reparacion urgente",
      otro: "Otro",
    };

    const propertyTypeLabels: Record<string, string> = {
      vivienda: "Vivienda",
      local: "Local comercial",
      oficina: "Oficina",
      comunidad: "Comunidad",
    };

    const budgetLabels: Record<string, string> = {
      "menos-3000": "Menos de 3000 EUR",
      "3000-8000": "3000 - 8000 EUR",
      "8000-15000": "8000 - 15000 EUR",
      "mas-15000": "Mas de 15000 EUR",
    };

    const detailItems = [
      details.work_type
        ? { label: "Tipo de trabajo", value: getLabel(details.work_type, workTypeLabels) }
        : null,
      details.property_type
        ? { label: "Tipo de inmueble", value: getLabel(details.property_type, propertyTypeLabels) }
        : null,
      details.location ? { label: "Ubicacion", value: details.location } : null,
      details.area ? { label: "Metros aproximados", value: details.area } : null,
      details.timeline ? { label: "Fecha aproximada", value: details.timeline } : null,
      details.budget ? { label: "Presupuesto", value: getLabel(details.budget, budgetLabels) } : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;

    const businessName =
      (website.config as { businessName?: string })?.businessName ||
      client?.business_name ||
      "Reparaciones";
    const businessPhone = (website.config as { phone?: string })?.phone;
    const businessAddress = (website.config as { address?: string })?.address;
    const businessEmail = client?.email;

    const emailData = {
      businessName,
      customerName: name,
      email: email || undefined,
      phone,
      message,
      details: detailItems,
      businessPhone,
      businessAddress,
    };

    const emailResults = {
      customerEmail: false,
      businessEmail: false,
    };

    const fromAddress = getFromAddress(businessName);

    if (email) {
      const customerHtml = getRepairsQuoteConfirmationEmail(emailData);
      const result = await sendEmail({
        to: email,
        subject: `Solicitud de presupuesto - ${businessName}`,
        html: customerHtml,
        from: fromAddress,
        replyTo: businessEmail || undefined,
      });
      emailResults.customerEmail = result.success;
      if (!result.success) {
        console.error("Error enviando email al cliente:", result.error);
      }
    }

    if (businessEmail && notificationSettings?.email_new_lead !== false) {
      const businessHtml = getRepairsQuoteNotificationEmail(emailData);
      const result = await sendEmail({
        to: businessEmail,
        subject: `Nuevo presupuesto: ${name}`,
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
      action: "lead_created",
      details: {
        lead_id: lead.id,
        customer_name: name,
        emails_sent: emailResults,
        type: "quote",
      },
    });

    return NextResponse.json(
      {
        success: true,
        lead_id: lead.id,
        message: "Solicitud creada correctamente",
        emails: emailResults,
      },
      { headers: responseCorsHeaders }
    );
  } catch (error) {
    console.error("Error en API de presupuestos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500, headers: responseCorsHeaders }
    );
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
