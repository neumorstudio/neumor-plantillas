interface Reservation {
  id: string;
  date: string;
  time: string;
  party_size: number;
  status: string;
  notes?: string;
}

interface RestaurantReservationsProps {
  reservations: Reservation[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
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

export default function RestaurantReservations({ reservations }: RestaurantReservationsProps) {
  const now = new Date();

  const upcomingReservations = reservations.filter(
    (r) => new Date(r.date) >= now && r.status !== "cancelled"
  );
  const pastReservations = reservations.filter(
    (r) => new Date(r.date) < now || r.status === "cancelled"
  );

  return (
    <div className="restaurant-theme">
      <h1 className="portal-page-title">Mis Reservas</h1>

      {/* Proximas reservas */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Proximas</h2>
        <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
          {upcomingReservations.length} reservas
        </span>
      </div>

      {upcomingReservations.length > 0 ? (
        <div className="portal-list" style={{ marginBottom: "2rem" }}>
          {upcomingReservations.map((res) => {
            const badge = getStatusBadge(res.status);
            return (
              <div key={res.id} className="portal-card">
                <div className="portal-card-header">
                  <span style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                    {formatDate(res.date)}
                  </span>
                  <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "700", color: "var(--ng-text-primary)" }}>
                    {res.time}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem", color: "var(--ng-text-secondary)" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>{res.party_size} {res.party_size === 1 ? "persona" : "personas"}</span>
                  </div>

                  {res.notes && (
                    <div style={{ marginTop: "0.75rem", padding: "0.75rem", backgroundColor: "var(--ng-surface-alt)", borderRadius: "0.5rem", fontSize: "0.875rem", color: "var(--ng-text-secondary)", fontStyle: "italic" }}>
                      "{res.notes}"
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="portal-empty-title">Sin reservas programadas</p>
          <p className="portal-empty-text">
            Contacta con nosotros para hacer una reserva.
          </p>
        </div>
      )}

      {/* Historial */}
      {pastReservations.length > 0 && (
        <>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Historial</h2>
          </div>
          <div className="portal-list">
            {pastReservations.slice(0, 10).map((res) => {
              const badge = getStatusBadge(res.status);
              return (
                <div key={res.id} className="portal-list-item" style={{ opacity: 0.7 }}>
                  <div className="portal-list-item-header">
                    <span className="portal-list-item-title">{formatDate(res.date)} - {res.time}</span>
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="portal-list-item-meta">
                    {res.party_size} {res.party_size === 1 ? "persona" : "personas"}
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
