"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteBooking, updateBooking } from "@/lib/actions";
import { ConfirmDialog } from "@/components/mobile";

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

function getBookingDateTime(booking: Booking) {
  const time = booking.booking_time ?? "00:00";
  const date = new Date(`${booking.booking_date}T${time}`);
  if (Number.isNaN(date.getTime())) {
    return new Date(booking.booking_date);
  }
  return date;
}

function parseLegacyNotes(notes?: string | null) {
  if (!notes) return { servicesFromNotes: "", cleanNotes: "" };
  if (!notes.includes("Servicio:")) {
    return { servicesFromNotes: "", cleanNotes: notes };
  }
  const parts = notes.split("|").map((part) => part.trim());
  const servicePart = parts.find((part) => part.startsWith("Servicio:"));
  const notesPart = parts.find((part) => part.startsWith("Notas:"));
  return {
    servicesFromNotes: servicePart ? servicePart.replace("Servicio:", "").trim() : "",
    cleanNotes: notesPart ? notesPart.replace("Notas:", "").trim() : "",
  };
}

function getBookingPriceText(booking: Booking) {
  if (Number.isFinite(booking.total_price_cents) && Number(booking.total_price_cents) > 0) {
    return (Number(booking.total_price_cents) / 100).toFixed(2);
  }
  return "";
}

// Tipo para reservas
interface Booking {
  id: string;
  customer_name: string;
  customer_phone?: string | null;
  booking_date: string;
  booking_time: string | null;
  guests: number | null;
  status: string;
  notes?: string | null;
  professional?: { name: string } | null;
  services?: { name: string; price_cents?: number; duration_minutes?: number }[] | null;
  total_price_cents?: number | null;
  total_duration_minutes?: number | null;
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
export function RecentBookingsTable({
  bookings,
  variant = "default",
}: {
  bookings: Booking[];
  variant?: "default" | "salon";
}) {
  const [activeFilter, setActiveFilter] = useState<"upcoming" | "cancelled">(
    "upcoming",
  );
  const [sortOrder, setSortOrder] = useState<"date_asc" | "date_desc">("date_asc");
  const [localBookings, setLocalBookings] = useState<Booking[]>(bookings);
  const [bookingEdit, setBookingEdit] = useState<Booking | null>(null);
  const [servicesText, setServicesText] = useState("");
  const [priceText, setPriceText] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [savingBooking, setSavingBooking] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null);

  useEffect(() => {
    setLocalBookings(bookings);
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    return localBookings.filter((booking) => {
      const bookingDate = getBookingDateTime(booking);
      if (activeFilter === "cancelled") {
        return booking.status === "cancelled";
      }
      return booking.status !== "cancelled" && bookingDate >= now;
    });
  }, [localBookings, activeFilter]);

  const sortedBookings = useMemo(() => {
    const sorted = [...filteredBookings].sort((a, b) => {
      const aDate = getBookingDateTime(a).getTime();
      const bDate = getBookingDateTime(b).getTime();
      return sortOrder === "date_asc" ? aDate - bDate : bDate - aDate;
    });
    return sorted;
  }, [filteredBookings, sortOrder]);

  const emptyMessage =
    activeFilter === "cancelled"
      ? variant === "salon"
        ? "No hay citas canceladas"
        : "No hay reservas canceladas"
      : variant === "salon"
        ? "No hay proximas citas"
        : "No hay proximas reservas";

  const isSalon = variant === "salon";

  const openBookingModal = (booking: Booking) => {
    const legacy = parseLegacyNotes(booking.notes);
    const servicesFromBooking =
      booking.services?.map((service) => service.name).join(", ") ||
      legacy.servicesFromNotes ||
      "";
    setBookingEdit({ ...booking, notes: legacy.cleanNotes });
    setServicesText(servicesFromBooking);
    setPriceText(getBookingPriceText(booking));
    setBookingError(null);
  };

