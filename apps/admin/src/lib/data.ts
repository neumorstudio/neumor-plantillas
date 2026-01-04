import { createClient } from "./supabase-server";

// Get the current user's website ID
async function getWebsiteId() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get client's website
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!client) return null;

  const { data: website } = await supabase
    .from("websites")
    .select("id")
    .eq("client_id", client.id)
    .single();

  return website?.id || null;
}

// Dashboard stats
export async function getDashboardStats() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return {
      bookingsThisMonth: 0,
      newLeads: 0,
      pendingBookings: 0,
    };
  }

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];

  // Get bookings this month
  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .gte("created_at", firstDayStr);

  // Get new leads this month
  const { count: leadsCount } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .gte("created_at", firstDayStr);

  // Get pending bookings
  const { count: pendingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .eq("status", "pending");

  return {
    bookingsThisMonth: bookingsCount || 0,
    newLeads: leadsCount || 0,
    pendingBookings: pendingCount || 0,
  };
}

// Recent bookings
export async function getRecentBookings(limit = 5) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

// All bookings with pagination
export async function getBookings(page = 1, pageSize = 10) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { data: [], count: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("bookings")
    .select("*", { count: "exact" })
    .eq("website_id", websiteId)
    .order("booking_date", { ascending: false })
    .range(from, to);

  return { data: data || [], count: count || 0 };
}

// All leads with pagination
export async function getLeads(page = 1, pageSize = 10) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { data: [], count: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .range(from, to);

  return { data: data || [], count: count || 0 };
}

// Notification settings
export async function getNotificationSettings() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return null;

  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("website_id", websiteId)
    .single();

  return data;
}

// Update booking status
export async function updateBookingStatus(bookingId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);

  return { error };
}

// Update lead status
export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", leadId);

  return { error };
}

// Get client data with website info
export async function getClientData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { client: null, websiteId: null };

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!client) return { client: null, websiteId: null };

  const { data: website } = await supabase
    .from("websites")
    .select("id")
    .eq("client_id", client.id)
    .single();

  return { client, websiteId: website?.id || null };
}

// Update client data
export async function updateClientData(clientId: string, data: { business_name?: string; phone?: string }) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("clients")
    .update(data)
    .eq("id", clientId);

  return { error };
}

// Update notification settings
export async function updateNotificationSettings(websiteId: string, settings: {
  email_booking_confirmation?: boolean;
  whatsapp_booking_confirmation?: boolean;
  reminder_24h?: boolean;
  reminder_time?: string;
  email_new_lead?: boolean;
  whatsapp_new_lead?: boolean;
}) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("notification_settings")
    .upsert(
      { website_id: websiteId, ...settings },
      { onConflict: "website_id" }
    );

  return { error };
}

// Types for website configuration
export interface WebsiteConfig {
  businessName?: string;
  businessType?: string;
  variants?: {
    hero: "classic" | "modern" | "bold" | "minimal";
    menu: "tabs" | "grid" | "list" | "carousel";
    features: "cards" | "icons" | "banner";
    reviews: "grid" | "carousel" | "minimal";
    footer: "full" | "minimal" | "centered";
  };
}

export type Theme = "light" | "dark" | "colorful" | "rustic" | "elegant" | "neuglass" | "neuglass-dark";

// Get website personalization config
export async function getWebsiteConfig() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return null;
  }

  const { data: website } = await supabase
    .from("websites")
    .select("id, domain, theme, config")
    .eq("id", websiteId)
    .single();

  if (!website) {
    return null;
  }

  return {
    websiteId: website.id,
    domain: website.domain as string,
    theme: (website.theme || "light") as Theme,
    config: (website.config || {}) as WebsiteConfig,
  };
}
