import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { isValidUuid } from "@neumorstudio/api-utils/validation";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getAuthorizedWebsiteId(userId: string, websiteId: string) {
  const supabaseAdmin = getSupabaseAdmin();

  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("auth_user_id", userId)
    .single();

  if (!client) return null;

  const { data: website } = await supabaseAdmin
    .from("websites")
    .select("id")
    .eq("id", websiteId)
    .eq("client_id", client.id)
    .single();

  return website?.id || null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { websiteId, subscription } = body as {
      websiteId?: string;
      subscription?: {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
      };
    };

    if (!websiteId || !isValidUuid(websiteId)) {
      return NextResponse.json({ error: "Website invalido" }, { status: 400 });
    }

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Suscripcion invalida" }, { status: 400 });
    }

    const authorizedWebsiteId = await getAuthorizedWebsiteId(user.id, websiteId);
    if (!authorizedWebsiteId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          website_id: authorizedWebsiteId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          user_agent: request.headers.get("user-agent"),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      console.error("Error saving push subscription:", error);
      return NextResponse.json({ error: "Error al guardar suscripcion" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { websiteId, endpoint } = body as { websiteId?: string; endpoint?: string };

    if (!websiteId || !isValidUuid(websiteId)) {
      return NextResponse.json({ error: "Website invalido" }, { status: 400 });
    }

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint invalido" }, { status: 400 });
    }

    const authorizedWebsiteId = await getAuthorizedWebsiteId(user.id, websiteId);
    if (!authorizedWebsiteId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("website_id", authorizedWebsiteId)
      .eq("endpoint", endpoint);

    if (error) {
      console.error("Error deleting push subscription:", error);
      return NextResponse.json({ error: "Error al eliminar suscripcion" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Push subscription API error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
