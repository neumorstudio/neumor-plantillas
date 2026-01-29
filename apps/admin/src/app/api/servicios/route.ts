import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { getWebsiteId } from "@/lib/data";

type ServiceCategory = {
  id: string;
  website_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

type ServiceItem = {
  id: string;
  category_id: string;
  website_id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
};

async function loadServiceCatalog(websiteId: string) {
  const supabase = await createClient();

  const { data: categories, error: categoriesError } = await supabase
    .from("service_categories")
    .select("id, website_id, name, icon, sort_order, is_active")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  const { data: items, error: itemsError } = await supabase
    .from("service_items")
    .select(
      "id, category_id, website_id, name, price_cents, duration_minutes, notes, sort_order, is_active"
    )
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const categoryMap = new Map<string, ServiceCategory & { items: ServiceItem[] }>();
  (categories || []).forEach((category) => {
    categoryMap.set(category.id, { ...category, items: [] });
  });

  (items || []).forEach((item) => {
    const category = categoryMap.get(item.category_id);
    if (category) {
      category.items.push(item);
    }
  });

  return Array.from(categoryMap.values());
}

export async function GET() {
  const websiteId = await getWebsiteId();
  if (!websiteId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await loadServiceCatalog(websiteId);
    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error loading services";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const websiteId = await getWebsiteId();
  if (!websiteId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const payload = await request.json();
  const action = payload?.action as string | undefined;

  try {
    switch (action) {
      case "createCategory": {
        const name = String(payload?.name || "").trim();
        if (!name) {
          return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
        }
        const { error } = await supabase.from("service_categories").insert({
          website_id: websiteId,
          name,
          icon: payload?.icon ? String(payload.icon) : null,
          sort_order: Number(payload?.sortOrder ?? 0),
          is_active: payload?.isActive ?? true,
        });
        if (error) throw new Error(error.message);
        break;
      }
      case "updateCategory": {
        const id = String(payload?.id || "");
        if (!id) {
          return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }
        const updateData: Record<string, unknown> = {};
        if (payload?.name !== undefined) updateData.name = String(payload.name).trim();
        if (payload?.icon !== undefined) updateData.icon = payload.icon ? String(payload.icon) : null;
        if (payload?.sortOrder !== undefined) updateData.sort_order = Number(payload.sortOrder);
        if (payload?.isActive !== undefined) updateData.is_active = Boolean(payload.isActive);
        const { error } = await supabase
          .from("service_categories")
          .update(updateData)
          .eq("id", id)
          .eq("website_id", websiteId);
        if (error) throw new Error(error.message);
        break;
      }
      case "deleteCategory": {
        const id = String(payload?.id || "");
        if (!id) {
          return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }
        const { error } = await supabase
          .from("service_categories")
          .delete()
          .eq("id", id)
          .eq("website_id", websiteId);
        if (error) throw new Error(error.message);
        break;
      }
      case "createItem": {
        const name = String(payload?.name || "").trim();
        const categoryId = String(payload?.categoryId || "");
        if (!name || !categoryId) {
          return NextResponse.json({ error: "Nombre y categoria requeridos" }, { status: 400 });
        }

        const { data: category, error: categoryError } = await supabase
          .from("service_categories")
          .select("id, website_id")
          .eq("id", categoryId)
          .single();

        if (categoryError || !category || category.website_id !== websiteId) {
          return NextResponse.json({ error: "Categoria invalida" }, { status: 400 });
        }

        const { error } = await supabase.from("service_items").insert({
          website_id: websiteId,
          category_id: categoryId,
          name,
          price_cents: Number(payload?.priceCents ?? 0),
          duration_minutes: Number(payload?.durationMinutes ?? 30),
          notes: payload?.notes ? String(payload.notes) : null,
          sort_order: Number(payload?.sortOrder ?? 0),
          is_active: payload?.isActive ?? true,
        });
        if (error) throw new Error(error.message);
        break;
      }
      case "updateItem": {
        const id = String(payload?.id || "");
        if (!id) {
          return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }
        const updateData: Record<string, unknown> = {};
        if (payload?.name !== undefined) updateData.name = String(payload.name).trim();
        if (payload?.priceCents !== undefined) updateData.price_cents = Number(payload.priceCents);
        if (payload?.durationMinutes !== undefined) {
          updateData.duration_minutes = Number(payload.durationMinutes);
        }
        if (payload?.notes !== undefined) updateData.notes = payload.notes ? String(payload.notes) : null;
        if (payload?.sortOrder !== undefined) updateData.sort_order = Number(payload.sortOrder);
        if (payload?.isActive !== undefined) updateData.is_active = Boolean(payload.isActive);
        const { error } = await supabase
          .from("service_items")
          .update(updateData)
          .eq("id", id)
          .eq("website_id", websiteId);
        if (error) throw new Error(error.message);
        break;
      }
      case "deleteItem": {
        const id = String(payload?.id || "");
        if (!id) {
          return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }
        const { error } = await supabase
          .from("service_items")
          .delete()
          .eq("id", id)
          .eq("website_id", websiteId);
        if (error) throw new Error(error.message);
        break;
      }
      default:
        return NextResponse.json({ error: "Accion invalida" }, { status: 400 });
    }

    const categories = await loadServiceCatalog(websiteId);
    return NextResponse.json({ categories });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error processing request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
