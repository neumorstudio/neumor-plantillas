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

  if (!data) return null;

  // Handle both array and single object response from Supabase
  const website = Array.isArray(data.websites) ? data.websites[0] : data.websites;
  if (!website?.id) {
    const { data: fallbackWebsite } = await supabase
      .from("websites")
      .select("id")
      .eq("client_id", data.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!fallbackWebsite?.id) return null;
    return {
      userId: user.id,
      clientId: data.id,
      websiteId: fallbackWebsite.id,
    };
  }

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

// Get the current user's business type
export async function getBusinessType(): Promise<string> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "restaurant";

  // Check user_metadata first (faster)
  if (user.user_metadata?.business_type) {
    return user.user_metadata.business_type as string;
  }

  // Fallback to clients table
  const { data: client } = await supabase
    .from("clients")
    .select("business_type")
    .eq("auth_user_id", user.id)
    .single();

  return client?.business_type || "restaurant";
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
    .select(
      "id, customer_name, booking_date, booking_time, guests, status, professional_id, professional:professionals(name)"
    )
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Map professional from array to object (Supabase returns array for relations)
  return (data || []).map((item) => ({
    ...item,
    professional: Array.isArray(item.professional)
      ? item.professional[0] || null
      : item.professional,
  }));
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

export async function getBusinessHours() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("business_hours")
    .select("day_of_week, is_open, open_time, close_time")
    .eq("website_id", websiteId)
    .order("day_of_week", { ascending: true });

  if (data && data.length) return data;

  return Array.from({ length: 7 }).map((_, index) => ({
    day_of_week: index,
    is_open: true,
    open_time: "09:00",
    close_time: "19:00",
  }));
}

