interface Session {
  id: string;
  date: string;
  time: string;
  class_name: string;
  trainer_name?: string;
  status: string;
}

interface GymSessionsProps {
  sessions: Session[];
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
    scheduled: { class: "portal-badge-scheduled", label: "Programada" },
    completed: { class: "portal-badge-completed", label: "Completada" },
    cancelled: { class: "portal-badge-cancelled", label: "Cancelada" },
    pending: { class: "portal-badge-pending", label: "Pendiente" },
  };
  return statusMap[status] || { class: "portal-badge-pending", label: status };
}

export default function GymSessions({ sessions }: GymSessionsProps) {
  const now = new Date();

  // Separar sesiones futuras y pasadas
  const upcomingSessions = sessions.filter(
    (s) => new Date(s.date) >= now && s.status !== "cancelled"
  );
  const pastSessions = sessions.filter(
    (s) => new Date(s.date) < now || s.status === "cancelled"
  );

  return (
    <div className="gym-theme">
      <h1 className="portal-page-title">Mis Sesiones</h1>

      {/* Proximas sesiones */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Proximas</h2>
        <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
          {upcomingSessions.length} sesiones
        </span>
      </div>

      {upcomingSessions.length > 0 ? (
        <div className="portal-list" style={{ marginBottom: "2rem" }}>
          {upcomingSessions.map((session) => {
            const badge = getStatusBadge(session.status);
            return (
              <div key={session.id} className="portal-list-item">
                <div className="portal-list-item-header">
                  <span className="portal-list-item-title">{session.class_name}</span>
                  <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                </div>
                <div className="portal-list-item-meta">
                  {formatDate(session.date)} a las {session.time}
                </div>
                {session.trainer_name && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.875rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: "var(--ng-text-secondary)" }}
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span style={{ color: "var(--ng-text-secondary)" }}>
                      {session.trainer_name}
                    </span>
                  </div>
                )}
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
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="portal-empty-title">Sin sesiones programadas</p>
          <p className="portal-empty-text">
            Contacta con tu entrenador para agendar nuevas sesiones.
          </p>
        </div>
      )}

      {/* Historial */}
      {pastSessions.length > 0 && (
        <>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Historial</h2>
          </div>
          <div className="portal-list">
            {pastSessions.slice(0, 10).map((session) => {
              const badge = getStatusBadge(session.status);
              return (
                <div
                  key={session.id}
                  className="portal-list-item"
                  style={{ opacity: 0.7 }}
                >
                  <div className="portal-list-item-header">
                    <span className="portal-list-item-title">{session.class_name}</span>
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="portal-list-item-meta">
                    {formatDate(session.date)} a las {session.time}
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
