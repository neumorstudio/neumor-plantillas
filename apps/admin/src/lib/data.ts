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

// ============================================
// DASHBOARD WIDGETS DATA
// ============================================

// Widget: Reservas de hoy
export async function getBookingsToday() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { count: 0 };

  const today = new Date().toISOString().split("T")[0];

  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .eq("booking_date", today);

  return { count: count || 0 };
}

// Widget: Presupuestos pendientes (para repairs/realestate)
export async function getQuotesPending() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { count: 0, totalAmount: 0 };

  const { data, count } = await supabase
    .from("leads")
    .select("details", { count: "exact" })
    .eq("website_id", websiteId)
    .eq("lead_type", "quote")
    .eq("status", "new");

  // Sumar importes de los presupuestos (si tienen amount en details)
  let totalAmount = 0;
  if (data) {
    for (const lead of data) {
      const details = lead.details as { amount?: number } | null;
      if (details?.amount) {
        totalAmount += details.amount;
      }
    }
  }

  return { count: count || 0, totalAmount };
}

// Widget: Presupuestos aceptados este mes
export async function getQuotesAccepted() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { count: 0, totalAmount: 0 };

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];

  const { data, count } = await supabase
    .from("leads")
    .select("details", { count: "exact" })
    .eq("website_id", websiteId)
    .eq("lead_type", "quote")
    .eq("status", "converted")
    .gte("updated_at", firstDayStr);

  let totalAmount = 0;
  if (data) {
    for (const lead of data) {
      const details = lead.details as { amount?: number } | null;
      if (details?.amount) {
        totalAmount += details.amount;
      }
    }
  }

  return { count: count || 0, totalAmount };
}

// Widget: Trabajos activos (para repairs)
export async function getJobsActive() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { count: 0 };

  const { count } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .in("status", ["pending", "in_progress", "waiting_material"]);

  return { count: count || 0 };
}

// Widget: Pagos pendientes (para repairs)
export async function getPaymentsPending() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { count: 0, totalAmount: 0 };

  const { data, count } = await supabase
    .from("payments")
    .select("amount", { count: "exact" })
    .eq("website_id", websiteId)
    .eq("status", "pending");

  let totalAmount = 0;
  if (data) {
    for (const payment of data) {
      totalAmount += payment.amount || 0;
    }
  }

  // Convertir de céntimos a euros
  return { count: count || 0, totalAmount: totalAmount / 100 };
}

// Widget: Ingresos del mes
export async function getRevenueMonth() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { totalAmount: 0 };

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayStr = firstDayOfMonth.toISOString().split("T")[0];

  const { data } = await supabase
    .from("payments")
    .select("amount")
    .eq("website_id", websiteId)
    .eq("status", "paid")
    .gte("paid_at", firstDayStr);

  let totalAmount = 0;
  if (data) {
    for (const payment of data) {
      totalAmount += payment.amount || 0;
    }
  }

  // Convertir de céntimos a euros
  return { totalAmount: totalAmount / 100 };
}

// Widget: Trabajos recientes (tabla para repairs)
export async function getRecentJobs(limit = 5) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("jobs")
    .select("id, client_name, address, status, estimated_end_date, total_amount")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

// Widget: Presupuestos recientes (tabla para repairs)
export async function getRecentQuotes(limit = 5) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("leads")
    .select("id, name, message, status, details, created_at")
    .eq("website_id", websiteId)
    .eq("lead_type", "quote")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

// ============================================
// CUSTOMERS (CRM)
// ============================================

export async function getCustomers() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getCustomer(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return null;

  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .eq("website_id", websiteId)
    .single();

  return data;
}

// ============================================
// JOBS (Trabajos)
// ============================================

export async function getJobs() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getJob(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return null;

  const { data } = await supabase
    .from("jobs")
    .select("*, job_tasks(*), job_photos(*)")
    .eq("id", id)
    .eq("website_id", websiteId)
    .single();

  return data;
}

// ============================================
// PAYMENTS (Pagos)
// ============================================

export async function getPayments() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getPayment(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return null;

  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("id", id)
    .eq("website_id", websiteId)
    .single();

  return data;
}
