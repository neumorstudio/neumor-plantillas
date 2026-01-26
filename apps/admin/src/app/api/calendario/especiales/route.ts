import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface SpecialDayInput {
  id?: string;
  date: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  note?: string | null;
  slots?: {
    id?: string;
    open_time: string;
    close_time: string;
    sort_order?: number;
  }[];
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

    const payload = specialDays.map((item) => {
      const slotFallback =
        item.slots && item.slots.length
          ? item.slots
          : item.is_open
            ? [
                {
                  open_time: item.open_time,
                  close_time: item.close_time,
                },
              ]
            : [];
      const firstSlot = slotFallback[0];
      const lastSlot = slotFallback[slotFallback.length - 1];

      return {
        ...(item.id ? { id: item.id } : {}),
        website_id: website.id,
        date: item.date,
        is_open: item.is_open,
        open_time: firstSlot?.open_time || item.open_time,
        close_time: lastSlot?.close_time || item.close_time,
        note: item.note || null,
      };
    });

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

    const dayIds = (data || []).map((item) => item.id);
    if (dayIds.length) {
      await supabase.from("special_day_slots").delete().in("special_day_id", dayIds);
    }

    const slotPayload = (specialDays || []).flatMap((item) => {
      const match = (data || []).find((day) => day.date === item.date);
      if (!match || !item.is_open) return [];
      const sourceSlots =
        item.slots && item.slots.length
          ? item.slots
          : [
              {
                open_time: item.open_time,
                close_time: item.close_time,
              },
            ];

      return sourceSlots.map((slot, index) => ({
        ...(slot.id ? { id: slot.id } : {}),
        special_day_id: match.id,
        open_time: slot.open_time,
        close_time: slot.close_time,
        sort_order: slot.sort_order ?? index,
      }));
    });

    if (slotPayload.length) {
      const { error: slotError } = await supabase
        .from("special_day_slots")
        .insert(slotPayload);
      if (slotError) {
        return NextResponse.json(
          { error: slotError.message || "No se pudo guardar", details: slotError.details || null },
          { status: 500 }
        );
      }
    }

    const { data: slots } = await supabase
      .from("special_day_slots")
      .select("id, special_day_id, open_time, close_time, sort_order")
      .in("special_day_id", dayIds)
      .order("sort_order", { ascending: true });

    const slotsByDay = (slots || []).reduce<Record<string, typeof slots>>((acc, slot) => {
      const key = slot.special_day_id;
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    }, {});

    const merged = (data || []).map((item) => ({
      ...item,
      slots: slotsByDay[item.id] || [],
    }));

    return NextResponse.json(merged);
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
