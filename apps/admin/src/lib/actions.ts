"use server";

import { createServerClient } from "@neumorstudio/supabase";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import type {
  Booking,
  BookingUpdate,
  Lead,
  LeadUpdate,
  NotificationSettingsUpdate,
} from "@neumorstudio/supabase";

// Create Supabase server client for Server Actions
// Note: Using any for now until Supabase types are generated from the actual database
async function getSupabase() {
  const cookieStore = await cookies();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>
        ) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
            }
          } catch {
            // Can fail in Server Components, handled by middleware
          }
        },
      },
    }
  );
}

// ============================================
// BOOKINGS ACTIONS
// ============================================

export async function getBookings(websiteId: string): Promise<Booking[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("website_id", websiteId)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateBookingStatus(
  bookingId: string,
  status: Booking["status"]
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reservas");
  return { success: true };
}

export async function updateBooking(
  bookingId: string,
  data: BookingUpdate
): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("bookings")
    .update(data)
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
}

// ============================================
// LEADS ACTIONS
// ============================================

export async function getLeads(websiteId: string): Promise<Lead[]> {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function updateLeadStatus(
  leadId: string,
  status: Lead["status"]
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await getSupabase();

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/leads");
  return { success: true };
}

export async function updateLead(
  leadId: string,
  data: LeadUpdate
): Promise<void> {
  const supabase = await getSupabase();

  const { error } = await supabase.from("leads").update(data).eq("id", leadId);

  if (error) throw new Error(error.message);
}

// ============================================
// NOTIFICATION SETTINGS ACTIONS
// ============================================

export async function getNotificationSettings(websiteId: string) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("website_id", websiteId)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data;
}

export async function updateNotificationSettings(
  websiteId: string,
  settings: NotificationSettingsUpdate
): Promise<void> {
  const supabase = await getSupabase();

  // Try to update first
  const { error: updateError } = await supabase
    .from("notification_settings")
    .update(settings)
    .eq("website_id", websiteId);

  // If no rows updated, insert
  if (updateError) {
    const { error: insertError } = await supabase
      .from("notification_settings")
      .insert({ website_id: websiteId, ...settings });

    if (insertError) throw new Error(insertError.message);
  }
}

// ============================================
// ACTIVITY LOG ACTIONS
// ============================================

export async function getRecentActivity(websiteId: string, limit = 10) {
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data || [];
}

// ============================================
// DASHBOARD STATS
// ============================================

export async function getDashboardStats(websiteId: string) {
  const supabase = await getSupabase();

  // Get bookings this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: bookingsThisMonth } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .gte("created_at", startOfMonth.toISOString());

  // Get new leads
  const { count: newLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .eq("status", "new");

  // Get pending bookings
  const { count: pendingBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .eq("status", "pending");

  return {
    bookingsThisMonth: bookingsThisMonth || 0,
    newLeads: newLeads || 0,
    pendingBookings: pendingBookings || 0,
  };
}
