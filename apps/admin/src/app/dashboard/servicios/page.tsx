// Servicios - Tipos de entrenamiento que ofrece el entrenador
import { getTrainerServices } from "@/lib/data";
import { ServiciosClient } from "./servicios-client";

export default async function ServiciosPage() {
  const services = await getTrainerServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Servicios</h1>
          <p className="text-[var(--text-secondary)]">
            Configura los tipos de entrenamiento que ofreces
          </p>
        </div>
      </div>

      <ServiciosClient initialServices={services} />
    </div>
  );
}