export async function getBookingsForMonth(year: number, month: number) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    new Date(year, month + 1, 0).getDate()
  ).padStart(2, "0")}`;

  const { data } = await supabase
    .from("bookings")
    .select("id, customer_name, customer_email, customer_phone, booking_date, booking_time, professional_id, services, status, notes, total_price_cents, total_duration_minutes, created_at")
    .eq("website_id", websiteId)
    .gte("booking_date", start)
    .lte("booking_date", end)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  return data || [];
}

export async function getBusinessHourSlots() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("business_hour_slots")
    .select("id, day_of_week, open_time, close_time, sort_order, is_active")
    .eq("website_id", websiteId)
    .order("day_of_week", { ascending: true })
    .order("sort_order", { ascending: true });

  return data || [];
}

export async function getProfessionals() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("professionals")
    .select("id, name, is_active, sort_order")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return data || [];
}

export async function getSpecialDays() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("special_days")
    .select("id, date, is_open, open_time, close_time, note")
    .eq("website_id", websiteId)
    .order("date", { ascending: true });

  if (!data?.length) return [];

  const specialDayIds = data.map((item) => item.id);
  const { data: slots } = await supabase
    .from("special_day_slots")
    .select("id, special_day_id, open_time, close_time, sort_order")
    .in("special_day_id", specialDayIds)
    .order("sort_order", { ascending: true });

  const slotsByDay = (slots || []).reduce<Record<string, typeof slots>>((acc, slot) => {
    const key = slot.special_day_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return data.map((item) => ({
    ...item,
    slots: slotsByDay[item.id] || [],
  }));
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

// ============================================
// TRAINER SERVICES (Servicios del entrenador)
// ============================================

export async function getTrainerServices() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("trainer_services")
    .select("*")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true });

  return data || [];
}

export async function getTrainerService(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return null;

  const { data } = await supabase
    .from("trainer_services")
    .select("*")
    .eq("id", id)
    .eq("website_id", websiteId)
    .single();

  return data;
}

// ============================================
// CLIENT PACKAGES (Paquetes/Bonos)
// ============================================

export async function getClientPackages(customerId?: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  let query = supabase
    .from("client_packages")
    .select("*, customers(id, name, email)")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  if (customerId) {
    query = query.eq("customer_id", customerId);
  }

  const { data } = await query;

  return data || [];
}

export async function getClientPackage(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return null;

  const { data } = await supabase
    .from("client_packages")
    .select("*, customers(id, name, email, phone)")
    .eq("id", id)
    .eq("website_id", websiteId)
    .single();

  return data;
}

// Paquetes próximos a expirar (en los próximos 7 días)
export async function getExpiringPackages(days = 7) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + days);

  const todayStr = today.toISOString().split("T")[0];
  const futureStr = futureDate.toISOString().split("T")[0];

  const { data } = await supabase
    .from("client_packages")
    .select("*, customers(id, name, email)")
    .eq("website_id", websiteId)
    .eq("status", "active")
    .gte("valid_until", todayStr)
    .lte("valid_until", futureStr)
    .order("valid_until", { ascending: true });

  return data || [];
}

// ============================================
// CLIENT PROGRESS (Progreso/Medidas)
// ============================================

export async function getClientProgress(customerId: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("client_progress")
    .select("*")
    .eq("website_id", websiteId)
    .eq("customer_id", customerId)
    .order("recorded_at", { ascending: false });

  return data || [];
}

export async function getClientProgressEntry(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return null;

  const { data } = await supabase
    .from("client_progress")
    .select("*, customers(id, name)")
    .eq("id", id)
    .eq("website_id", websiteId)
    .single();

  return data;
}

// ============================================
// CLIENT RECORDS (PRs/Logros)
// ============================================

export async function getClientRecords(customerId: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("client_records")
    .select("*")
    .eq("website_id", websiteId)
    .eq("customer_id", customerId)
    .order("achieved_at", { ascending: false });

  return data || [];
}

// ============================================
// FITNESS DASHBOARD WIDGETS
// ============================================

// Widget: Sesiones de hoy
export async function getSessionsToday() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { count: 0, sessions: [] };

  const today = new Date().toISOString().split("T")[0];

  const { data, count } = await supabase
    .from("bookings")
    .select("*, customers(id, name), trainer_services(id, name)", { count: "exact" })
    .eq("website_id", websiteId)
    .eq("booking_date", today)
    .order("booking_time", { ascending: true });

  return { count: count || 0, sessions: data || [] };
}

// Widget: Sesiones de la semana
export async function getSessionsWeek() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { count: 0 };

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lunes
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Domingo

  const startStr = startOfWeek.toISOString().split("T")[0];
  const endStr = endOfWeek.toISOString().split("T")[0];

  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .gte("booking_date", startStr)
    .lte("booking_date", endStr);

  return { count: count || 0 };
}

// Widget: Clientes activos (con paquete activo o sesión en los últimos 30 días)
export async function getActiveClients() {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return { count: 0 };

  // Clientes con paquete activo
  const { data: packagesData } = await supabase
    .from("client_packages")
    .select("customer_id")
    .eq("website_id", websiteId)
    .eq("status", "active");

  // Clientes con sesión en los últimos 30 días
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysStr = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: bookingsData } = await supabase
    .from("bookings")
    .select("customer_id")
    .eq("website_id", websiteId)
    .gte("booking_date", thirtyDaysStr);

  // Unir IDs únicos
  const customerIds = new Set<string>();
  packagesData?.forEach((p) => p.customer_id && customerIds.add(p.customer_id));
  bookingsData?.forEach((b) => b.customer_id && customerIds.add(b.customer_id));

  return { count: customerIds.size };
}

// Widget: Sesiones recientes (tabla para fitness)
export async function getRecentSessions(limit = 5) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, session_notes, customers(id, name), trainer_services(id, name)")
    .eq("website_id", websiteId)
    .order("booking_date", { ascending: false })
    .order("booking_time", { ascending: false })
    .limit(limit);

  return data || [];
}

// Session type for fitness calendar
interface FitnessSession {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  booking_date: string;
  booking_time: string | null;
  service_id: string | null;
  package_id: string | null;
  duration_minutes: number | null;
  status: string;
  session_notes: string | null;
  workout_summary: string | null;
  is_paid: boolean;
  created_at: string;
  customers?: { id: string; name: string; email: string | null; phone: string | null };
  trainer_services?: { id: string; name: string; duration_minutes: number; price_cents: number };
  client_packages?: { id: string; name: string; remaining_sessions: number | null };
}

// Get sessions for a month (for fitness calendar)
export async function getSessionsForMonth(year: number, month: number): Promise<FitnessSession[]> {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(
    new Date(year, month + 1, 0).getDate()
  ).padStart(2, "0")}`;

  const { data } = await supabase
    .from("bookings")
    .select(`
      id,
      customer_id,
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      service_id,
      package_id,
      duration_minutes,
      status,
      session_notes,
      workout_summary,
      is_paid,
      created_at,
      customers(id, name, email, phone),
      trainer_services(id, name, duration_minutes, price_cents),
      client_packages(id, name, remaining_sessions)
    `)
    .eq("website_id", websiteId)
    .gte("booking_date", start)
    .lte("booking_date", end)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (!data) return [];

  // Normalize Supabase response - extract single objects from arrays
  return data.map((item) => ({
    ...item,
    customers: Array.isArray(item.customers) ? item.customers[0] : item.customers,
    trainer_services: Array.isArray(item.trainer_services) ? item.trainer_services[0] : item.trainer_services,
    client_packages: Array.isArray(item.client_packages) ? item.client_packages[0] : item.client_packages,
  })) as FitnessSession[];
}

// Widget: Clientes con progreso reciente
export async function getClientsWithRecentProgress(limit = 5) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) return [];

  const { data } = await supabase
    .from("client_progress")
    .select("id, recorded_at, weight_kg, customers(id, name)")
    .eq("website_id", websiteId)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  return data || [];
}