  const handleBookingSave = async () => {
    if (!bookingEdit) return;
    setSavingBooking(true);
    setBookingError(null);

    try {
      const updatePayload: Record<string, unknown> = {
        customer_name: bookingEdit.customer_name.trim(),
        customer_phone: bookingEdit.customer_phone?.trim() || null,
        booking_time: bookingEdit.booking_time || null,
        notes: bookingEdit.notes?.trim() || null,
      };

      let servicesList: { name: string }[] = [];
      let totalPriceCents: number | null = bookingEdit.total_price_cents ?? null;

      if (isSalon) {
        servicesList = servicesText
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((name) => ({ name }));

        const parsedPrice = Number(priceText.replace(",", "."));
        totalPriceCents = Number.isFinite(parsedPrice)
          ? Math.round(parsedPrice * 100)
          : null;

        updatePayload.services = servicesList.length ? servicesList : null;
        updatePayload.total_price_cents = totalPriceCents;
      }

      await updateBooking(bookingEdit.id, updatePayload);

      setLocalBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingEdit.id
            ? {
                ...booking,
                customer_name: bookingEdit.customer_name,
                customer_phone: bookingEdit.customer_phone,
                booking_time: bookingEdit.booking_time,
                notes: bookingEdit.notes,
                services: isSalon ? (servicesList.length ? servicesList : null) : booking.services,
                total_price_cents: isSalon ? totalPriceCents : booking.total_price_cents,
              }
            : booking
        )
      );

