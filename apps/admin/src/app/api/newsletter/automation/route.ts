import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const websiteId = searchParams.get("websiteId");

  if (!websiteId) {
    return NextResponse.json({ error: "Website ID requerido" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("newsletter_automation")
    .select("*")
    .eq("website_id", websiteId)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ automation: data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    websiteId,
    is_enabled,
    frequency,
    day_of_week,
    day_of_month,
    send_time,
    timezone,
    auto_audience,
    default_template_id,
  } = body;

  if (!websiteId) {
    return NextResponse.json({ error: "Website ID requerido" }, { status: 400 });
  }

  const supabase = await createClient();

  // Verificar si ya existe configuracion
  const { data: existing } = await supabase
    .from("newsletter_automation")
    .select("id")
    .eq("website_id", websiteId)
    .single();

  const automationData = {
    website_id: websiteId,
    is_enabled,
    frequency,
    day_of_week,
    day_of_month,
    send_time,
    timezone,
    auto_audience,
    default_template_id: default_template_id || null,
  };

  let result;

  if (existing) {
    // Actualizar
    result = await supabase
      .from("newsletter_automation")
      .update(automationData)
      .eq("id", existing.id)
      .select()
      .single();
  } else {
    // Crear
    result = await supabase
      .from("newsletter_automation")
      .insert(automationData)
      .select()
      .single();
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }

  return NextResponse.json({ automation: result.data });
}
