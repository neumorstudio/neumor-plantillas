// Paquetes - Bonos y paquetes de sesiones vendidos a clientes
import { getClientPackages, getCustomers } from "@/lib/data";
import { PaquetesClient } from "./paquetes-client";

export default async function PaquetesPage() {
  const [packages, customers] = await Promise.all([
    getClientPackages(),
    getCustomers(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Paquetes</h1>
          <p className="text-[var(--text-secondary)]">
            Gestiona los bonos y paquetes de sesiones de tus clientes
          </p>
        </div>
      </div>

      <PaquetesClient initialPackages={packages} customers={customers} />
    </div>
  );
}
