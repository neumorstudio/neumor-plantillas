import Link from "next/link";

interface Session {
  id: string;
  date: string;
  time: string;
  class_name: string;
  trainer_name?: string;
  status: string;
}

interface Package {
  id: string;
  name: string;
  sessions_remaining: number;
  status: string;
}

interface Progress {
  id: string;
  date: string;
  weight?: number;
  body_fat?: number;
  muscle_mass?: number;
  notes?: string;
}

interface GymDashboardProps {
  customer: {
    name: string;
    email: string;
  };
  sessions: Session[];
  packages: Package[];
  progress: Progress[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function GymDashboard({
  customer,
  sessions,
  packages,
  progress,
}: GymDashboardProps) {
  // Estadisticas
  const upcomingSessions = sessions.filter(
    (s) => s.status === "scheduled" && new Date(s.date) >= new Date()
  ).length;

  const completedSessions = sessions.filter((s) => s.status === "completed").length;

  const activePackages = packages.filter((p) => p.status === "active");
  const totalSessionsRemaining = activePackages.reduce(
    (sum, p) => sum + p.sessions_remaining,
    0
  );

  const latestProgress = progress[0];

  // Proximas sesiones (las 3 mas cercanas)
  const nextSessions = sessions
    .filter((s) => s.status === "scheduled" && new Date(s.date) >= new Date())
    .slice(0, 3);

  return (
    <div className="gym-theme">
      <h1 className="portal-page-title">Hola, {customer.name.split(" ")[0]}</h1>

      {/* Stats Grid */}
      <div className="portal-stats-grid">
        <div className="portal-stat-card">
          <div className="portal-stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="portal-stat-value">{upcomingSessions}</div>
          <div className="portal-stat-label">Proximas sesiones</div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="portal-stat-value">{completedSessions}</div>
          <div className="portal-stat-label">Completadas</div>
        </div>

        <div className="portal-stat-card">
          <div className="portal-stat-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
          </div>
          <div className="portal-stat-value">{totalSessionsRemaining}</div>
          <div className="portal-stat-label">Sesiones disponibles</div>
        </div>
      </div>

      {/* Proximas sesiones */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Proximas sesiones</h2>
        <Link href="/mi-cuenta/reservas" className="portal-section-link">
          Ver todas
        </Link>
      </div>

      {nextSessions.length > 0 ? (
        <div className="portal-list">
          {nextSessions.map((session) => (
            <div key={session.id} className="portal-list-item">
              <div className="portal-list-item-header">
                <span className="portal-list-item-title">{session.class_name}</span>
                <span className="portal-badge portal-badge-scheduled">Programada</span>
              </div>
              <div className="portal-list-item-meta">
                {formatDate(session.date)} a las {session.time}
                {session.trainer_name && ` - ${session.trainer_name}`}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="portal-empty">
          <svg className="portal-empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="portal-empty-title">Sin sesiones programadas</p>
          <p className="portal-empty-text">
            Contacta con nosotros para programar tu proxima sesion.
          </p>
        </div>
      )}

      {/* Ultimo progreso */}
      {latestProgress && (
        <div style={{ marginTop: "2rem" }}>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Tu progreso</h2>
            <Link href="/mi-cuenta/progreso" className="portal-section-link">
              Ver historial
            </Link>
          </div>

          <div className="portal-card">
            <div className="portal-card-header">
              <span className="portal-card-title">Ultima medicion</span>
              <span style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                {formatDate(latestProgress.date)}
              </span>
            </div>

            <div className="gym-progress-grid">
              {latestProgress.weight && (
                <div>
                  <div className="gym-progress-value">{latestProgress.weight} kg</div>
                  <div className="gym-progress-label">Peso</div>
                </div>
              )}
              {latestProgress.body_fat && (
                <div>
                  <div className="gym-progress-value">{latestProgress.body_fat}%</div>
                  <div className="gym-progress-label">Grasa</div>
                </div>
              )}
              {latestProgress.muscle_mass && (
                <div>
                  <div className="gym-progress-value">{latestProgress.muscle_mass} kg</div>
                  <div className="gym-progress-label">Musculo</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
