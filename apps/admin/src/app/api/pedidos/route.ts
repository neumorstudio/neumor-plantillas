import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getBusinessType, getWebsiteId } from "@/lib/data";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const allowedStatuses = new Set(["pending", "confirmed", "ready", "cancelled"]);

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

async function assertRestaurantAccess() {
  const [businessType, websiteId] = await Promise.all([getBusinessType(), getWebsiteId()]);
  if (!websiteId) {
    return { error: NextResponse.json({ error: "Website no encontrado" }, { status: 404 }) };
  }
  if (businessType !== "restaurant") {
    return { error: NextResponse.json({ error: "No disponible para este tipo de negocio" }, { status: 403 }) };
  }
  return { websiteId };
}

export async function GET(request: NextRequest) {
  const access = await assertRestaurantAccess();
  if ("error" in access) return access.error;

  const supabase = await createClient();
  const url = new URL(request.url);
  const dateParam = url.searchParams.get("date");
  const date = dateParam && dateRegex.test(dateParam) ? dateParam : todayIsoDate();

  let query = supabase
    .from("orders")
    .select(
      "id, website_id, customer_name, customer_phone, customer_email, pickup_date, pickup_time, status, total_amount, created_at, order_items(id, item_name, quantity, unit_price, total_price)"
    )
    .eq("website_id", access.websiteId)
    .order("pickup_date", { ascending: true })
    .order("pickup_time", { ascending: true });

  if (date) {
    query = query.eq("pickup_date", date);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Error al cargar pedidos" }, { status: 500 });
  }

  return NextResponse.json({ date, orders: data || [] });
}

export async function PATCH(request: NextRequest) {
  const access = await assertRestaurantAccess();
  if ("error" in access) return access.error;

  const supabase = await createClient();
  const body = (await request.json()) as { id?: string; status?: string };
  const id = typeof body.id === "string" ? body.id : "";
  const status = typeof body.status === "string" ? body.status : "";

  if (!id || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .eq("website_id", access.websiteId)
    .select(
      "id, website_id, customer_name, customer_phone, customer_email, pickup_date, pickup_time, status, total_amount, created_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No se pudo actualizar el pedido" }, { status: 500 });
  }

  return NextResponse.json({ order: data });
}

