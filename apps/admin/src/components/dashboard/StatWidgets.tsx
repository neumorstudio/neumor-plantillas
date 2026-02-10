import React from "react";

// Componentes de widgets de estadísticas para el dashboard dinámico

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
}

function StatCard({ label, value, subValue, icon }: StatCardProps) {
  return (
    <div className="neumor-card p-5 sm:p-6 stat-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-3xl sm:text-4xl font-heading font-semibold leading-none tracking-tight text-[var(--text-primary)] tabular-nums">
            {value}
          </div>
          {subValue && (
            <div className="mt-2 text-xs sm:text-sm text-[var(--accent)] font-medium">
              {subValue}
            </div>
          )}
          <div className="mt-2 text-sm text-[var(--text-secondary)]">
            {label}
          </div>
        </div>
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Widget: Reservas de hoy
export function BookingsTodayWidget({ count, label = "Citas hoy" }: { count: number; label?: string }) {
  return (
    <StatCard
      label={label}
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
export function BookingsMonthWidget({ count, label = "Citas este mes" }: { count: number; label?: string }) {
  return (
    <StatCard
      label={label}
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
export function RevenueMonthWidget({
  totalAmount,
  label = "Ingresos este mes",
}: {
  totalAmount: number;
  label?: string;
}) {
  return (
    <StatCard
      label={label}
      value={`${totalAmount.toLocaleString("es-ES")} €`}
      icon={
        <span className="text-lg font-semibold leading-none">€</span>
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

// ============================================
// FITNESS / ENTRENADOR PERSONAL WIDGETS
// ============================================

// Widget: Sesiones de hoy
export function SessionsTodayWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Sesiones hoy"
      value={count.toString()}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
        </svg>
      }
    />
  );
}

// Widget: Sesiones esta semana
export function SessionsWeekWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Sesiones esta semana"
      value={count.toString()}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </svg>
      }
    />
  );
}

// Widget: Clientes activos
export function ActiveClientsWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Clientes activos"
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

// Widget: Paquetes por expirar
export function ExpiringPackagesWidget({ count }: { count: number }) {
  return (
    <StatCard
      label="Paquetes por expirar"
      value={count.toString()}
      subValue={count > 0 ? "Proximos 7 dias" : undefined}
      icon={
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      }
    />
  );
}

// ============================================
// FITNESS / ENTRENADOR PERSONAL - BLOQUE HOY
// ============================================

export interface TodaySession {
  id: string;
  booking_date: string;
  booking_time: string | null;
  status: string;
  session_notes: string | null;
  customers?: { id: string; name: string } | { id: string; name: string }[] | null;
  trainer_services?: { id: string; name: string } | { id: string; name: string }[] | null;
}

function getTodaySessionStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return { class: "badge-confirmed", label: "Confirmada" };
    case "completed":
      return { class: "badge-confirmed", label: "Completada" };
    case "cancelled":
      return { class: "badge-cancelled", label: "Cancelada" };
    case "no_show":
      return { class: "badge-cancelled", label: "No asistio" };
    default:
      return { class: "badge-pending", label: "Pendiente" };
  }
}

function getRelationName(
  relation?: { name: string } | { name: string }[] | null
): string | null {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation[0]?.name || null;
  return relation.name || null;
}

export function TodaySessionsCard({ sessions }: { sessions: TodaySession[] }) {
  const visibleSessions = sessions.slice(0, 8);

  return (
    <div className="neumor-card p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Hoy</h2>
          <p className="text-sm text-[var(--text-secondary)]">Proximas sesiones</p>
        </div>
        <a
          href="/dashboard/calendario"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Ver calendario
        </a>
      </div>

      {visibleSessions.length === 0 ? (
        <div className="text-center py-6 text-[var(--text-secondary)]">
          <p>No tienes sesiones para hoy</p>
          <p className="text-sm mt-2">Abre el calendario para programar sesiones.</p>
          <a
            href="/dashboard/calendario"
            className="mt-4 inline-flex neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium"
          >
            Abrir calendario
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleSessions.map((session) => {
            const badge = getTodaySessionStatusBadge(session.status);
            const customerName = getRelationName(session.customers) || "Cliente por asignar";
            const serviceName = getRelationName(session.trainer_services) || "Servicio por asignar";
            const needsAssign = !getRelationName(session.customers) || !getRelationName(session.trainer_services);

            return (
              <div
                key={session.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-lg border border-[var(--shadow-light)] px-3 py-3"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="text-base sm:text-lg font-semibold tabular-nums w-14">
                    {session.booking_time?.slice(0, 5) || "--:--"}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">{customerName}</div>
                    <div className="text-xs text-[var(--text-secondary)] truncate">
                      {serviceName}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
                  <span className={`badge ${badge.class}`}>{badge.label}</span>
                  <a
                    href="/dashboard/sesiones"
                    className="neumor-btn px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Iniciar sesion
                  </a>
                  <a
                    href="/dashboard/sesiones"
                    className="neumor-btn px-3 py-1.5 rounded-lg text-xs font-medium"
                  >
                    Reprogramar
                  </a>
                  {needsAssign && (
                    <a
                      href="/dashboard/sesiones"
                      className="neumor-btn px-3 py-1.5 rounded-lg text-xs font-medium"
                    >
                      Asignar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
