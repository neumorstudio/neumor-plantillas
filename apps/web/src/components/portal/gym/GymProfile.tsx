"use client";

import { useRouter } from "next/navigation";

interface GymProfileProps {
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function GymProfile({ customer }: GymProfileProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="gym-theme">
      <h1 className="portal-page-title">Mi Perfil</h1>

      {/* Informacion personal */}
      <div className="portal-card">
        <div className="portal-card-header">
          <span className="portal-card-title">Informacion personal</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label
              style={{
                fontSize: "0.75rem",
                color: "var(--ng-text-secondary)",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Nombre
            </label>
            <div style={{ fontWeight: "500" }}>{customer.name}</div>
          </div>

          <div>
            <label
              style={{
                fontSize: "0.75rem",
                color: "var(--ng-text-secondary)",
                display: "block",
                marginBottom: "0.25rem",
              }}
            >
              Email
            </label>
            <div style={{ fontWeight: "500" }}>{customer.email}</div>
          </div>

          {customer.phone && (
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  color: "var(--ng-text-secondary)",
                  display: "block",
                  marginBottom: "0.25rem",
                }}
              >
                Telefono
              </label>
              <div style={{ fontWeight: "500" }}>{customer.phone}</div>
            </div>
          )}
        </div>
      </div>

      {/* Acciones */}
      <div className="portal-card" style={{ marginTop: "1rem" }}>
        <div className="portal-card-header">
          <span className="portal-card-title">Cuenta</span>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "0.875rem",
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            border: "none",
            borderRadius: "0.75rem",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Cerrar sesion
        </button>
      </div>

      {/* Info de contacto del gym */}
      <div
        className="portal-card"
        style={{ marginTop: "1rem", backgroundColor: "var(--ng-surface-alt)" }}
      >
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--ng-text-secondary)",
            textAlign: "center",
          }}
        >
          Para modificar tu informacion, contacta con nosotros directamente.
        </p>
      </div>
    </div>
  );
}