      setBookingEdit(null);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "No se pudo guardar.");
    } finally {
      setSavingBooking(false);
    }
  };

  const handleBookingDelete = async (bookingId: string) => {
    setBookingError(null);
    setSavingBooking(true);
    try {
      await deleteBooking(bookingId);
      setLocalBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
      setBookingEdit(null);
      setDeleteConfirm(null);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "No se pudo eliminar.");
    } finally {
      setSavingBooking(false);
    }
  };

  return (
    <div className="neumor-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">
          {variant === "salon" ? "Citas" : "Reservas"}
        </h2>
        {variant !== "salon" && (
          <a
            href="/dashboard/reservas"
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Ver todas
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="inline-flex rounded-full bg-[var(--neumor-bg)] p-1 shadow-[inset_2px_2px_6px_var(--shadow-dark),inset_-2px_-2px_6px_var(--shadow-light)]">
          {[
            { key: "upcoming", label: "Proximas" },
            { key: "cancelled", label: "Canceladas" },
          ].map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key as "upcoming" | "cancelled")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${
                  isActive
                    ? "bg-[var(--accent)] text-white shadow-[0_6px_14px_rgba(var(--accent-rgb),0.25)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          Ordenar por fecha
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value as "date_asc" | "date_desc")}
            className="rounded-full border border-transparent bg-[var(--neumor-bg)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)] shadow-[inset_2px_2px_6px_var(--shadow-dark),inset_-2px_-2px_6px_var(--shadow-light)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            <option value="date_asc">Mas proximas</option>
            <option value="date_desc">Mas recientes</option>
          </select>
        </label>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <p>{variant === "salon" ? "No hay citas todavia" : "No hay reservas todavia"}</p>
          <p className="text-sm mt-2">
            {variant === "salon"
              ? "Las citas apareceran aqui cuando los clientes reserven"
              : "Las reservas apareceran aqui cuando los clientes reserven"}
          </p>
        </div>
      ) : sortedBookings.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <p>{emptyMessage}</p>
          <p className="text-sm mt-2">
            {activeFilter === "cancelled"
              ? "No hay registros en esta vista"
              : "Ajusta el filtro para ver otras citas"}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                {variant === "salon" ? <th>Cita</th> : <th>Fecha</th>}
                {variant === "salon" ? <th>Estado</th> : <th>Hora</th>}
                {variant === "salon" ? (
                  <th className="text-right">Precio</th>
                ) : (
                  <>
                    <th>Personas</th>
                    <th>Estado</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedBookings.map((booking) => {
                const serviceNames = booking.services?.map((s) => s.name).join(", ") || "-";
                const price = booking.total_price_cents
                  ? `${(booking.total_price_cents / 100).toFixed(2)} €`
                  : "-";

                if (variant === "salon") {
                  return (
                    <tr
                      key={booking.id}
                      role="button"
                      tabIndex={0}
                      className={`table-row-action cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                        bookingEdit?.id === booking.id ? "is-selected" : ""
                      }`}
                      onClick={() => openBookingModal(booking)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openBookingModal(booking);
                        }
                      }}
                    >
                      <td data-label="Cliente" className="is-stacked">
                        <span className="font-medium">{booking.customer_name}</span>
                        <span
                          className="mt-1 block text-xs text-[var(--text-secondary)] line-clamp-1"
                          title={serviceNames}
                        >
                          {serviceNames}
                        </span>
                      </td>
                      <td data-label="Cita" className="is-stacked">
                        <span className="block text-sm">{formatDate(booking.booking_date)}</span>
                        <span className="block text-xs text-[var(--text-secondary)]">
                          {booking.booking_time || "-"}
                        </span>
                      </td>
                      <td data-label="Estado">
                        <span className={`badge ${getBookingStatusBadge(booking.status).class}`}>
                          {getBookingStatusBadge(booking.status).label}
                        </span>
                      </td>
                      <td data-label="Precio" className="text-right">
                        <span className="text-sm font-semibold">{price}</span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={booking.id}
                    role="button"
                    tabIndex={0}
                    className={`table-row-action cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                      bookingEdit?.id === booking.id ? "is-selected" : ""
                    }`}
                    onClick={() => openBookingModal(booking)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openBookingModal(booking);
                      }
                    }}
                  >
                    <td data-label="Cliente" className="font-medium">
                      {booking.customer_name}
                    </td>
                    <td data-label="Fecha">{formatDate(booking.booking_date)}</td>
                    <td data-label="Hora">{booking.booking_time || "-"}</td>
                    <td data-label="Personas">{booking.guests || 1}</td>
                    <td data-label="Estado">
                      <span className={`badge ${getBookingStatusBadge(booking.status).class}`}>
                        {getBookingStatusBadge(booking.status).label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {bookingEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="neumor-card p-4 sm:p-6 w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-hidden rounded-t-3xl sm:rounded-2xl">
            <h2 className="text-lg sm:text-xl font-heading font-semibold mb-4 sm:mb-6 text-[var(--text-primary)]">
              Editar {variant === "salon" ? "cita" : "reserva"}
            </h2>

            {bookingError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {bookingError}
              </div>
            )}

            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Nombre del cliente
                </label>
                <input
                  className="neumor-input w-full text-base py-2.5"
                  value={bookingEdit.customer_name}
                  onChange={(event) =>
                    setBookingEdit({ ...bookingEdit, customer_name: event.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Telefono
                  </label>
                  <input
                    className="neumor-input w-full text-base py-2.5"
                    type="tel"
                    value={bookingEdit.customer_phone ?? ""}
                    onChange={(event) =>
                      setBookingEdit({ ...bookingEdit, customer_phone: event.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Hora
                  </label>
                  <input
                    type="time"
                    className="neumor-input w-full text-base py-2.5"
                    value={bookingEdit.booking_time ?? ""}
                    onChange={(event) =>
                      setBookingEdit({ ...bookingEdit, booking_time: event.target.value })
                    }
                  />
                </div>
              </div>

              {isSalon && (
                <>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Servicios
                    </label>
                    <input
                      className="neumor-input w-full text-base py-2.5"
                      value={servicesText}
                      onChange={(event) => setServicesText(event.target.value)}
                      placeholder="Corte, Color, Peinado"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Precio total (€)
                    </label>
                    <input
                      className="neumor-input w-full text-base py-2.5"
                      inputMode="decimal"
                      value={priceText}
                      onChange={(event) => setPriceText(event.target.value)}
                      placeholder="25.00"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Notas
                </label>
                <textarea
                  className="neumor-input w-full min-h-[60px] sm:min-h-[80px] resize-none text-base py-2.5"
                  value={bookingEdit.notes ?? ""}
                  onChange={(event) =>
                    setBookingEdit({ ...bookingEdit, notes: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:flex-wrap sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                className="neumor-btn w-full sm:w-auto px-5 py-3 sm:py-2 text-red-600 active:scale-[0.98]"
                onClick={() => setDeleteConfirm(bookingEdit)}
                disabled={savingBooking}
              >
                Eliminar {variant === "salon" ? "cita" : "reserva"}
              </button>
              <button
                className="neumor-btn w-full sm:w-auto px-5 py-3 sm:py-2 active:scale-[0.98]"
                onClick={() => {
                  setBookingEdit(null);
                  setBookingError(null);
                }}
              >
                Cerrar
              </button>

              <button
                className="neumor-btn neumor-btn-accent w-full sm:w-auto px-5 py-3 sm:py-2 active:scale-[0.98]"
                onClick={handleBookingSave}
                disabled={savingBooking}
              >
                {savingBooking ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteConfirm)}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            void handleBookingDelete(deleteConfirm.id);
          }
        }}
        title={`Eliminar ${variant === "salon" ? "cita" : "reserva"}`}
        description={
          deleteConfirm
            ? `Se eliminara la ${variant === "salon" ? "cita" : "reserva"} de ${deleteConfirm.customer_name}.`
            : undefined
        }
        confirmText="Eliminar"
        cancelText="Cerrar"
        variant="danger"
        isLoading={savingBooking}
      />
    </div>
  );
}

interface ProfessionalRevenueRow {
  name: string;
  total: number;
  count: number;
}

export function ProfessionalRevenueTable({
  data,
}: {
  data: { today: ProfessionalRevenueRow[]; week: ProfessionalRevenueRow[] } | null;
}) {
  const [activeRange, setActiveRange] = useState<"today" | "week">("week");
  const rows = data?.[activeRange] ?? [];
  const [activeName, setActiveName] = useState<string>(rows[0]?.name || "");

  useEffect(() => {
    if (!rows.length) return;
    if (!rows.find((row) => row.name === activeName)) {
      const top = [...rows].sort((a, b) => b.total - a.total)[0];
      setActiveName(top?.name || rows[0].name);
    }
  }, [rows, activeName]);

  const selected = rows.find((row) => row.name === activeName) || rows[0];
  const totalRevenue = rows.reduce((sum, row) => sum + row.total, 0);
  const averageTicket = selected && selected.count > 0 ? selected.total / selected.count : 0;
  const share = totalRevenue > 0 ? (selected?.total || 0) / totalRevenue : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div className="neumor-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Ingresos por profesional</h2>
        <span className="text-sm text-[var(--text-secondary)]">
          {activeRange === "today" ? "Hoy" : "Ultimos 7 dias"}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          <p>No hay ingresos registrados todavia</p>
          <p className="text-sm mt-2">
            Se mostraran cuando las citas esten completadas
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-[var(--neumor-bg)] p-1 shadow-[inset_2px_2px_6px_var(--shadow-dark),inset_-2px_-2px_6px_var(--shadow-light)] overflow-x-auto max-w-full">
              <div className="flex gap-1 pr-2">
                {rows.map((row) => {
                  const isActive = row.name === activeName;
                  return (
                    <button
                      key={row.name}
                      type="button"
                      onClick={() => setActiveName(row.name)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition whitespace-nowrap ${
                        isActive
                          ? "bg-[var(--accent)] text-white shadow-[0_6px_14px_rgba(var(--accent-rgb),0.2)]"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {row.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="inline-flex rounded-full bg-[var(--neumor-bg)] p-1 shadow-[inset_2px_2px_6px_var(--shadow-dark),inset_-2px_-2px_6px_var(--shadow-light)]">
              {[
                { key: "today", label: "Hoy" },
                { key: "week", label: "7 dias" },
              ].map((range) => {
                const isActive = activeRange === range.key;
                return (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => setActiveRange(range.key as "today" | "week")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${
                      isActive
                        ? "bg-[var(--accent)] text-white shadow-[0_6px_14px_rgba(var(--accent-rgb),0.2)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>
          </div>

          {selected && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="neumor-inset-sm p-3">
                <p className="text-xs text-[var(--text-secondary)]">Total</p>
                <p className="text-lg font-semibold">{formatCurrency(selected.total)}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {Math.round(share * 100)}% del total
                </p>
              </div>
              <div className="neumor-inset-sm p-3">
                <p className="text-xs text-[var(--text-secondary)]">Citas completadas</p>
                <p className="text-lg font-semibold">{selected.count}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {selected.count === 1 ? "1 cita" : `${selected.count} citas`}
                </p>
              </div>
              <div className="neumor-inset-sm p-3">
                <p className="text-xs text-[var(--text-secondary)]">Ticket medio</p>
                <p className="text-lg font-semibold">{formatCurrency(averageTicket)}</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">Por cita</p>
              </div>
            </div>
          )}
        </>
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
