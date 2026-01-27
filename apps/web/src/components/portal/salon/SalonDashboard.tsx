import Link from "next/link";

interface Appointment {
  id: string;
  date: string;
  time: string;
  services: string[];
  status: string;
  price?: number;
}

interface SalonDashboardProps {
  customer: {
    name: string;
    email: string;
  };
  appointments: Appointment[];
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
  };
  return statusMap[status] || { class: "portal-badge-pending", label: status };
}

export default function SalonDashboard({
  customer,
  appointments,
}: SalonDashboardProps) {
  const now = new Date();

  // Proximas citas
  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.date) >= now && a.status !== "cancelled"
  );

  // Citas completadas
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  // Servicios mas frecuentes
  const allServices = appointments.flatMap((a) => a.services || []);
  const serviceCount = allServices.reduce((acc, service) => {
    acc[service] = (acc[service] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topServices = Object.entries(serviceCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="salon-theme">
      <h1 className="portal-page-title">Hola, {customer.name.split(" ")[0]}</h1>

      {/* Stats */}
      <div className="portal-stats-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #ec4899, #db2777)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="portal-stat-value">{upcomingAppointments.length}</div>
          <div className="portal-stat-label">Proximas citas</div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #ec4899, #db2777)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="portal-stat-value">{completedCount}</div>
          <div className="portal-stat-label">Visitas totales</div>
        </div>
      </div>

      {/* Proximas citas */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Proximas citas</h2>
        <Link href="/mi-cuenta/reservas" className="portal-section-link">
          Ver todas
        </Link>
      </div>

      {upcomingAppointments.length > 0 ? (
        <div className="portal-list">
          {upcomingAppointments.slice(0, 3).map((apt) => {
            const badge = getStatusBadge(apt.status);
            return (
              <div key={apt.id} className="portal-list-item">
                <div className="portal-list-item-header">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {apt.services.map((service, idx) => (
                      <span key={idx} className="salon-service-badge">
                        {service}
                      </span>
                    ))}
                  </div>
                  <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                </div>
                <div className="portal-list-item-meta" style={{ marginTop: "0.75rem" }}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "middle" }}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(apt.date)} a las {apt.time}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty">
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
            Reserva tu proxima cita y luce increible.
          </p>
        </div>
      )}

      {/* Servicios favoritos */}
      {topServices.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Tus servicios favoritos</h2>
          </div>

          <div className="portal-card">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topServices.map(([service, count]) => (
                <div
                  key={service}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span className="salon-service-badge">{service}</span>
                  <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
                    {count} {count === 1 ? "vez" : "veces"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
