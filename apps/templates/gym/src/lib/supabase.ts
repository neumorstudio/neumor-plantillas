import { createClient } from "@supabase/supabase-js";

// Tipos para la configuracion del website
export interface WebsiteVariants {
  hero: "classic" | "modern" | "bold" | "minimal" | "fullscreen" | "split";
  classes: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
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
  // Otros campos de configuracion del salon
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
    whatsapp?: string;
  };
  googleRating?: number;
  totalReviews?: number;
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

export interface BusinessHour {
  id?: string;
  website_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

// Cliente Supabase (solo lectura para el template)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Obtiene la configuracion del website desde Supabase
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

    // Buscar por ID si esta disponible
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

export async function getBusinessHours(websiteId?: string): Promise<BusinessHour[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("business_hours")
      .select("id, website_id, day_of_week, is_open, open_time, close_time")
      .eq("website_id", websiteId)
      .order("day_of_week", { ascending: true });

    if (error) {
      return [];
    }

    return (data as BusinessHour[] | null) || [];
  } catch {
    return [];
  }
}
