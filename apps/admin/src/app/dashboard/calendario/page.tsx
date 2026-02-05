import { createClient } from "@/lib/supabase-server";
import {
  getBookingsForMonth,
  getBusinessHourSlots,
  getBusinessHours,
  getBusinessType,
  getCustomers,
  getProfessionals,
  getSessionsForMonth,
  getSpecialDays,
  getTrainerServices,
  getClientPackages,
  getWebsiteId,
} from "@/lib/data";
import CalendarioClient from "./calendario-client";
import { CalendarioFitnessClient } from "./calendario-fitness-client";

type ServiceCategory = {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  items: ServiceItem[];
};

type ServiceItem = {
  id: string;
  category_id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
};

async function getServiceCatalog(websiteId: string) {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name, sort_order, is_active")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const { data: items } = await supabase
    .from("service_items")
    .select("id, category_id, name, price_cents, duration_minutes, notes, sort_order, is_active")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

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
}

export default async function CalendarioPage() {
  const websiteId = await getWebsiteId();
  if (!websiteId) {
    return (
      <div className="neumor-card p-6">
        <p className="text-[var(--text-secondary)]">No hay acceso al website.</p>
      </div>
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const businessType = await getBusinessType();
  const isFitness = businessType === "fitness";

  if (isFitness) {
    // Fitness calendar - personal trainer
    const [hours, slots, sessions, specialDays, customers, services, packages] = await Promise.all([
      getBusinessHours(),
      getBusinessHourSlots(),
      getSessionsForMonth(year, month),
      getSpecialDays(),
      getCustomers(),
      getTrainerServices(),
      getClientPackages(),
    ]);

    return (
      <CalendarioFitnessClient
        initialHours={hours}
        initialSlots={slots}
        initialSessions={sessions}
        initialSpecialDays={specialDays}
        customers={customers}
        services={services}
        packages={packages}
        year={year}
        month={month}
      />
    );
  }

  // Default calendar - salon, clinic, etc.
  const supabase = await createClient();
  const [hours, slots, bookings, specialDays, professionals, serviceCatalog, professionalCategories] =
    await Promise.all([
    getBusinessHours(),
    getBusinessHourSlots(),
    getBookingsForMonth(year, month),
    getSpecialDays(),
    getProfessionals(),
    getServiceCatalog(websiteId),
    supabase
      .from("professional_categories")
      .select("professional_id, category_id")
      .eq("website_id", websiteId)
      .then((res) => res.data || []),
  ]);

  return (
    <CalendarioClient
      initialHours={hours}
      initialSlots={slots}
      initialBookings={bookings}
      initialSpecialDays={specialDays}
      initialProfessionals={professionals}
      serviceCatalog={serviceCatalog}
      professionalCategories={professionalCategories}
      year={year}
      month={month}
      businessType={businessType}
    />
  );
}
