// Pagos - Página con lista y gestión de pagos
import { getPayments } from "@/lib/data";
import { PagosClient } from "./pagos-client";

export default async function PagosPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Pagos</h1>
          <p className="text-[var(--text-secondary)]">
            Gestiona tus cobros y pagos
          </p>
        </div>
      </div>

      <PagosClient initialPayments={payments} />
    </div>
  );
}
