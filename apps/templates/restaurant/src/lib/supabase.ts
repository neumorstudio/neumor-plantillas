import { createClient } from "@supabase/supabase-js";

// Tipos para la configuración del website
export interface WebsiteVariants {
  hero: "classic" | "modern" | "bold" | "minimal";
  menu: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
  openStatus: "pulse" | "morph" | "liquid" | "time";
  reservation: "classic" | "wizard" | "modal" | "modern";
}

// Horario de un día específico
export interface DaySchedule {
  open: string;   // "09:00"
  close: string;  // "22:00"
  closed?: boolean; // true si está cerrado todo el día
}

// Horario semanal completo
export type WeekSchedule = Record<string, DaySchedule>;

// Configuración del componente OpenStatus
export interface OpenStatusConfig {
  enabled: boolean;
  variant: WebsiteVariants["openStatus"];
  position: "floating" | "inline" | "header";
  schedule: WeekSchedule;
  forceStatus?: "open" | "closed" | null; // Override manual
  showScheduleInfo?: boolean; // Mostrar info de horario
  language?: "es" | "en";
}

// Section configuration for dynamic layout
export interface SectionConfig {
  id: string;
  enabled: boolean;
  variant?: string;
  order: number;
}

export interface SectionsConfig {
  sections: SectionConfig[];
}

export interface WebsiteConfig {
  businessName?: string;
  businessType?: string;
  variants?: WebsiteVariants;
  // Otros campos de configuración del restaurante
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  heroImages?: string[];
  heroCta?: string;
  ordersTitle?: string;
  ordersSubtitle?: string;
  ordersWebhookUrl?: string;
  reviewsTitle?: string;
  reviewsSubtitle?: string;
  teamTitle?: string;
  teamSubtitle?: string;
  galleryTitle?: string;
  gallerySubtitle?: string;
  galleryImages?: string[];
  brandsTitle?: string;
  brandsSubtitle?: string;
  brandsLogos?: string[];
  faqTitle?: string;
  faqSubtitle?: string;
  plansTitle?: string;
  plansSubtitle?: string;
  contactTitle?: string;
  contactSubtitle?: string;
  address?: string;
  phone?: string;
  email?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    tripadvisor?: string;
  };
  googleRating?: number;
  totalReviews?: number;
  // Configuración del indicador de estado abierto/cerrado
  openStatus?: OpenStatusConfig;
  // Personalization fields
  colors?: Record<string, string>;
  primaryColor?: string;
  secondaryColor?: string;
  typography?: Record<string, unknown>;
  effects?: Record<string, unknown>;
  branding?: {
    logo?: string;
    logoDark?: string;
    favicon?: string;
    logoSize?: "sm" | "md" | "lg";
    logoDisplay?: "logo" | "name";
    pwaLogoCompatible?: boolean;
  };
  logo?: string;
  sectionsConfig?: SectionsConfig;
}

export interface MenuItemRow {
  id: string;
  website_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string;
  tag?: string | null;
  image_url?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface BusinessHourRow {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface SpecialDayRow {
  id?: string;
  date: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  note: string | null;
}

export interface BusinessHourSlotRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  sort_order?: number;
  is_active?: boolean;
}

export interface SpecialDaySlotRow {
  special_day_id: string;
  open_time: string;
  close_time: string;
  sort_order?: number;
}

export interface BookingRow {
  id: string;
  website_id: string;
  booking_date: string;
  booking_time: string | null;
  guests: number | null;
  status: string;
}

export interface RestaurantRow {
  website_id: string;
  capacity: number | null;
  is_open: boolean | null;
  takeaway_enabled: boolean | null;
}

export interface OrderSettingsRow {
  website_id: string;
  pickup_start_time: string;
  pickup_end_time: string;
}

export type Theme = "light" | "dark" | "colorful" | "rustic" | "elegant" | "neuglass" | "neuglass-dark";

export interface Website {
  id: string;
  client_id: string;
  domain: string;
  theme: Theme;
  config: WebsiteConfig;
  is_active: boolean;
  clients?: {
    business_name?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
}

// Cliente Supabase (solo lectura para el template)
const supabaseUrl =
  import.meta.env.PUBLIC_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.SUPABASE_URL;
const supabaseAnonKey =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAnon = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

const supabaseServer = supabaseUrl && supabaseServiceKey && import.meta.env.SSR
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    })
  : null;

const getSupabaseClient = () => supabaseServer ?? supabaseAnon;

export const supabase = supabaseAnon;

/**
 * Obtiene la configuración del website desde Supabase
 * Busca por website_id (preferido) o por dominio
 */
