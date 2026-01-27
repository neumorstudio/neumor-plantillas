import Link from "next/link";

interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  estimated_completion?: string;
  price?: number;
}

interface RepairsDashboardProps {
  customer: {
    name: string;
    email: string;
  };
  workOrders: WorkOrder[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { class: string; label: string }> = {
    pending: { class: "portal-badge-pending", label: "Pendiente" },
    quoted: { class: "portal-badge-pending", label: "Presupuestado" },
    approved: { class: "portal-badge-confirmed", label: "Aprobado" },
    in_progress: { class: "portal-badge-scheduled", label: "En progreso" },
    completed: { class: "portal-badge-completed", label: "Completado" },
    cancelled: { class: "portal-badge-cancelled", label: "Cancelado" },
  };
  return statusMap[status] || { class: "portal-badge-pending", label: status };
}

export default function RepairsDashboard({
  customer,
  workOrders,
}: RepairsDashboardProps) {
  const activeOrders = workOrders.filter(
    (w) => !["completed", "cancelled"].includes(w.status)
  );

  const completedCount = workOrders.filter((w) => w.status === "completed").length;

  return (
    <div className="repairs-theme">
      <h1 className="portal-page-title">Hola, {customer.name.split(" ")[0]}</h1>

      {/* Stats */}
      <div className="portal-stats-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div className="portal-stat-value">{activeOrders.length}</div>
          <div className="portal-stat-label">Trabajos activos</div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="portal-stat-value">{completedCount}</div>
          <div className="portal-stat-label">Completados</div>
        </div>
      </div>

      {/* Trabajos activos */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Trabajos en curso</h2>
        <Link href="/mi-cuenta/reservas" className="portal-section-link">
          Ver todos
        </Link>
      </div>

      {activeOrders.length > 0 ? (
        <div className="portal-list">
          {activeOrders.slice(0, 3).map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <div key={order.id} className="portal-card">
                <div className="portal-card-header">
                  <span className="portal-list-item-title">{order.title}</span>
                  <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                </div>

                {order.description && (
                  <p style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)", marginTop: "0.5rem" }}>
                    {order.description}
                  </p>
                )}

                <div className="repairs-status-timeline" style={{ marginTop: "1rem" }}>
                  <div className="repairs-status-item">
                    <span style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                      Solicitado: {formatDate(order.created_at)}
                    </span>
                  </div>
                  {order.estimated_completion && (
                    <div className="repairs-status-item">
                      <span style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                        Estimado: {formatDate(order.estimated_completion)}
                      </span>
                    </div>
                  )}
                </div>

                {order.price && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", backgroundColor: "var(--ng-surface-alt)", borderRadius: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>Presupuesto</span>
                    <span style={{ fontSize: "1.125rem", fontWeight: "700", color: "var(--ng-text-primary)" }}>
                      {order.price.toFixed(2)} EUR
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty">
          <svg className="portal-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <p className="portal-empty-title">Sin trabajos activos</p>
          <p className="portal-empty-text">
            Contacta con nosotros para solicitar un presupuesto.
          </p>
        </div>
      )}
    </div>
  );
}
