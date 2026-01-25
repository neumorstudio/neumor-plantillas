import { createClient } from "@/lib/supabase-server";
import { getBookingsForMonth, getWebsiteId } from "@/lib/data";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year"));
    const month = Number(url.searchParams.get("month"));

    if (!Number.isFinite(year) || !Number.isFinite(month)) {
      return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 });
    }

    const websiteId = await getWebsiteId();
    if (!websiteId) {
      return NextResponse.json({ error: "Website no encontrado" }, { status: 404 });
    }

    const bookings = await getBookingsForMonth(year, month);
    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
