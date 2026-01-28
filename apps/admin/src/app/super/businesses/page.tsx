import { getBusinesses } from "@/lib/actions/businesses";
import { BusinessesClient } from "./businesses-client";

export default async function BusinessesPage() {
  const businesses = await getBusinesses();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Negocios</h1>
          <p className="text-[var(--text-secondary)]">
            Gestiona todos los negocios de la plataforma
          </p>
        </div>
      </div>

      <BusinessesClient initialBusinesses={businesses} />
    </div>
  );
}