export async function getWebsiteConfig(websiteId?: string, domain?: string): Promise<Website | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    let query = client
      .from("websites")
      .select("id, client_id, domain, theme, config, is_active");

    // Buscar por ID si está disponible
    if (websiteId) {
      query = query.eq("id", websiteId);
    } else if (domain) {
      // Buscar por dominio (sin protocolo)
      const cleanDomain = domain.replace(/^https?:\/\//, "").split("/")[0];
      query = query.eq("domain", cleanDomain);
    } else {
      return null;
    }

    const { data, error } = await query.single();

    if (error) {
      return null;
    }

    return data as Website;
  } catch {
    return null;
  }
}

export async function getMenuItems(websiteId?: string): Promise<MenuItemRow[] | null> {
  const client = getSupabaseClient();
  if (!client || !websiteId) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("menu_items")
      .select("id, website_id, name, description, price_cents, category, tag, image_url, is_active, sort_order")
      .eq("website_id", websiteId)
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      return null;
    }

    return data as MenuItemRow[];
  } catch {
    return null;
  }
}

export async function getBusinessHours(websiteId?: string): Promise<BusinessHourRow[]> {
  const client = getSupabaseClient();
  if (!client || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await client
      .from("business_hours")
      .select("day_of_week, is_open, open_time, close_time")
      .eq("website_id", websiteId)
      .order("day_of_week", { ascending: true });

    if (error) {
      return [];
    }

    return (data as BusinessHourRow[] | null) || [];
  } catch {
    return [];
  }
}

export async function getSpecialDays(websiteId?: string): Promise<SpecialDayRow[]> {
  const client = getSupabaseClient();
  if (!client || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await client
      .from("special_days")
      .select("id, date, is_open, open_time, close_time, note")
      .eq("website_id", websiteId)
      .order("date", { ascending: true });

    if (error) {
      return [];
    }

    return (data as SpecialDayRow[] | null) || [];
  } catch {
    return [];
  }
}

export async function getBusinessHourSlots(websiteId?: string): Promise<BusinessHourSlotRow[]> {
  const client = getSupabaseClient();
  if (!client || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await client
      .from("business_hour_slots")
      .select("id, website_id, day_of_week, open_time, close_time, sort_order, is_active")
      .eq("website_id", websiteId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      return [];
    }

    return (data as BusinessHourSlotRow[] | null) || [];
  } catch {
    return [];
  }
}

export async function getSpecialDaySlots(websiteId?: string): Promise<SpecialDaySlotRow[]> {
  const client = getSupabaseClient();
  if (!client || !websiteId) {
    return [];
  }

  try {
    const { data: specialDays, error: specialError } = await client
      .from("special_days")
      .select("id")
      .eq("website_id", websiteId);

    if (specialError) {
      return [];
    }

    if (!specialDays?.length) {
      return [];
    }

    const ids = specialDays.map((day) => day.id);
    const { data, error } = await client
      .from("special_day_slots")
      .select("id, special_day_id, open_time, close_time, sort_order")
      .in("special_day_id", ids)
      .order("sort_order", { ascending: true });

    if (error) {
      return [];
    }

    return (data as SpecialDaySlotRow[] | null) || [];
  } catch {
    return [];
  }
}

export async function getBookingsInRange(
  websiteId?: string,
  startDate?: string,
  endDate?: string
): Promise<BookingRow[]> {
  const client = getSupabaseClient();
  if (!client || !websiteId || !startDate || !endDate) {
    return [];
  }

  try {
    const { data, error } = await client
      .from("bookings")
      .select("id, website_id, booking_date, booking_time, guests, status")
      .eq("website_id", websiteId)
      .gte("booking_date", startDate)
      .lte("booking_date", endDate);

    if (error) {
      return [];
    }

    return (data as BookingRow[] | null) || [];
  } catch {
    return [];
  }
}

export async function getRestaurantSettings(websiteId?: string): Promise<RestaurantRow | null> {
  const client = getSupabaseClient();
  if (!client || !websiteId) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("restaurants")
      .select("website_id, capacity, is_open, takeaway_enabled")
      .eq("website_id", websiteId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return (data as RestaurantRow | null) || null;
  } catch {
    return null;
  }
}

export async function getOrderSettings(websiteId?: string): Promise<OrderSettingsRow | null> {
  const client = getSupabaseClient();
  if (!client || !websiteId) {
    return null;
  }

  try {
    const { data, error } = await client
      .from("order_settings")
      .select("website_id, pickup_start_time, pickup_end_time")
      .eq("website_id", websiteId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return (data as OrderSettingsRow | null) || null;
  } catch {
    return null;
  }
}
