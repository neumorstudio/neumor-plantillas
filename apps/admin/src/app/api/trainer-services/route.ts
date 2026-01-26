import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface ServiceInput {
  id?: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
}

async function getWebsiteId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!client) return null;

  const { data: website } = await supabase
    .from("websites")
    .select("id")
    .eq("client_id", client.id)
    .single();

  return website?.id || null;
}

export async function GET() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("trainer_services")
    .select("*")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const websiteId = await getWebsiteId();

    if (!websiteId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { action, service } = body as {
      action: "create" | "update" | "delete";
      service?: ServiceInput;
    };

    if (!action) {
      return NextResponse.json({ error: "Accion requerida" }, { status: 400 });
    }

    if (action === "create") {
      if (!service?.name) {
        return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
      }

      // Obtener el siguiente sort_order
      const { data: existing } = await supabase
        .from("trainer_services")
        .select("id, sort_order")
        .eq("website_id", websiteId)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;

      const { error } = await supabase.from("trainer_services").insert({
        website_id: websiteId,
        name: service.name,
        duration_minutes: service.duration_minutes || 60,
        price_cents: service.price_cents || 0,
        description: service.description || null,
        is_active: true,
        sort_order: nextOrder,
      });

      if (error) {
        return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
      }
    }

    if (action === "update") {
      if (!service?.id) {
        return NextResponse.json({ error: "ID requerido" }, { status: 400 });
      }

      const { error } = await supabase
        .from("trainer_services")
        .update({
          name: service.name,
          duration_minutes: service.duration_minutes,
          price_cents: service.price_cents,
          description: service.description,
          is_active: service.is_active ?? true,
          sort_order: service.sort_order,
        })
        .eq("id", service.id)
        .eq("website_id", websiteId);

      if (error) {
        return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
      }
    }

    if (action === "delete") {
      if (!service?.id) {
        return NextResponse.json({ error: "ID requerido" }, { status: 400 });
      }

      const { error } = await supabase
        .from("trainer_services")
        .delete()
        .eq("id", service.id)
        .eq("website_id", websiteId);

      if (error) {
        return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
      }
    }

    // Devolver lista actualizada
    const { data } = await supabase
      .from("trainer_services")
      .select("*")
      .eq("website_id", websiteId)
      .order("sort_order", { ascending: true });

    return NextResponse.json({ services: data || [] });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
