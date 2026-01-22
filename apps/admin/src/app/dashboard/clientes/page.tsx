// Clientes - Página con lista y gestión de clientes (CRM)
import { getCustomers } from "@/lib/data";
import { ClientesClient } from "./clientes-client";

export default async function ClientesPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Clientes</h1>
          <p className="text-[var(--text-secondary)]">
            Gestiona tu base de clientes
          </p>
        </div>
      </div>

      <ClientesClient initialCustomers={customers} />
    </div>
  );
}
