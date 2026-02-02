import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

interface ProfessionalInput {
  id?: string;
  name: string;
  description?: string;
  is_active?: boolean;
  sort_order?: number;
  category_ids?: string[];
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
    const { action, professional } = body as {
      action: "create" | "update" | "delete";
      professional?: ProfessionalInput;
    };

    if (!action || !professional) {
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

    if (action === "create") {
      const { data: existing } = await supabase
        .from("professionals")
        .select("id, sort_order")
        .eq("website_id", website.id)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
      const { data: created, error } = await supabase
        .from("professionals")
        .insert({
          website_id: website.id,
          name: professional.name,
          description: professional.description || null,
          is_active: true,
          sort_order: nextOrder,
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
      }

      if (created?.id) {
        const { data: categories } = await supabase
          .from("service_categories")
          .select("id")
          .eq("website_id", website.id);
        const categoryIds =
          professional.category_ids?.length
            ? professional.category_ids
            : (categories || []).map((category) => category.id);

        if (categoryIds.length) {
          await supabase.from("professional_categories").insert(
            categoryIds.map((categoryId) => ({
              website_id: website.id,
              professional_id: created.id,
              category_id: categoryId,
            }))
          );
        }
      }
    }

    if (action === "update") {
      const { error } = await supabase
        .from("professionals")
        .update({
          name: professional.name,
          description: professional.description || null,
          is_active: professional.is_active ?? true,
          sort_order: professional.sort_order ?? 0,
        })
        .eq("id", professional.id)
        .eq("website_id", website.id);

      if (error) {
        return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 });
      }

      if (professional.category_ids) {
        await supabase
          .from("professional_categories")
          .delete()
          .eq("website_id", website.id)
          .eq("professional_id", professional.id);

        if (professional.category_ids.length) {
          const payload = professional.category_ids.map((categoryId) => ({
            website_id: website.id,
            professional_id: professional.id,
            category_id: categoryId,
          }));
          const { error: categoryError } = await supabase
            .from("professional_categories")
            .insert(payload);
          if (categoryError) {
            return NextResponse.json(
              {
                error: categoryError.message || "No se pudo guardar categorias",
                details: categoryError.details || null,
              },
              { status: 500 }
            );
          }
        }
      }
    }

    if (action === "delete") {
      const { error } = await supabase
        .from("professionals")
        .delete()
        .eq("id", professional.id)
        .eq("website_id", website.id);

      if (error) {
        return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
      }
    }

    const { data } = await supabase
      .from("professionals")
      .select("id, name, description, is_active, sort_order")
      .eq("website_id", website.id)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    const { data: categories } = await supabase
      .from("professional_categories")
      .select("professional_id, category_id")
      .eq("website_id", website.id);

    return NextResponse.json({
      professionals: data || [],
      professionalCategories: categories || [],
    });
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
