interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  items_count: number;
  tracking_number?: string;
  items?: { name: string; quantity: number; price: number }[];
}

interface StoreOrdersProps {
  orders: Order[];
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
  const statusMap: Record<string, { class: string; label: string; dot: string }> = {
    pending: { class: "portal-badge-pending", label: "Pendiente", dot: "processing" },
    processing: { class: "portal-badge-pending", label: "Procesando", dot: "processing" },
    shipped: { class: "portal-badge-scheduled", label: "Enviado", dot: "shipped" },
    delivered: { class: "portal-badge-completed", label: "Entregado", dot: "delivered" },
    cancelled: { class: "portal-badge-cancelled", label: "Cancelado", dot: "processing" },
  };
  return statusMap[status] || { class: "portal-badge-pending", label: status, dot: "processing" };
}

export default function StoreOrders({ orders }: StoreOrdersProps) {
  const activeOrders = orders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status)
  );
  const completedOrders = orders.filter((o) => o.status === "delivered");

  return (
    <div className="store-theme">
      <h1 className="portal-page-title">Mis Pedidos</h1>

      {/* Pedidos activos */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">En curso</h2>
        <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
          {activeOrders.length} pedidos
        </span>
      </div>

      {activeOrders.length > 0 ? (
        <div className="portal-list" style={{ marginBottom: "2rem" }}>
          {activeOrders.map((order) => {
            const badge = getStatusBadge(order.status);
            return (
              <div key={order.id} className="portal-card">
                <div className="portal-card-header">
                  <span style={{ fontWeight: "600" }}>#{order.order_number}</span>
                  <div className="store-order-status">
                    <span className={`store-order-status-dot ${badge.dot}`} />
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ color: "var(--ng-text-secondary)", fontSize: "0.875rem" }}>
                      {order.items_count} {order.items_count === 1 ? "articulo" : "articulos"}
                    </span>
                    <span style={{ fontWeight: "700", fontSize: "1.125rem" }}>
                      {order.total.toFixed(2)} EUR
                    </span>
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                    Pedido el {formatDate(order.created_at)}
                  </div>

                  {order.tracking_number && (
                    <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "var(--ng-surface-alt)", borderRadius: "0.5rem" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)", marginBottom: "0.25rem" }}>
                        Numero de seguimiento
                      </div>
                      <div style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="1" y="3" width="15" height="13"/>
                          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                          <circle cx="5.5" cy="18.5" r="2.5"/>
                          <circle cx="18.5" cy="18.5" r="2.5"/>
                        </svg>
                        {order.tracking_number}
                      </div>
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
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <p className="portal-empty-title">Sin pedidos en curso</p>
          <p className="portal-empty-text">
            Todos tus pedidos han sido entregados.
          </p>
        </div>
      )}

      {/* Historial */}
      {completedOrders.length > 0 && (
        <>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Historial</h2>
          </div>
          <div className="portal-list">
            {completedOrders.slice(0, 10).map((order) => {
              const badge = getStatusBadge(order.status);
              return (
                <div key={order.id} className="portal-list-item">
                  <div className="portal-list-item-header">
                    <span className="portal-list-item-title">#{order.order_number}</span>
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="portal-list-item-meta" style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>{formatDate(order.created_at)}</span>
                    <span style={{ fontWeight: "600" }}>{order.total.toFixed(2)} EUR</span>
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
