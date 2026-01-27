import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail, getFromAddress } from "@/lib/resend";
import {
  getStoreContactConfirmationEmail,
  getStoreContactNotificationEmail,
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

interface StoreContactData {
  website_id: string;
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
}

const allowedContactKeys = new Set([
  "website_id",
  "nombre",
  "email",
  "telefono",
  "asunto",
  "mensaje",
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

    if (hasUnknownKeys(rawBody, allowedContactKeys)) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const body = rawBody as unknown as StoreContactData;

    if (
      !body.website_id ||
      !body.nombre ||
      !body.email ||
      !body.asunto ||
      !body.mensaje ||
      !isValidUuid(body.website_id)
    ) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: website_id, nombre, email, asunto, mensaje" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    if (
      typeof body.nombre !== "string" ||
      typeof body.email !== "string" ||
      typeof body.asunto !== "string" ||
      typeof body.mensaje !== "string" ||
      (body.telefono && typeof body.telefono !== "string")
    ) {
      return NextResponse.json(
        { error: "Datos invalidos" },
        { status: 400, headers: (await getFallbackCorsHeaders()) ?? undefined }
      );
    }

    const nombre = sanitizeString(body.nombre, 200);
    const email = sanitizeString(body.email, 254);
    const asunto = sanitizeString(body.asunto, 200);
    const mensaje = sanitizeString(body.mensaje, 2000);
    const telefono = sanitizeString(body.telefono || "", 50);

    if (!nombre || !email || !asunto || !mensaje) {
      return NextResponse.json(
        { error: "Nombre, email, asunto y mensaje son requeridos" },
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
        name: nombre,
        email: email,
        phone: telefono || null,
        message: mensaje,
        lead_type: "contact",
        source: "website",
        details: { subject: asunto },
      })
      .select()
      .single();

    if (leadError) {
      return NextResponse.json(
        { error: "Error al guardar el mensaje" },
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const businessName =
      (website.config as { businessName?: string })?.businessName ||
      client?.business_name ||
      "Tienda";
    const businessPhone = (website.config as { phone?: string })?.phone;
    const businessAddress = (website.config as { address?: string })?.address;
    const businessEmail = client?.email;

    const emailData = {
      businessName,
      customerName: nombre,
      email,
      phone: telefono || undefined,
      subject: asunto,
      message: mensaje,
      businessPhone,
      businessAddress,
    };

    const emailResults = {
      customerEmail: false,
      businessEmail: false,
    };

    const fromAddress = getFromAddress(businessName);

    if (email) {
      const customerHtml = getStoreContactConfirmationEmail(emailData);
      const result = await sendEmail({
        to: email,
        subject: `Hemos recibido tu mensaje - ${businessName}`,
        html: customerHtml,
        from: fromAddress,
        replyTo: businessEmail || undefined,
      });
      emailResults.customerEmail = result.success;
    }

    if (businessEmail && notificationSettings?.email_new_lead !== false) {
      const businessHtml = getStoreContactNotificationEmail(emailData);
      const result = await sendEmail({
        to: businessEmail,
        subject: `Nuevo mensaje: ${nombre} - ${asunto}`,
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
        customer_name: nombre,
        subject: asunto,
        emails_sent: emailResults,
        type: "contact",
      },
    });

    return NextResponse.json(
      {
        success: true,
        lead_id: lead.id,
        message: "Mensaje creado correctamente",
        emails: emailResults,
      },
      { headers: responseCorsHeaders }
    );
  } catch (error) {
    console.error("[contacto] Error interno:", error);
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
