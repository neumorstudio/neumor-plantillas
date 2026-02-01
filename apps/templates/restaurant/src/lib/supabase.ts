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
  date: string;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
  note: string | null;
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

export type Theme = "light" | "dark" | "colorful" | "rustic" | "elegant" | "neuglass" | "neuglass-dark";

export interface Website {
  id: string;
  client_id: string;
  domain: string;
  theme: Theme;
  config: WebsiteConfig;
  is_active: boolean;
}

// Cliente Supabase (solo lectura para el template)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Verificar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase no configurado. Usando configuración por defecto.",
    "Configura PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en .env"
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Obtiene la configuración del website desde Supabase
 * Busca por website_id (preferido) o por dominio
 */
export async function getWebsiteConfig(websiteId?: string, domain?: string): Promise<Website | null> {
  if (!supabase) {
    return null;
  }

  try {
    let query = supabase
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
      console.error("Error fetching website config:", error.message);
      return null;
    }

    return data as Website;
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return null;
  }
}

export async function getMenuItems(websiteId?: string): Promise<MenuItemRow[] | null> {
  if (!supabase || !websiteId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, website_id, name, description, price_cents, category, tag, image_url, is_active, sort_order")
      .eq("website_id", websiteId)
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching menu items:", error.message);
      return null;
    }

    return data as MenuItemRow[];
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return null;
  }
}

export async function getBusinessHours(websiteId?: string): Promise<BusinessHourRow[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("business_hours")
      .select("day_of_week, is_open, open_time, close_time")
      .eq("website_id", websiteId)
      .order("day_of_week", { ascending: true });

    if (error) {
      console.error("Error fetching business hours:", error.message);
      return [];
    }

    return (data as BusinessHourRow[] | null) || [];
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return [];
  }
}

export async function getSpecialDays(websiteId?: string): Promise<SpecialDayRow[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("special_days")
      .select("date, is_open, open_time, close_time, note")
      .eq("website_id", websiteId);

    if (error) {
      console.error("Error fetching special days:", error.message);
      return [];
    }

    return (data as SpecialDayRow[] | null) || [];
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return [];
  }
}

export async function getBookingsInRange(
  websiteId?: string,
  startDate?: string,
  endDate?: string
): Promise<BookingRow[]> {
  if (!supabase || !websiteId || !startDate || !endDate) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("id, website_id, booking_date, booking_time, guests, status")
      .eq("website_id", websiteId)
      .gte("booking_date", startDate)
      .lte("booking_date", endDate);

    if (error) {
      console.error("Error fetching bookings in range:", error.message);
      return [];
    }

    return (data as BookingRow[] | null) || [];
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return [];
  }
}

export async function getRestaurantSettings(websiteId?: string): Promise<RestaurantRow | null> {
  if (!supabase || !websiteId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("website_id, capacity, is_open, takeaway_enabled")
      .eq("website_id", websiteId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching restaurant settings:", error.message);
      return null;
    }

    return (data as RestaurantRow | null) || null;
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return null;
  }
}
