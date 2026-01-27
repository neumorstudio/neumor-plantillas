import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

interface Package {
  id: string;
  package_name: string;
  sessions_total: number;
  sessions_remaining: number;
  status: string;
  expires_at: string | null;
  created_at: string;
}

async function getPackagesData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: packages } = await supabase
    .from("customer_packages")
    .select("id, package_name, sessions_total, sessions_remaining, status, expires_at, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return packages || [];
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const statusMap: Record<string, { class: string; label: string }> = {
    active: { class: "portal-badge-active", label: "Activo" },
    expired: { class: "portal-badge-expired", label: "Expirado" },
    used: { class: "portal-badge-completed", label: "Agotado" },
  };
  return statusMap[status] || { class: "portal-badge-pending", label: status };
}

export default async function PaquetesPage() {
  const supabase = await createClient();
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const businessType = headersList.get("x-business-type") || "restaurant";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !tenantId) {
    redirect("/mi-cuenta");
  }

  // Only gym has packages page
  if (businessType !== "gym") {
    redirect("/mi-cuenta/inicio");
  }

  const packages = await getPackagesData(tenantId, user.id);

  if (!packages) {
    return (
      <div className="portal-empty">
        <p className="portal-empty-title">Error al cargar datos</p>
        <p className="portal-empty-text">No se pudo encontrar tu perfil.</p>
      </div>
    );
  }

  const activePackages = packages.filter((p: Package) => p.status === "active");
  const otherPackages = packages.filter((p: Package) => p.status !== "active");

  return (
    <div className="gym-theme">
      <h1 className="portal-page-title">Mis Paquetes</h1>

      {/* Paquetes activos */}
      <div className="portal-section-header">
        <h2 className="portal-section-title">Activos</h2>
        <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
          {activePackages.length} paquetes
        </span>
      </div>

      {activePackages.length > 0 ? (
        <div className="portal-list" style={{ marginBottom: "2rem" }}>
          {activePackages.map((pkg: Package) => {
            const badge = getStatusBadge(pkg.status);
            const progress = pkg.sessions_total > 0
              ? ((pkg.sessions_total - pkg.sessions_remaining) / pkg.sessions_total) * 100
              : 0;

            return (
              <div key={pkg.id} className="portal-card">
                <div className="portal-card-header">
                  <span className="portal-list-item-title">{pkg.package_name}</span>
                  <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                </div>

                <div style={{ marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.875rem", color: "var(--ng-text-secondary)" }}>
                      Sesiones restantes
                    </span>
                    <span style={{ fontWeight: "600" }}>
                      {pkg.sessions_remaining} / {pkg.sessions_total}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      backgroundColor: "var(--ng-border)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        backgroundColor: "var(--ng-accent)",
                        borderRadius: "4px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {pkg.expires_at && (
                  <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--ng-text-secondary)" }}>
                    Expira: {formatDate(pkg.expires_at)}
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
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <p className="portal-empty-title">Sin paquetes activos</p>
          <p className="portal-empty-text">
            Contacta con nosotros para adquirir un paquete de sesiones.
          </p>
        </div>
      )}

      {/* Historial */}
      {otherPackages.length > 0 && (
        <>
          <div className="portal-section-header">
            <h2 className="portal-section-title">Historial</h2>
          </div>
          <div className="portal-list">
            {otherPackages.map((pkg: Package) => {
              const badge = getStatusBadge(pkg.status);
              return (
                <div key={pkg.id} className="portal-list-item" style={{ opacity: 0.7 }}>
                  <div className="portal-list-item-header">
                    <span className="portal-list-item-title">{pkg.package_name}</span>
                    <span className={`portal-badge ${badge.class}`}>{badge.label}</span>
                  </div>
                  <div className="portal-list-item-meta">
                    {pkg.sessions_total - pkg.sessions_remaining} de {pkg.sessions_total} sesiones usadas
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
