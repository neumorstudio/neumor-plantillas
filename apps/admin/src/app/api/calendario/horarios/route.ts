import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { hours } = body as {
      hours: {
        day_of_week: number;
        is_open: boolean;
        open_time: string;
        close_time: string;
      }[];
    };

    if (!Array.isArray(hours)) {
      return NextResponse.json({ error: "Horas invalidas" }, { status: 400 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id, auth_user_id")
      .eq("auth_user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data: website } = await supabase
      .from("websites")
      .select("id")
      .eq("client_id", client.id)
      .single();

    if (!website) {
      return NextResponse.json({ error: "Website no encontrado" }, { status: 404 });
    }

    const payload = hours.map((item) => ({
      website_id: website.id,
      day_of_week: item.day_of_week,
      is_open: item.is_open,
      open_time: item.open_time,
      close_time: item.close_time,
    }));

    const { error } = await supabase
      .from("business_hours")
      .upsert(payload, { onConflict: "website_id,day_of_week" });

    if (error) {
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
