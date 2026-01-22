import { createClient } from "./supabase-server";

// Cached user context type
interface UserContext {
  userId: string;
  clientId: string;
  websiteId: string;
}

// Get user context with client and website in a single optimized query
// Reduces from 3 sequential queries to 1 auth + 1 join query
async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient();

  // Get current user (required for auth)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Single query with join: clients -> websites
  // This replaces 2 sequential queries with 1
  const { data } = await supabase
    .from("clients")
    .select("id, websites(id)")
    .eq("auth_user_id", user.id)
    .single();

  if (!data || !data.websites) return null;

  // Handle both array and single object response from Supabase
  const website = Array.isArray(data.websites) ? data.websites[0] : data.websites;
  if (!website?.id) return null;

  return {
    userId: user.id,
    clientId: data.id,
    websiteId: website.id,
  };
}

// Get the current user's website ID (optimized wrapper)
// Exported for use in page components
export async function getWebsiteId(): Promise<string | null> {
  const context = await getUserContext();
  return context?.websiteId || null;
}

// Dashboard stats - optimized with parallel queries
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

  // Run all 3 count queries in parallel instead of sequentially
  const [bookingsResult, leadsResult, pendingResult] = await Promise.all([
    // Bookings this month
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("website_id", websiteId)
      .gte("created_at", firstDayStr),
    // New leads this month
    supabase
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("website_id", websiteId)
      .gte("created_at", firstDayStr),
    // Pending bookings
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("website_id", websiteId)
      .eq("status", "pending"),
  ]);

  return {
    bookingsThisMonth: bookingsResult.count || 0,
    newLeads: leadsResult.count || 0,
    pendingBookings: pendingResult.count || 0,
  };
}

// Recent bookings - only select columns used in dashboard view
export async function getRecentBookings(limit = 5) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("bookings")
    .select("id, customer_name, booking_date, booking_time, guests, status")
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

// Order settings
export async function getOrderSettings() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return null;

  const { data } = await supabase
    .from("order_settings")
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

// Get client data with website info - optimized with join
export async function getClientData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { client: null, websiteId: null };

  // Single query: get client with website in one request
  const { data: client } = await supabase
    .from("clients")
    .select("*, websites(id)")
    .eq("auth_user_id", user.id)
    .single();

  if (!client) return { client: null, websiteId: null };

  // Extract website id from joined data
  const websites = client.websites;
  const websiteId = Array.isArray(websites) ? websites[0]?.id : websites?.id;

  // Remove websites from client object to maintain original shape
  const { websites: _, ...clientData } = client;

  return { client: clientData, websiteId: websiteId || null };
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
    reservation: "classic" | "wizard" | "modal" | "modern";
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
