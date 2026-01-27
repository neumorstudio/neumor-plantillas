import Link from "next/link";

interface Appointment {
  id: string;
  date: string;
  time: string;
  treatment: string;
  doctor?: string;
  status: string;
  notes?: string;
}

interface ClinicDashboardProps {
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

export default function ClinicDashboard({
  customer,
  appointments,
}: ClinicDashboardProps) {
  const now = new Date();

  const upcomingAppointments = appointments.filter(
    (a) => new Date(a.date) >= now && a.status !== "cancelled"
  );

  const completedCount = appointments.filter((a) => a.status === "completed").length;

  // Tratamientos unicos
  const uniqueTreatments = [...new Set(appointments.map((a) => a.treatment))];

  return (
    <div className="clinic-theme">
      <h1 className="portal-page-title">Hola, {customer.name.split(" ")[0]}</h1>

      {/* Stats */}
      <div className="portal-stats-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
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
          <div className="portal-stat-icon" style={{ background: "linear-gradient(135deg, #06b6d4, #0891b2)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="portal-stat-value">{completedCount}</div>
          <div className="portal-stat-label">Sesiones realizadas</div>
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
                  <span className="portal-list-item-title">{apt.treatment}</span>
                  <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                </div>
                <div className="portal-list-item-meta">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: "inline", marginRight: "0.25rem", verticalAlign: "middle" }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(apt.date)} a las {apt.time}
                </div>
                {apt.doctor && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--ng-text-secondary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Dr/a. {apt.doctor}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="portal-empty">
          <svg className="portal-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="portal-empty-title">Sin citas programadas</p>
          <p className="portal-empty-text">
            Contacta con nosotros para programar tu proxima cita.
          </p>
        </div>
      )}

      {/* Tratamientos */}
      {uniqueTreatments.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Tus tratamientos</h2>
            <Link href="/mi-cuenta/tratamientos" className="portal-section-link">
              Ver todos
            </Link>
          </div>

          <div className="portal-card">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {uniqueTreatments.slice(0, 5).map((treatment) => (
                <span
                  key={treatment}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "9999px",
                    background: "linear-gradient(135deg, #cffafe, #a5f3fc)",
                    color: "#0e7490",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                  }}
                >
                  {treatment}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
