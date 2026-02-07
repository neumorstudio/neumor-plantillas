import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Create template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { websiteId, name, subject, preview_text, html_content } = body;

    // Verify ownership
    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { data: website } = await supabase
      .from("websites")
      .select("id")
      .eq("id", websiteId)
      .eq("client_id", client.id)
      .single();

    if (!website) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Create template
    const { data: template, error } = await supabase
      .from("newsletter_templates")
      .insert({
        website_id: websiteId,
        name,
        subject,
        preview_text,
        html_content,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Error al crear plantilla" }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Update template
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, subject, preview_text, html_content } = body;

    // Update template
    const { data: template, error } = await supabase
      .from("newsletter_templates")
      .update({
        name,
        subject,
        preview_text,
        html_content,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Error al actualizar plantilla" }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Delete template
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const { error } = await supabase
      .from("newsletter_templates")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: "Error al eliminar plantilla" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
