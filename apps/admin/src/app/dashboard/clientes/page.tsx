// Clientes - Página placeholder
// TODO: Implementar en Fase 4

export default function ClientesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Clientes</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona tu base de clientes y su historial
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Proximamente</h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          Esta seccion te permitira ver todos tus clientes, su informacion de contacto,
          historial de reservas, presupuestos y trabajos realizados.
        </p>
      </div>
    </div>
  );
}
