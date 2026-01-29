import { createClient } from "@/lib/supabase-server";
import { getWebsiteId } from "@/lib/data";
import { ServiciosClient } from "./servicios-client";

type ServiceCategory = {
  id: string;
  website_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

type ServiceItem = {
  id: string;
  category_id: string;
  website_id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
};

async function getInitialServices(websiteId: string) {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, website_id, name, icon, sort_order, is_active")
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const { data: items } = await supabase
    .from("service_items")
    .select(
      "id, category_id, website_id, name, price_cents, duration_minutes, notes, sort_order, is_active"
    )
    .eq("website_id", websiteId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const categoryMap = new Map<string, ServiceCategory & { items: ServiceItem[] }>();
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

export default async function ServiciosPage() {
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return (
      <div className="neumor-card p-6">
        <p className="text-[var(--text-secondary)]">No hay acceso al website.</p>
      </div>
    );
  }

  const initialCategories = await getInitialServices(websiteId);

  return <ServiciosClient initialCategories={initialCategories} />;
}
