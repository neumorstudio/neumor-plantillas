interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  status: string;
  created_at: string;
  estimated_completion?: string;
  completed_at?: string;
  price?: number;
  warranty_until?: string;
}

interface RepairsWorkOrdersProps {
  workOrders: WorkOrder[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
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

export default function RepairsWorkOrders({ workOrders }: RepairsWorkOrdersProps) {
  const activeOrders = workOrders.filter(
    (w) => !["completed", "cancelled"].includes(w.status)
  );
  const completedOrders = workOrders.filter((w) => w.status === "completed");
  const cancelledOrders = workOrders.filter((w) => w.status === "cancelled");

  return (
    <div className="repairs-theme">
      <h1 className="portal-page-title">Mis Trabajos</h1>

      {/* Trabajos activos */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">En curso</h2>
        <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
          {activeOrders.length} trabajos
        </span>
      </div>

      {activeOrders.length > 0 ? (
        <div className="portal-list" style={{ marginBottom: "2rem" }}>
          {activeOrders.map((order) => {
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

                <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                    <span style={{ color: "var(--ng-text-secondary)" }}>Solicitado</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                  {order.estimated_completion && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--ng-text-secondary)" }}>Estimado</span>
                      <span>{formatDate(order.estimated_completion)}</span>
                    </div>
                  )}
                  {order.price && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--ng-border)" }}>
                      <span style={{ color: "var(--ng-text-secondary)" }}>Presupuesto</span>
                      <span style={{ fontWeight: "700" }}>{order.price.toFixed(2)} EUR</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty" style={{ marginBottom: "2rem" }}>
          <svg className="portal-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <p className="portal-empty-title">Sin trabajos activos</p>
          <p className="portal-empty-text">
            Todos tus trabajos han sido completados.
          </p>
        </div>
      )}

      {/* Completados */}
      {completedOrders.length > 0 && (
        <>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Completados</h2>
          </div>
          <div className="portal-list" style={{ marginBottom: "2rem" }}>
            {completedOrders.slice(0, 5).map((order) => {
              const badge = getStatusBadge(order.status);
              const hasWarranty = order.warranty_until && new Date(order.warranty_until) > new Date();
              return (
                <div key={order.id} className="portal-list-item">
                  <div className="portal-list-item-header">
                    <span className="portal-list-item-title">{order.title}</span>
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="portal-list-item-meta">
                    Completado: {order.completed_at ? formatDate(order.completed_at) : "N/A"}
                    {order.price && ` - ${order.price.toFixed(2)} EUR`}
                  </div>
                  {hasWarranty && (
                    <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#059669", fontSize: "0.75rem" }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      Garantia hasta {formatDate(order.warranty_until!)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Cancelados */}
      {cancelledOrders.length > 0 && (
        <>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Cancelados</h2>
          </div>
          <div className="portal-list">
            {cancelledOrders.slice(0, 3).map((order) => {
              const badge = getStatusBadge(order.status);
              return (
                <div key={order.id} className="portal-list-item" style={{ opacity: 0.6 }}>
                  <div className="portal-list-item-header">
                    <span className="portal-list-item-title">{order.title}</span>
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="portal-list-item-meta">
                    Solicitado: {formatDate(order.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
