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
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return NextResponse.json({ error: "No website found" }, { status: 401 });
  }

  let query = supabase
    .from("bookings")
    .select(`
      *,
      customers(id, name, email, phone),
      trainer_services(id, name, duration_minutes, price_cents),
      client_packages(id, name, remaining_sessions)
    `)
    .eq("website_id", websiteId)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  // Filter by specific date
  if (date) {
    query = query.eq("booking_date", date);
  }
  // Filter by year and month (for calendar view)
  else if (year && month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    query = query.gte("booking_date", start).lte("booking_date", end);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
