import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getRepairsQuoteConfirmationEmail,
  getRepairsQuoteNotificationEmail,
} from "@/lib/email-templates";
import {
  isPlainObject,
  hasUnknownKeys,
  isValidUuid,
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

async function getCorsHeaders(origin: string | null) {
  return getCorsHeadersForOrigin(
    origin,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
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

    if (hasUnknownKeys(rawBody, allowedQuoteKeys)) {
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

    const name = sanitizeString(body.name, 200);
    const phone = sanitizeString(body.phone, 50);
    const message = sanitizeString(body.message, 2000);
    const email = sanitizeString(body.email || "", 254);

    if (!name || !phone || !message) {
      return NextResponse.json(
        { error: "Nombre, telefono y mensaje son requeridos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const rawDetails = (body.details || {}) as QuoteDetails;
    const details: QuoteDetails = {
      work_type: sanitizeString(rawDetails.work_type || "", 120),
      property_type: sanitizeString(rawDetails.property_type || "", 120),
      location: sanitizeString(rawDetails.location || "", 200),
      area: sanitizeString(rawDetails.area || "", 120),
      timeline: sanitizeString(rawDetails.timeline || "", 120),
      budget: sanitizeString(rawDetails.budget || "", 120),
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
    console.error("[presupuestos] Error interno:", error);
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
