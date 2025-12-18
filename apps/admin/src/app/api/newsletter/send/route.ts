import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Send campaign via n8n webhook
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { templateId, audience, websiteId, name } = body;

    if (!templateId || !websiteId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const audienceFilter = audience;

    // Get template
    const { data: template, error: templateError } = await supabase
      .from("newsletter_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Plantilla no encontrada" },
        { status: 404 }
      );
    }

    // Get subscribers based on filter
    let subscribersQuery = supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("website_id", websiteId)
      .eq("is_subscribed", true);

    if (audienceFilter === "recent") {
      // Last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      subscribersQuery = subscribersQuery.gte(
        "last_booking_date",
        thirtyDaysAgo.toISOString()
      );
    } else if (audienceFilter === "inactive") {
      // No booking in last 60 days
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      subscribersQuery = subscribersQuery.lt(
        "last_booking_date",
        sixtyDaysAgo.toISOString()
      );
    }

    const { data: subscribers, error: subscribersError } = await subscribersQuery;

    if (subscribersError) {
      return NextResponse.json(
        { error: "Error obteniendo suscriptores" },
        { status: 500 }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        { error: "No hay suscriptores para esta audiencia" },
        { status: 400 }
      );
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from("newsletter_campaigns")
      .insert({
        website_id: websiteId,
        template_id: templateId,
        name: name || `Campaña ${new Date().toLocaleDateString("es-ES")}`,
        subject: template.subject,
        html_content: template.html_content,
        audience_type: audienceFilter || "all_customers",
        status: "sending",
        total_recipients: subscribers.length,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (campaignError) {
      return NextResponse.json(
        { error: "Error creando campaña" },
        { status: 500 }
      );
    }

    // Get website config for n8n webhook
    const { data: website } = await supabase
      .from("websites")
      .select("config")
      .eq("id", websiteId)
      .single();

    const n8nWebhook =
      website?.config?.newsletter_webhook ||
      process.env.N8N_NEWSLETTER_WEBHOOK_URL;

    if (!n8nWebhook) {
      // Update campaign as failed
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "failed" })
        .eq("id", campaign.id);

      return NextResponse.json(
        { error: "Webhook de n8n no configurado" },
        { status: 400 }
      );
    }

    // Send to n8n webhook
    try {
      console.log("Enviando a n8n webhook:", n8nWebhook);
      const response = await fetch(n8nWebhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          campaignId: campaign.id,
          templateId: template.id,
          subject: template.subject,
          previewText: template.preview_text,
          htmlContent: template.html_content,
          subscribers: subscribers.map((s) => ({
            email: s.email,
            name: s.name,
          })),
          websiteId,
        }),
      });

      console.log("Respuesta n8n:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error n8n response:", errorText);
        throw new Error(`Error en webhook n8n: ${response.status} - ${errorText}`);
      }

      // Update campaign as sent
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "sent", emails_sent: subscribers.length })
        .eq("id", campaign.id);

      return NextResponse.json({
        success: true,
        campaignId: campaign.id,
        recipientsCount: subscribers.length,
        message: `Enviando a ${subscribers.length} suscriptores`,
      });
    } catch (webhookError) {
      console.error("Webhook error:", webhookError);
      // Update campaign as failed
      await supabase
        .from("newsletter_campaigns")
        .update({ status: "failed", error_message: String(webhookError) })
        .eq("id", campaign.id);

      return NextResponse.json(
        { error: `Error enviando a n8n: ${webhookError}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Newsletter send error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
