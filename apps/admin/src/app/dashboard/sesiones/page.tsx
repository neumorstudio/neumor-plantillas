// Sesiones - Agenda de entrenamientos del entrenador personal
import { getSessionsToday, getCustomers, getTrainerServices, getClientPackages } from "@/lib/data";
import { SesionesClient } from "./sesiones-client";

export default async function SesionesPage() {
  const [sessionsData, customers, services, packages] = await Promise.all([
    getSessionsToday(),
    getCustomers(),
    getTrainerServices(),
    getClientPackages(),
  ]);

  // Paquetes activos para el selector
  const activePackages = packages.filter((p) => p.status === "active");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Sesiones</h1>
          <p className="text-[var(--text-secondary)]">
            Gestiona tu agenda de entrenamientos
          </p>
        </div>
      </div>

      <SesionesClient
        initialSessions={sessionsData.sessions}
        customers={customers}
        services={services}
        packages={activePackages}
      />
    </div>
  );
}
