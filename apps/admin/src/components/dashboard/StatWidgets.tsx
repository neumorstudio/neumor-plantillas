// Componentes de widgets de estadísticas para el dashboard dinámico

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
}

function StatCard({ label, value, subValue, icon }: StatCardProps) {
  return (
    <div className="neumor-card p-6 stat-card">
      <div className="flex items-start justify-between">
        <div>
          <span className="stat-value">{value}</span>
          {subValue && (
            <span className="block text-sm text-[var(--accent)] font-medium mt-1">
              {subValue}
            </span>
          )}
          <span className="stat-label">{label}</span>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Widget: Reservas de hoy
export function BookingsTodayWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Reservas hoy"
      value={count.toString()}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      }
    />
  );
}

// Widget: Reservas del mes
export function BookingsMonthWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Reservas este mes"
      value={count.toString()}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      }
    />
  );
}

// Widget: Reservas pendientes
export function BookingsPendingWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Reservas pendientes"
      value={count.toString()}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      }
    />
  );
}

// Widget: Leads nuevos
export function LeadsNewWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Leads nuevos"
      value={count.toString()}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      }
    />
  );
}

// Widget: Presupuestos pendientes
export function QuotesPendingWidget({ count, totalAmount }: { count: number; totalAmount: number }) {
  const formattedAmount = totalAmount > 0 ? `${totalAmount.toLocaleString("es-ES")} €` : undefined;
  return (
    <StatCard
      label="Presupuestos pendientes"
      value={count.toString()}
      subValue={formattedAmount}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M8 13h8" />
          <path d="M8 17h5" />
        </svg>
      }
    />
  );
}

// Widget: Presupuestos aceptados
export function QuotesAcceptedWidget({ count, totalAmount }: { count: number; totalAmount: number }) {
  const formattedAmount = totalAmount > 0 ? `${totalAmount.toLocaleString("es-ES")} €` : undefined;
  return (
    <StatCard
      label="Aceptados este mes"
      value={count.toString()}
      subValue={formattedAmount}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      }
    />
  );
}

// Widget: Trabajos activos
export function JobsActiveWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Trabajos en curso"
      value={count.toString()}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      }
    />
  );
}

// Widget: Pagos pendientes
export function PaymentsPendingWidget({ count, totalAmount }: { count: number; totalAmount: number }) {
  return (
    <StatCard
      label="Cobros pendientes"
      value={`${totalAmount.toLocaleString("es-ES")} €`}
      subValue={count > 0 ? `${count} pago${count > 1 ? "s" : ""}` : undefined}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      }
    />
  );
}

// Widget: Ingresos del mes
export function RevenueMonthWidget({ totalAmount }: { totalAmount: number }) {
  return (
    <StatCard
      label="Ingresos este mes"
      value={`${totalAmount.toLocaleString("es-ES")} €`}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      }
    />
  );
}

// Widget: Pedidos de hoy (para shop/restaurant)
export function OrdersTodayWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Pedidos hoy"
      value={count.toString()}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      }
    />
  );
}
