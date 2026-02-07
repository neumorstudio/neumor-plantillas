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
    const { hours, slots } = body as {
      hours?: {
        day_of_week: number;
        is_open: boolean;
        open_time: string;
        close_time: string;
      }[];
      slots?: {
        day_of_week: number;
        open_time: string;
        close_time: string;
        sort_order?: number;
        is_active?: boolean;
      }[];
    };

    const slotsArray = Array.isArray(slots) ? slots : [];
    const hoursArray = Array.isArray(hours) ? hours : [];

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

    if (slotsArray.length) {
      const cleanedSlots = slotsArray
        .filter((slot) => slot.is_active !== false)
        .map((slot, index) => ({
          website_id: website.id,
          day_of_week: slot.day_of_week,
          open_time: slot.open_time,
          close_time: slot.close_time,
          sort_order: Number.isFinite(slot.sort_order) ? Number(slot.sort_order) : index,
          is_active: true,
        }));

      const { error: deleteError } = await supabase
        .from("business_hour_slots")
        .delete()
        .eq("website_id", website.id);

      if (deleteError) {
        return NextResponse.json({ error: "No se pudo actualizar tramos" }, { status: 500 });
      }

      if (cleanedSlots.length) {
        const { error: insertError } = await supabase
          .from("business_hour_slots")
          .insert(cleanedSlots);

        if (insertError) {
          return NextResponse.json({ error: "No se pudo guardar tramos" }, { status: 500 });
        }
      }
    }

    const toMinutes = (value: string) => {
      const [hoursValue, minutesValue] = value.split(":").map(Number);
      return (hoursValue || 0) * 60 + (minutesValue || 0);
    };

    const dayMap = new Map<number, { open: string; close: string }>();
    slotsArray.forEach((slot) => {
      if (slot.is_active === false) return;
      const current = dayMap.get(slot.day_of_week);
      if (!current) {
        dayMap.set(slot.day_of_week, { open: slot.open_time, close: slot.close_time });
        return;
      }
      if (toMinutes(slot.open_time) < toMinutes(current.open)) {
        current.open = slot.open_time;
      }
      if (toMinutes(slot.close_time) > toMinutes(current.close)) {
        current.close = slot.close_time;
      }
    });

    const payload = slotsArray.length
      ? Array.from({ length: 7 }).map((_, idx) => {
          const day = dayMap.get(idx);
          if (day) {
            return {
              website_id: website.id,
              day_of_week: idx,
              is_open: true,
              open_time: day.open,
              close_time: day.close,
            };
          }
          return {
            website_id: website.id,
            day_of_week: idx,
            is_open: false,
            open_time: "09:00",
            close_time: "19:00",
          };
        })
      : hoursArray.map((item) => ({
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

    const dayNames = [
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
      "domingo",
    ];

    const schedule = payload.reduce<Record<string, { open: string; close: string; closed?: boolean }>>(
      (acc, day) => {
        const key = dayNames[day.day_of_week] || `day-${day.day_of_week}`;
        acc[key] = {
          open: day.open_time,
          close: day.close_time,
          ...(day.is_open ? {} : { closed: true }),
        };
        return acc;
      },
      {}
    );

    const { data: websiteConfig } = await supabase
      .from("websites")
      .select("config")
      .eq("id", website.id)
      .single();

    const currentConfig =
      (websiteConfig?.config as Record<string, unknown> | null) || {};
    const currentOpenStatus =
      (currentConfig.openStatus as Record<string, unknown> | null) || {};
    const updatedConfig = {
      ...currentConfig,
      openStatus: {
        ...currentOpenStatus,
        schedule,
      },
    };

    await supabase
      .from("websites")
      .update({ config: updatedConfig })
      .eq("id", website.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
