import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import { sendBatchEmails } from "@/lib/resend";

// Send campaign via Resend (directo, sin n8n)
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

    // Get website config for restaurant name
    const { data: website } = await supabase
      .from("websites")
      .select("config")
      .eq("id", websiteId)
      .single();

    const restaurantName = website?.config?.businessName || "Restaurante";

    // Get subscribers based on filter
    let subscribersQuery = supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("website_id", websiteId)
      .eq("is_subscribed", true);

    if (audienceFilter === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      subscribersQuery = subscribersQuery.gte(
        "last_booking_date",
        thirtyDaysAgo.toISOString()
      );
    } else if (audienceFilter === "inactive") {
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
        name: name || \`Campana \${new Date().toLocaleDateString("es-ES")}\`,
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
        { error: "Error creando campana" },
        { status: 500 }
      );
    }

    // Preparar emails personalizados
    const emails = subscribers.map((subscriber) => {
      let html = template.html_content
        .replace(/\{\{restaurantName\}\}/g, restaurantName)
        .replace(/\{\{name\}\}/g, subscriber.name || "Cliente")
        .replace(/\{\{unsubscribeLink\}\}/g, \`#unsubscribe-\${subscriber.id}\`);

      return {
        to: subscriber.email,
        subject: template.subject.replace(/\{\{restaurantName\}\}/g, restaurantName),
        html,
      };
    });

    // Enviar emails con Resend
    console.log(\`Enviando \${emails.length} emails via Resend...\`);
    const result = await sendBatchEmails(emails);
    console.log(\`Resultado: \${result.success} enviados, \${result.failed} fallidos\`);

    // Actualizar campana
    const finalStatus = result.failed === 0 ? "sent" : result.success === 0 ? "failed" : "sent";

    await supabase
      .from("newsletter_campaigns")
      .update({
        status: finalStatus,
        emails_sent: result.success,
        emails_failed: result.failed,
        error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
      })
      .eq("id", campaign.id);

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      recipientsCount: subscribers.length,
      emailsSent: result.success,
      emailsFailed: result.failed,
      message: result.failed === 0
        ? \`Enviado a \${result.success} suscriptores\`
        : \`Enviado a \${result.success} suscriptores (\${result.failed} fallidos)\`,
    });

  } catch (error) {
    console.error("Newsletter send error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
