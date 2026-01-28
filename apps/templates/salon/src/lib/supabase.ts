import { createClient } from "@supabase/supabase-js";

// Tipos para la configuracion del website
export interface WebsiteVariants {
  hero: "classic" | "modern" | "bold" | "minimal";
  services: "tabs" | "grid" | "list" | "carousel";
  features: "cards" | "icons" | "banner";
  reviews: "grid" | "carousel" | "minimal";
  footer: "full" | "minimal" | "centered";
}

export interface WebsiteConfig {
  businessName?: string;
  businessType?: string;
  variants?: WebsiteVariants;
  // Otros campos de configuracion del salon
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
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

export interface ServiceCategory {
  id: string;
  website_id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  items: ServiceItem[];
}

export interface ServiceItem {
  id: string;
  category_id: string;
  website_id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface BusinessHour {
  id?: string;
  website_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export interface BusinessHourSlot {
  id?: string;
  website_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  sort_order: number;
  is_active: boolean;
}

export interface Professional {
  id: string;
  website_id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export interface ProfessionalCategory {
  id?: string;
  website_id: string;
  professional_id: string;
  category_id: string;
}

export interface SpecialDay {
  id?: string;
  website_id: string;
  date: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  note: string | null;
}

export interface SpecialDaySlot {
  id?: string;
  special_day_id: string;
  open_time: string;
  close_time: string;
  sort_order: number;
}

// Cliente Supabase (solo lectura para el template)
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

// Verificar que las variables de entorno esten configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase no configurado. Usando configuracion por defecto.",
    "Configura PUBLIC_SUPABASE_URL y PUBLIC_SUPABASE_ANON_KEY en .env"
  );
}

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
      .select("id, client_id, domain, theme, config, is_active, clients ( business_name, address, phone, email )");

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
      console.error("Error fetching website config:", error.message);
      return null;
    }

    return data as Website;
  } catch (err) {
    console.error("Error connecting to Supabase:", err);
    return null;
  }
}

export async function getServiceCatalog(websiteId?: string): Promise<ServiceCategory[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data: categories, error: categoryError } = await supabase
      .from("service_categories")
      .select("id, website_id, name, sort_order, is_active")
      .eq("website_id", websiteId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (categoryError) {
      console.error("Error fetching service categories:", categoryError.message);
      return [];
    }

    const { data: items, error: itemError } = await supabase
      .from("service_items")
      .select(
        "id, category_id, website_id, name, price_cents, duration_minutes, notes, sort_order, is_active"
      )
      .eq("website_id", websiteId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (itemError) {
      console.error("Error fetching service items:", itemError.message);
      return [];
    }

    const categoryMap = new Map<string, ServiceCategory>();
    (categories as ServiceCategory[] | null || []).forEach((category) => {
      categoryMap.set(category.id, { ...category, items: [] });
    });

    (items as ServiceItem[] | null || []).forEach((item) => {
      const category = categoryMap.get(item.category_id);
      if (category) {
        category.items.push(item);
      }
    });

    return Array.from(categoryMap.values());
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    return [];
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
      console.error("Error fetching business hours:", error.message);
      return [];
    }

    return (data as BusinessHour[] | null) || [];
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    return [];
  }
}

export async function getBusinessHourSlots(websiteId?: string): Promise<BusinessHourSlot[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("business_hour_slots")
      .select("id, website_id, day_of_week, open_time, close_time, sort_order, is_active")
      .eq("website_id", websiteId)
      .eq("is_active", true)
      .order("day_of_week", { ascending: true })
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching business hour slots:", error.message);
      return [];
    }

    return (data as BusinessHourSlot[] | null) || [];
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    return [];
  }
}

export async function getProfessionals(websiteId?: string): Promise<Professional[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("professionals")
      .select("id, website_id, name, is_active, sort_order")
      .eq("website_id", websiteId)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching professionals:", error.message);
      return [];
    }

    return (data as Professional[] | null) || [];
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    return [];
  }
}

export async function getProfessionalCategories(
  websiteId?: string
): Promise<ProfessionalCategory[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("professional_categories")
      .select("id, website_id, professional_id, category_id")
      .eq("website_id", websiteId);

    if (error) {
      console.error("Error fetching professional categories:", error.message);
      return [];
    }

    return (data as ProfessionalCategory[] | null) || [];
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    return [];
  }
}

export async function getSpecialDays(websiteId?: string): Promise<SpecialDay[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("special_days")
      .select("id, website_id, date, is_open, open_time, close_time, note")
      .eq("website_id", websiteId)
      .order("date", { ascending: true });

    if (error) {
      console.error("Error fetching special days:", error.message);
      return [];
    }

    return (data as SpecialDay[] | null) || [];
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    return [];
  }
}

export async function getSpecialDaySlots(websiteId?: string): Promise<SpecialDaySlot[]> {
  if (!supabase || !websiteId) {
    return [];
  }

  try {
    const { data: specialDays, error: specialError } = await supabase
      .from("special_days")
      .select("id")
      .eq("website_id", websiteId);

    if (specialError) {
      console.error("Error fetching special days:", specialError.message);
      return [];
    }

    if (!specialDays?.length) {
      return [];
    }

    const ids = specialDays.map((day) => day.id);
    const { data, error } = await supabase
      .from("special_day_slots")
      .select("id, special_day_id, open_time, close_time, sort_order")
      .in("special_day_id", ids)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching special day slots:", error.message);
      return [];
    }

    return (data as SpecialDaySlot[] | null) || [];
  } catch (error) {
    console.error("Error connecting to Supabase:", error);
    return [];
  }
}
