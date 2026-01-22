// Trabajos - Página placeholder
// TODO: Implementar en Fase 4

export default function TrabajosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Trabajos</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona tus trabajos y proyectos en curso
        </p>
      </div>

      <div className="neumor-card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Proximamente</h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          Esta seccion te permitira gestionar tus trabajos, ver el estado de cada proyecto,
          agregar tareas y subir fotos del antes/despues.
        </p>
      </div>
    </div>
  );
}
