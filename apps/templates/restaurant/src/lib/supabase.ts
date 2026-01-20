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

export interface WebsiteConfig {
  businessName?: string;
  businessType?: string;
  variants?: WebsiteVariants;
  // Otros campos de configuración del restaurante
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
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

export interface OrderSettings {
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

export async function getOrderSettings(websiteId?: string): Promise<OrderSettings | null> {
  if (!supabase || !websiteId) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("order_settings")
      .select("pickup_start_time, pickup_end_time")
      .eq("website_id", websiteId)
      .single();

    if (error) {
      return null;
    }

    return data as OrderSettings;
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return null;
  }
}
