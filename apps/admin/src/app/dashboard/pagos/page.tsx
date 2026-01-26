// Pagos - Página con lista y gestión de pagos
import { getPayments } from "@/lib/data";
import { PagosClient } from "./pagos-client";

export default async function PagosPage() {
  const payments = await getPayments();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="page-header">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-1">Pagos</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestiona tus cobros y pagos
        </p>
      </div>

      <PagosClient initialPayments={payments} />
    </div>
  );
}
