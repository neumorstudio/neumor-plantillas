import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface InternalBookingInput {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  booking_date: string;
  booking_time: string;
  professional_id?: string | null;
  notes?: string | null;
  services?: {
    id: string;
    name: string;
    price_cents: number;
    duration_minutes: number;
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

    const body = (await request.json()) as InternalBookingInput;
    const {
      customer_name,
      customer_phone,
      customer_email,
      booking_date,
      booking_time,
      professional_id,
      notes,
      services,
    } = body;

    if (!customer_name || !customer_phone || !booking_date || !booking_time) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id, auth_user_id, business_type")
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

    const businessType = client?.business_type || "salon";
    const isRestaurant = businessType === "restaurant";

    if (!isRestaurant && (!professional_id || !services?.length)) {
      return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const safeServices = services ?? [];
    const totalPrice = safeServices.reduce((sum, service) => sum + (service.price_cents || 0), 0);
    const totalDuration = safeServices.reduce(
      (sum, service) => sum + (service.duration_minutes || 0),
      0
    );

    const payload = {
      website_id: website.id,
      customer_name,
      customer_phone,
      customer_email: customer_email || null,
      booking_date,
      booking_time,
      professional_id: isRestaurant ? null : professional_id,
      guests: 1,
      notes: notes || null,
      status: "confirmed",
      source: "phone",
      services: isRestaurant ? [] : safeServices,
      total_price_cents: isRestaurant ? null : totalPrice,
      total_duration_minutes: isRestaurant ? null : totalDuration,
    };

    const { data, error } = await supabase
      .from("bookings")
      .insert(payload)
      .select(
        "id, customer_name, customer_email, customer_phone, booking_date, booking_time, professional_id, services, status, notes, total_price_cents, total_duration_minutes, created_at"
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message || "No se pudo crear" }, { status: 500 });
    }

    return NextResponse.json({ booking: data });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
