import { createClient } from "./supabase-server";

// Types
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

export async function getServiceCatalog(websiteId: string): Promise<ServiceCategory[]> {
  if (!websiteId) return [];

  const supabase = await createClient();

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
    .select("id, category_id, website_id, name, price_cents, duration_minutes, notes, sort_order, is_active")
    .eq("website_id", websiteId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (itemError) {
    console.error("Error fetching service items:", itemError.message);
    return [];
  }

  const categoryMap = new Map<string, ServiceCategory>();
  (categories || []).forEach((category) => {
    categoryMap.set(category.id, { ...category, items: [] } as ServiceCategory);
  });

  (items || []).forEach((item) => {
    const category = categoryMap.get(item.category_id);
    if (category) {
      category.items.push(item as ServiceItem);
    }
  });

  return Array.from(categoryMap.values());
}

export async function getBusinessHours(websiteId: string): Promise<BusinessHour[]> {
  if (!websiteId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("business_hours")
    .select("id, website_id, day_of_week, is_open, open_time, close_time")
    .eq("website_id", websiteId)
    .order("day_of_week", { ascending: true });

  if (error) {
    console.error("Error fetching business hours:", error.message);
    return [];
  }

  return (data || []) as BusinessHour[];
}

export async function getBusinessHourSlots(websiteId: string): Promise<BusinessHourSlot[]> {
  if (!websiteId) return [];

  const supabase = await createClient();

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

  return (data || []) as BusinessHourSlot[];
}

export async function getProfessionals(websiteId: string): Promise<Professional[]> {
  if (!websiteId) return [];

  const supabase = await createClient();

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

  return (data || []) as Professional[];
}

export async function getProfessionalCategories(websiteId: string): Promise<ProfessionalCategory[]> {
  if (!websiteId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("professional_categories")
    .select("id, website_id, professional_id, category_id")
    .eq("website_id", websiteId);

  if (error) {
    console.error("Error fetching professional categories:", error.message);
    return [];
  }

  return (data || []) as ProfessionalCategory[];
}

export async function getSpecialDays(websiteId: string): Promise<SpecialDay[]> {
  if (!websiteId) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("special_days")
    .select("id, website_id, date, is_open, open_time, close_time, note")
    .eq("website_id", websiteId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching special days:", error.message);
    return [];
  }

  return (data || []) as SpecialDay[];
}

export async function getSpecialDaySlots(websiteId: string): Promise<SpecialDaySlot[]> {
  if (!websiteId) return [];

  const supabase = await createClient();

  const { data: specialDays, error: specialError } = await supabase
    .from("special_days")
    .select("id")
    .eq("website_id", websiteId);

  if (specialError || !specialDays?.length) {
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

  return (data || []) as SpecialDaySlot[];
}

// Get all booking data in one call
export async function getBookingData(websiteId: string) {
  const [
    serviceCatalog,
    businessHours,
    businessHourSlots,
    professionals,
    professionalCategories,
    specialDays,
    specialDaySlots,
  ] = await Promise.all([
    getServiceCatalog(websiteId),
    getBusinessHours(websiteId),
    getBusinessHourSlots(websiteId),
    getProfessionals(websiteId),
    getProfessionalCategories(websiteId),
    getSpecialDays(websiteId),
    getSpecialDaySlots(websiteId),
  ]);

  return {
    serviceCatalog,
    businessHours,
    businessHourSlots,
    professionals,
    professionalCategories,
    specialDays,
    specialDaySlots,
  };
}
