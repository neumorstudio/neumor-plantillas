import { createClient } from "@/lib/supabase-server";
import { getProfessionals, getWebsiteId } from "@/lib/data";
import ProfesionalesClient from "./profesionales-client";

export default async function ProfesionalesPage() {
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return (
      <div className="neumor-card p-6">
        <p className="text-[var(--text-secondary)]">No hay acceso al website.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const [professionals, categories, professionalCategories] = await Promise.all([
    getProfessionals(),
    supabase
      .from("service_categories")
      .select("id, name, sort_order, is_active")
      .eq("website_id", websiteId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .then((res) => res.data || []),
    supabase
      .from("professional_categories")
      .select("professional_id, category_id")
      .eq("website_id", websiteId)
      .then((res) => res.data || []),
  ]);

  return (
    <ProfesionalesClient
      initialProfessionals={professionals}
      categories={categories}
      professionalCategories={professionalCategories}
    />
  );
}
