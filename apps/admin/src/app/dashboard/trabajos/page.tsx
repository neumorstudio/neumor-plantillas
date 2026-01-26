// Trabajos - Página con lista y gestión de trabajos
import { getJobs } from "@/lib/data";
import { TrabajosClient } from "./trabajos-client";

export default async function TrabajosPage() {
  const jobs = await getJobs();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="page-header">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-1">Trabajos</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestiona tus trabajos y proyectos en curso
        </p>
      </div>

      <TrabajosClient initialJobs={jobs} />
    </div>
  );
}
