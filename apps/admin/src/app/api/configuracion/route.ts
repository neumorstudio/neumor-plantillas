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
    const { clientId, websiteId, businessData, notificationSettings } = body;

    // Verify user owns this client (by auth_user_id)
    const { data: client } = await supabase
      .from("clients")
      .select("id, auth_user_id")
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
      })
      .eq("id", clientId);

    if (clientError) {
      console.error("Error updating client:", clientError);
      return NextResponse.json(
        { error: "Error al actualizar datos del negocio" },
        { status: 500 }
      );
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
      console.error("Error updating settings:", settingsError);
      return NextResponse.json(
        { error: "Error al actualizar configuracion de notificaciones" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Configuration API error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
