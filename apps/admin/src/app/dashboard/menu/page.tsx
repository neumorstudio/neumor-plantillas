import { createClient } from "@/lib/supabase-server";
import { getBusinessType, getWebsiteId } from "@/lib/data";
import MenuClient, { type AdminMenuItem } from "./menu-client";

export default async function MenuPage() {
  const [businessType, websiteId, supabase] = await Promise.all([
    getBusinessType(),
    getWebsiteId(),
    createClient(),
  ]);

  if (businessType !== "restaurant") {
    return (
      <div className="neumor-card p-6">
        <h1 className="text-2xl font-heading font-bold mb-2">Menú</h1>
        <p className="text-[var(--text-secondary)]">
          Esta seccion solo esta disponible para restaurantes.
        </p>
      </div>
    );
  }

  if (!websiteId) {
    return (
      <div className="neumor-card p-6">
        <h1 className="text-2xl font-heading font-bold mb-2">Menú</h1>
        <p className="text-[var(--text-secondary)]">
          No se encontro el website asociado a tu cuenta.
        </p>
      </div>
    );
  }

  const { data } = await supabase
    .from("menu_items")
    .select(
      "id, website_id, category, name, description, price_cents, image_url, tag, is_active, sort_order, updated_at"
    )
    .eq("website_id", websiteId)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  const initialItems = (data || []) as AdminMenuItem[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Menú</h1>
        <p className="text-[var(--text-secondary)]">
          Activa, ordena y actualiza tu menu sin depender de PDFs.
        </p>
      </div>

      <MenuClient initialItems={initialItems} />
    </div>
  );
}
