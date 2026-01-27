interface Progress {
  id: string;
  date: string;
  weight?: number;
  body_fat?: number;
  muscle_mass?: number;
  notes?: string;
}

interface GymProgressProps {
  progress: Progress[];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calculateChange(current: number | undefined, previous: number | undefined): string | null {
  if (!current || !previous) return null;
  const diff = current - previous;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff.toFixed(1)}`;
}

export default function GymProgress({ progress }: GymProgressProps) {
  const latestProgress = progress[0];
  const previousProgress = progress[1];

  return (
    <div className="gym-theme">
      <h1 className="portal-page-title">Mi Progreso</h1>

      {latestProgress ? (
        <>
          {/* Resumen actual */}
          <div className="portal-card" style={{ marginBottom: "1.5rem" }}>
            <div className="portal-card-header">
              <span className="portal-card-title">Ultima medicion</span>
              <span style={{ fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                {formatDate(latestProgress.date)}
              </span>
            </div>

            <div className="gym-progress-grid" style={{ marginTop: "1rem" }}>
              {latestProgress.weight && (
                <div>
                  <div className="gym-progress-value">{latestProgress.weight}</div>
                  <div className="gym-progress-label">kg</div>
                  {previousProgress?.weight && (
                    <div
                      className={`gym-progress-change ${
                        latestProgress.weight < previousProgress.weight
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {calculateChange(latestProgress.weight, previousProgress.weight)} kg
                    </div>
                  )}
                </div>
              )}
              {latestProgress.body_fat && (
                <div>
                  <div className="gym-progress-value">{latestProgress.body_fat}</div>
                  <div className="gym-progress-label">% grasa</div>
                  {previousProgress?.body_fat && (
                    <div
                      className={`gym-progress-change ${
                        latestProgress.body_fat < previousProgress.body_fat
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {calculateChange(latestProgress.body_fat, previousProgress.body_fat)}%
                    </div>
                  )}
                </div>
              )}
              {latestProgress.muscle_mass && (
                <div>
                  <div className="gym-progress-value">{latestProgress.muscle_mass}</div>
                  <div className="gym-progress-label">kg musculo</div>
                  {previousProgress?.muscle_mass && (
                    <div
                      className={`gym-progress-change ${
                        latestProgress.muscle_mass > previousProgress.muscle_mass
                          ? "positive"
                          : "negative"
                      }`}
                    >
                      {calculateChange(latestProgress.muscle_mass, previousProgress.muscle_mass)} kg
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Historial */}
          <h2 className="portal-section-title" style={{ marginBottom: "1rem" }}>
            Historial de mediciones
          </h2>
          <div className="portal-list">
            {progress.map((p) => (
              <div key={p.id} className="portal-list-item">
                <div className="portal-list-item-header">
                  <span className="portal-list-item-title">{formatDate(p.date)}</span>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
                  {p.weight && (
                    <div style={{ fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--ng-text-secondary)" }}>Peso:</span>{" "}
                      <strong>{p.weight} kg</strong>
                    </div>
                  )}
                  {p.body_fat && (
                    <div style={{ fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--ng-text-secondary)" }}>Grasa:</span>{" "}
                      <strong>{p.body_fat}%</strong>
                    </div>
                  )}
                  {p.muscle_mass && (
                    <div style={{ fontSize: "0.875rem" }}>
                      <span style={{ color: "var(--ng-text-secondary)" }}>Musculo:</span>{" "}
                      <strong>{p.muscle_mass} kg</strong>
                    </div>
                  )}
                </div>
                {p.notes && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.875rem",
                      color: "var(--ng-text-secondary)",
                    }}
                  >
                    {p.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
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
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <p className="portal-empty-title">Sin mediciones</p>
          <p className="portal-empty-text">
            Aun no tienes mediciones de progreso. Tu entrenador registrara tus avances.
          </p>
        </div>
      )}
    </div>
  );
}
