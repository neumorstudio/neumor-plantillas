// Progreso - Seguimiento de medidas y PRs de clientes
import { getCustomers } from "@/lib/data";
import { ProgresoClient } from "./progreso-client";

export default async function ProgresoPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Progreso</h1>
          <p className="text-[var(--text-secondary)]">
            Registra medidas corporales y records personales de tus clientes
          </p>
        </div>
      </div>

      <ProgresoClient customers={customers} />
    </div>
  );
}
