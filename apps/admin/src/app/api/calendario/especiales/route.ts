import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface SpecialDayInput {
  id?: string;
  date: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  note?: string | null;
}

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
    const { specialDays } = body as { specialDays: SpecialDayInput[] };

    if (!Array.isArray(specialDays)) {
      return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
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

    const payload = specialDays.map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      website_id: website.id,
      date: item.date,
      is_open: item.is_open,
      open_time: item.open_time,
      close_time: item.close_time,
      note: item.note || null,
    }));

    const { data, error } = await supabase
      .from("special_days")
      .upsert(payload, { onConflict: "website_id,date" })
      .select("id, date, is_open, open_time, close_time, note")
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message || "No se pudo guardar", details: error.details || null },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Id requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("special_days")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
