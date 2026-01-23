import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

async function getWebsiteId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("websites(id)")
    .eq("auth_user_id", user.id)
    .single();

  // @ts-expect-error - Supabase types issue with nested select
  return client?.websites?.id || null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return NextResponse.json({ error: "No website found" }, { status: 401 });
  }

  let query = supabase
    .from("bookings")
    .select("*, customers(id, name), trainer_services(id, name, duration_minutes)")
    .eq("website_id", websiteId)
    .order("booking_time", { ascending: true });

  if (date) {
    query = query.eq("booking_date", date);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
