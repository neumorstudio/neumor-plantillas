// Pagos - Página placeholder
// TODO: Implementar en Fase 4

export default function PagosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold">Pagos</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona tus cobros y pagos pendientes
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
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Proximamente</h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          Esta seccion te permitira gestionar todos tus pagos, ver cobros pendientes,
          registrar pagos recibidos y llevar un control de tu facturacion.
        </p>
      </div>
    </div>
  );
}
