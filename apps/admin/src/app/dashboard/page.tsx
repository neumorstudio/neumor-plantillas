// Dashboard Overview - Server Component with real Supabase data
import { getDashboardStats, getRecentBookings } from "@/lib/data";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const recentBookings = await getRecentBookings(5);

  const statCards = [
    {
      label: "Reservas este mes",
      value: stats.bookingsThisMonth.toString(),
      change: "",
      positive: true,
    },
    {
      label: "Leads nuevos",
      value: stats.newLeads.toString(),
      change: "",
      positive: true,
    },
    {
      label: "Reservas pendientes",
      value: stats.pendingBookings.toString(),
      change: "",
      positive: stats.pendingBookings > 0,
    },
  ];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return { class: "badge-confirmed", label: "Confirmada" };
      case "cancelled":
        return { class: "badge-cancelled", label: "Cancelada" };
      case "completed":
        return { class: "badge-confirmed", label: "Completada" };
      default:
        return { class: "badge-pending", label: "Pendiente" };
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">
          Resumen de tu actividad y automatizaciones
        </p>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-grid mb-8">
        {statCards.map((stat, index) => (
          <div key={index} className="neumor-card p-6 stat-card">
            <span className="stat-value">{stat.value}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Recent Reservations */}
      <div className="neumor-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Reservas Recientes</h2>
          <a
            href="/dashboard/reservas"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Ver todas
          </a>
        </div>

        {recentBookings.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            <p>No hay reservas todavia</p>
            <p className="text-sm mt-2">
              Las reservas apareceran aqui cuando los clientes reserven
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Personas</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => {
                  const badge = getStatusBadge(booking.status);
                  return (
                    <tr key={booking.id}>
                      <td className="font-medium">{booking.customer_name}</td>
                      <td>{formatDate(booking.booking_date)}</td>
                      <td>{booking.booking_time || "-"}</td>
                      <td>{booking.guests || 1}</td>
                      <td>
                        <span className={`badge ${badge.class}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Panels */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="neumor-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            Estado de Automatizaciones
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">
                Notificaciones WhatsApp
              </span>
              <span className="badge badge-pending">Pendiente config</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">
                Confirmacion por Email
              </span>
              <span className="badge badge-pending">Pendiente config</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">
                Recordatorio 24h
              </span>
              <span className="badge badge-pending">Pendiente config</span>
            </div>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-4">
            Configura tus automatizaciones en la seccion de Configuracion
          </p>
        </div>

        <div className="neumor-card p-6">
          <h3 className="text-lg font-semibold mb-4">Guia Rapida</h3>
          <div className="space-y-3">
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                1
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Revisa las reservas entrantes en la seccion Reservas
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                2
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Gestiona contactos y consultas en la seccion Leads
              </p>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                3
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                Configura notificaciones automaticas en Configuracion
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
