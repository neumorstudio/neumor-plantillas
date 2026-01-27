import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getBusinessType, getWebsiteId } from "@/lib/data";

const allowedUpdateKeys = new Set([
  "name",
  "description",
  "price_cents",
  "category",
  "tag",
  "is_active",
  "sort_order",
  "image_url",
]);

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

export async function GET() {
  const access = await assertRestaurantAccess();
  if ("error" in access) return access.error;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select(
      "id, website_id, category, name, description, price_cents, image_url, tag, is_active, sort_order, updated_at"
    )
    .eq("website_id", access.websiteId)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Error al cargar el menu" }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

export async function PATCH(request: NextRequest) {
  const access = await assertRestaurantAccess();
  if ("error" in access) return access.error;

  const supabase = await createClient();
  const body = (await request.json()) as {
    id?: string;
    updates?: Record<string, unknown>;
  };

  const id = typeof body.id === "string" ? body.id : "";
  const updates = body.updates && typeof body.updates === "object" ? body.updates : null;

  if (!id || !updates) {
    return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
  }

  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(updates)) {
    if (!allowedUpdateKeys.has(key)) continue;
    if (key === "price_cents") {
      const numeric = Math.max(0, Math.floor(Number(value) || 0));
      payload.price_cents = numeric;
      continue;
    }
    if (key === "sort_order") {
      payload.sort_order = Math.floor(Number(value) || 0);
      continue;
    }
    payload[key] = value;
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "Sin cambios validos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("menu_items")
    .update(payload)
    .eq("id", id)
    .eq("website_id", access.websiteId)
    .select(
      "id, website_id, category, name, description, price_cents, image_url, tag, is_active, sort_order, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No se pudo actualizar el item" }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

export async function POST(request: NextRequest) {
  const access = await assertRestaurantAccess();
  if ("error" in access) return access.error;

  const supabase = await createClient();
  const body = (await request.json()) as {
    name?: string;
    category?: string;
    price_cents?: number;
  };

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const priceCents = Math.max(0, Math.floor(Number(body.price_cents) || 0));

  if (!name || !category || priceCents <= 0) {
    return NextResponse.json({ error: "Nombre, categoria y precio son requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      website_id: access.websiteId,
      name,
      category,
      price_cents: priceCents,
      is_active: true,
      sort_order: 0,
    })
    .select(
      "id, website_id, category, name, description, price_cents, image_url, tag, is_active, sort_order, updated_at"
    )
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No se pudo crear el item" }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

