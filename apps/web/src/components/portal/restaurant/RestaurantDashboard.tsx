import Link from "next/link";

interface Reservation {
  id: string;
  date: string;
  time: string;
  party_size: number;
  status: string;
  notes?: string;
}

interface RestaurantDashboardProps {
  customer: {
    name: string;
    email: string;
  };
  reservations: Reservation[];
  loyaltyPoints?: number;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { class: string; label: string }> = {
    pending: { class: "portal-badge-pending", label: "Pendiente" },
    confirmed: { class: "portal-badge-confirmed", label: "Confirmada" },
    completed: { class: "portal-badge-completed", label: "Completada" },
    cancelled: { class: "portal-badge-cancelled", label: "Cancelada" },
    no_show: { class: "portal-badge-cancelled", label: "No asistio" },
  };
  return statusMap[status] || { class: "portal-badge-pending", label: status };
}

export default function RestaurantDashboard({
  customer,
  reservations,
  loyaltyPoints = 0,
}: RestaurantDashboardProps) {
  const now = new Date();

  const upcomingReservations = reservations.filter(
    (r) => new Date(r.date) >= now && r.status !== "cancelled"
  );

  const completedCount = reservations.filter((r) => r.status === "completed").length;

  return (
    <div className="restaurant-theme">
      <h1 className="portal-page-title">Hola, {customer.name.split(" ")[0]}</h1>

      {/* Stats */}
      <div className="portal-stats-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="portal-stat-value">{upcomingReservations.length}</div>
          <div className="portal-stat-label">Proximas reservas</div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
              <path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
          </div>
          <div className="portal-stat-value">{completedCount}</div>
          <div className="portal-stat-label">Visitas totales</div>
        </div>
      </div>

      {/* Puntos de fidelidad */}
      {loyaltyPoints > 0 && (
        <div className="restaurant-points-card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            <span className="restaurant-points-value">{loyaltyPoints}</span>
          </div>
          <div className="restaurant-points-label">Puntos de fidelidad</div>
        </div>
      )}

      {/* Proximas reservas */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Proximas reservas</h2>
        <Link href="/mi-cuenta/reservas" className="portal-section-link">
          Ver todas
        </Link>
      </div>

      {upcomingReservations.length > 0 ? (
        <div className="portal-list">
          {upcomingReservations.slice(0, 3).map((res) => {
            const badge = getStatusBadge(res.status);
            return (
              <div key={res.id} className="portal-list-item">
                <div className="portal-list-item-header">
                  <div>
                    <span className="portal-list-item-title">{formatDate(res.date)}</span>
                    <span style={{ marginLeft: "0.5rem", fontWeight: "600" }}>{res.time}</span>
                  </div>
                  <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                </div>
                <div className="portal-list-item-meta" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  {res.party_size} {res.party_size === 1 ? "persona" : "personas"}
                </div>
                {res.notes && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--ng-text-secondary)", fontStyle: "italic" }}>
                    "{res.notes}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty">
          <svg className="portal-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
          <p className="portal-empty-title">Sin reservas programadas</p>
          <p className="portal-empty-text">
            Reserva una mesa y disfruta de nuestra cocina.
          </p>
        </div>
      )}
    </div>
  );
}
