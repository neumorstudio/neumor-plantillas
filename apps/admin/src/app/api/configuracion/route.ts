import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      clientId,
      websiteId,
      businessData,
      notificationSettings,
    } = body as {
      clientId: string;
      websiteId: string;
      businessData: { business_name: string; phone?: string | null; address?: string | null };
      notificationSettings: Record<string, unknown>;
    };

    // Verify user owns this client (by auth_user_id)
    const { data: client } = await supabase
      .from("clients")
      .select("id, auth_user_id, email")
      .eq("id", clientId)
      .single();

    if (!client || client.auth_user_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Update client data
    const { error: clientError } = await supabase
      .from("clients")
      .update({
        business_name: businessData.business_name,
        phone: businessData.phone || null,
        address: businessData.address || null,
      })
      .eq("id", clientId);

    if (clientError) {
      return NextResponse.json(
        { error: "Error al actualizar datos del negocio" },
        { status: 500 }
      );
    }

    const { data: website } = await supabase
      .from("websites")
      .select("id, config")
      .eq("id", websiteId)
      .single();

    if (website) {
      const nextConfig: Record<string, unknown> = {
        ...(website.config || {}),
        businessName: businessData.business_name,
        phone: businessData.phone || null,
        address: businessData.address || null,
        email: client.email || null,
      };

      const { error: websiteError } = await supabase
        .from("websites")
        .update({ config: nextConfig })
        .eq("id", websiteId);

      if (websiteError) {
        return NextResponse.json(
          { error: "Error al actualizar configuracion del sitio" },
          { status: 500 }
        );
      }
    }

    // Upsert notification settings
    const { error: settingsError } = await supabase
      .from("notification_settings")
      .upsert(
        {
          website_id: websiteId,
          email_booking_confirmation: notificationSettings.email_booking_confirmation,
          whatsapp_booking_confirmation: notificationSettings.whatsapp_booking_confirmation,
          reminder_24h: notificationSettings.reminder_24h,
          reminder_time: notificationSettings.reminder_time,
          email_new_lead: notificationSettings.email_new_lead,
          whatsapp_new_lead: notificationSettings.whatsapp_new_lead,
        },
        {
          onConflict: "website_id",
        }
      );

    if (settingsError) {
      return NextResponse.json(
        { error: "Error al actualizar configuracion de notificaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
