import Link from "next/link";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items_count: number;
  tracking_number?: string;
}

interface StoreDashboardProps {
  customer: {
    name: string;
    email: string;
  };
  orders: Order[];
  loyaltyPoints?: number;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { class: string; label: string; dot: string }> = {
    pending: { class: "portal-badge-pending", label: "Pendiente", dot: "processing" },
    processing: { class: "portal-badge-pending", label: "Procesando", dot: "processing" },
    shipped: { class: "portal-badge-scheduled", label: "Enviado", dot: "shipped" },
    delivered: { class: "portal-badge-completed", label: "Entregado", dot: "delivered" },
    cancelled: { class: "portal-badge-cancelled", label: "Cancelado", dot: "processing" },
  };
  return statusMap[status] || { class: "portal-badge-pending", label: status, dot: "processing" };
}

export default function StoreDashboard({
  customer,
  orders,
  loyaltyPoints = 0,
}: StoreDashboardProps) {
  const activeOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  );

  const completedCount = orders.filter((o) => o.status === "delivered").length;

  const totalSpent = orders
    .filter((o) => o.status === "delivered")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="store-theme">
      <h1 className="portal-page-title">Hola, {customer.name.split(" ")[0]}</h1>

      {/* Stats */}
      <div className="portal-stats-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div className="portal-stat-value">{activeOrders.length}</div>
          <div className="portal-stat-label">Pedidos activos</div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
          </div>
          <div className="portal-stat-value">{completedCount}</div>
          <div className="portal-stat-label">Pedidos totales</div>
        </div>
      </div>

      {/* Puntos de fidelidad */}
      {loyaltyPoints > 0 && (
        <div className="portal-card" style={{ marginBottom: "1.5rem", background: "linear-gradient(135deg, #eef2ff, #e0e7ff)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#4338ca", textTransform: "uppercase", fontWeight: "600" }}>
                Puntos acumulados
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "#3730a3" }}>
                {loyaltyPoints} pts
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </div>
      )}

      {/* Pedidos activos */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Pedidos en curso</h2>
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
                  <span style={{ fontWeight: "600", fontSize: "0.875rem" }}>
                    #{order.order_number}
                  </span>
                  <div className="store-order-status">
                    <span className={`store-order-status-dot ${badge.dot}`} />
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
                    {order.items_count} {order.items_count === 1 ? "articulo" : "articulos"}
                  </div>
                  <div style={{ fontWeight: "700" }}>{order.total.toFixed(2)} EUR</div>
                </div>

                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                  Pedido el {formatDate(order.created_at)}
                </div>

                {order.tracking_number && (
                  <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", backgroundColor: "var(--ng-surface-alt)", borderRadius: "0.5rem", fontSize: "0.75rem" }}>
                    <span style={{ color: "var(--ng-text-secondary)" }}>Tracking: </span>
                    <span style={{ fontWeight: "600" }}>{order.tracking_number}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty">
          <svg className="portal-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p className="portal-empty-title">Sin pedidos activos</p>
          <p className="portal-empty-text">
            Explora nuestra tienda y haz tu primer pedido.
          </p>
        </div>
      )}

      {/* Total gastado */}
      {totalSpent > 0 && (
        <div style={{ marginTop: "1.5rem", textAlign: "center", padding: "1rem", backgroundColor: "var(--ng-surface-alt)", borderRadius: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)", marginBottom: "0.25rem" }}>
            Total en compras
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: "700", color: "var(--ng-text-primary)" }}>
            {totalSpent.toFixed(2)} EUR
          </div>
        </div>
      )}
    </div>
  );
}
