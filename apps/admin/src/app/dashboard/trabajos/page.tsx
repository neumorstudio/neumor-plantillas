// Trabajos - Página con lista y gestión de trabajos
import { getJobs } from "@/lib/data";
import { TrabajosClient } from "./trabajos-client";

export default async function TrabajosPage() {
  const jobs = await getJobs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Trabajos</h1>
          <p className="text-[var(--text-secondary)]">
            Gestiona tus trabajos y proyectos en curso
          </p>
        </div>
      </div>

      <TrabajosClient initialJobs={jobs} />
    </div>
  );
}
