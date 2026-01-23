// Componentes de tablas para el dashboard dinámico

// Helpers
function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getBookingStatusBadge(status: string) {
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
}

function getJobStatusBadge(status: string) {
  switch (status) {
    case "in_progress":
      return { class: "badge-confirmed", label: "En curso" };
    case "waiting_material":
      return { class: "badge-pending", label: "Esperando material" };
    case "completed":
      return { class: "badge-confirmed", label: "Finalizado" };
    case "cancelled":
      return { class: "badge-cancelled", label: "Cancelado" };
    default:
      return { class: "badge-pending", label: "Pendiente" };
  }
}

function getQuoteStatusBadge(status: string) {
  switch (status) {
    case "contacted":
      return { class: "badge-pending", label: "Contactado" };
    case "converted":
      return { class: "badge-confirmed", label: "Aceptado" };
    case "lost":
      return { class: "badge-cancelled", label: "Rechazado" };
    default:
      return { class: "badge-pending", label: "Pendiente" };
  }
}

// Tipo para reservas
interface Booking {
  id: string;
  customer_name: string;
  booking_date: string;
  booking_time: string | null;
  guests: number | null;
  status: string;
}

// Tipo para trabajos
interface Job {
  id: string;
  client_name: string;
  address: string | null;
  status: string;
  estimated_end_date: string | null;
  total_amount: number | null;
}

// Tipo para presupuestos (leads con lead_type = quote)
interface Quote {
  id: string;
  name: string;
  message: string | null;
  status: string;
  details: { amount?: number; description?: string } | null;
  created_at: string;
}

// Widget: Tabla de reservas recientes
export function RecentBookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
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

      {bookings.length === 0 ? (
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
              {bookings.map((booking) => {
                const badge = getBookingStatusBadge(booking.status);
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
  );
}

// Widget: Tabla de trabajos recientes (para repairs)
export function RecentJobsTable({ jobs }: { jobs: Job[] }) {
  return (
    <div className="neumor-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Trabajos en Curso</h2>
        <a
          href="/dashboard/trabajos"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Ver todos
        </a>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <p>No hay trabajos en curso</p>
          <p className="text-sm mt-2">
            Los trabajos apareceran aqui cuando conviertas presupuestos
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Direccion</th>
                <th>Estado</th>
                <th>Fecha estimada</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const badge = getJobStatusBadge(job.status);
                return (
                  <tr key={job.id}>
                    <td className="font-medium">{job.client_name}</td>
                    <td className="max-w-[200px] truncate">{job.address || "-"}</td>
                    <td>
                      <span className={`badge ${badge.class}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td>{job.estimated_end_date ? formatDate(job.estimated_end_date) : "-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Widget: Tabla de presupuestos recientes (para repairs)
export function RecentQuotesTable({ quotes }: { quotes: Quote[] }) {
  return (
    <div className="neumor-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Presupuestos Recientes</h2>
        <a
          href="/dashboard/presupuestos"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Ver todos
        </a>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <p>No hay presupuestos todavia</p>
          <p className="text-sm mt-2">
            Los presupuestos apareceran aqui cuando recibas solicitudes
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Descripcion</th>
                <th>Importe</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => {
                const badge = getQuoteStatusBadge(quote.status);
                const amount = quote.details?.amount;
                return (
                  <tr key={quote.id}>
                    <td className="font-medium">{quote.name}</td>
                    <td className="max-w-[200px] truncate">
                      {quote.details?.description || quote.message || "-"}
                    </td>
                    <td>
                      {amount ? `${amount.toLocaleString("es-ES")} €` : "-"}
                    </td>
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
  );
}

// ============================================
// FITNESS / ENTRENADOR PERSONAL TABLES
// ============================================

// Tipo para sesiones - customers y trainer_services pueden ser array o objeto según el query
interface Session {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  session_notes: string | null;
  customers?: { id: string; name: string } | { id: string; name: string }[] | null;
  trainer_services?: { id: string; name: string } | { id: string; name: string }[] | null;
}

function getSessionStatusBadge(status: string) {
  switch (status) {
    case "confirmed":
      return { class: "badge-confirmed", label: "Confirmada" };
    case "completed":
      return { class: "badge-confirmed", label: "Completada" };
    case "cancelled":
      return { class: "badge-cancelled", label: "Cancelada" };
    case "no_show":
      return { class: "badge-cancelled", label: "No asistio" };
    default:
      return { class: "badge-pending", label: "Pendiente" };
  }
}

// Widget: Tabla de sesiones recientes (para fitness)
export function RecentSessionsTable({ sessions }: { sessions: Session[] }) {
  return (
    <div className="neumor-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Sesiones Recientes</h2>
        <a
          href="/dashboard/sesiones"
          className="text-sm text-[var(--accent)] hover:underline"
        >
          Ver todas
        </a>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <p>No hay sesiones todavia</p>
          <p className="text-sm mt-2">
            Las sesiones apareceran aqui cuando programes entrenamientos
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
                <th>Servicio</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => {
                const badge = getSessionStatusBadge(session.status);
                // Handle both array and object for Supabase relations
                const customer = Array.isArray(session.customers) ? session.customers[0] : session.customers;
                const service = Array.isArray(session.trainer_services) ? session.trainer_services[0] : session.trainer_services;
                return (
                  <tr key={session.id}>
                    <td className="font-medium">
                      {customer?.name || "Cliente"}
                    </td>
                    <td>{formatDate(session.booking_date)}</td>
                    <td>{session.booking_time?.slice(0, 5) || "-"}</td>
                    <td>{service?.name || "-"}</td>
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
  );
}
