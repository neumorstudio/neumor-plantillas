interface Appointment {
  id: string;
  date: string;
  time: string;
  services: string[];
  status: string;
  price?: number;
  notes?: string;
}

interface SalonAppointmentsProps {
  appointments: Appointment[];
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
  };
  return statusMap[status] || { class: "portal-badge-pending", label: status };
}

export default function SalonAppointments({ appointments }: SalonAppointmentsProps) {
  const now = new Date();

  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.date) >= now && a.status !== "cancelled"
  );
  const pastAppointments = appointments.filter(
    (a) => new Date(a.date) < now || a.status === "cancelled"
  );

  return (
    <div className="salon-theme">
      <h1 className="portal-page-title">Mis Citas</h1>

      {/* Proximas citas */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Proximas</h2>
        <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
          {upcomingAppointments.length} citas
        </span>
      </div>

      {upcomingAppointments.length > 0 ? (
        <div className="portal-list" style={{ marginBottom: "2rem" }}>
          {upcomingAppointments.map((apt) => {
            const badge = getStatusBadge(apt.status);
            return (
              <div key={apt.id} className="portal-card">
                <div className="portal-card-header">
                  <span style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                    {formatDate(apt.date)}
                  </span>
                  <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                </div>

                <div style={{ marginTop: "0.75rem" }}>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "600",
                      color: "var(--ng-text-primary)",
                    }}
                  >
                    {apt.time}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                    {apt.services.map((service, idx) => (
                      <span key={idx} className="salon-service-badge">
                        {service}
                      </span>
                    ))}
                  </div>

                  {apt.price && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        fontSize: "0.875rem",
                        color: "var(--ng-text-secondary)",
                      }}
                    >
                      Precio estimado: <strong>{apt.price.toFixed(2)} EUR</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty" style={{ marginBottom: "2rem" }}>
          <svg
            className="portal-empty-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="portal-empty-title">Sin citas programadas</p>
          <p className="portal-empty-text">
            Contacta con nosotros para reservar tu proxima cita.
          </p>
        </div>
      )}

      {/* Historial */}
      {pastAppointments.length > 0 && (
        <>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Historial</h2>
          </div>
          <div className="portal-list">
            {pastAppointments.slice(0, 10).map((apt) => {
              const badge = getStatusBadge(apt.status);
              return (
                <div key={apt.id} className="portal-list-item" style={{ opacity: 0.7 }}>
                  <div className="portal-list-item-header">
                    <span className="portal-list-item-title">{formatDate(apt.date)}</span>
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                    {apt.services.map((service, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "9999px",
                          backgroundColor: "var(--ng-surface-alt)",
                          color: "var(--ng-text-secondary)",
                        }}
                      >
                        {service}
                      </span>
                    ))}
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
