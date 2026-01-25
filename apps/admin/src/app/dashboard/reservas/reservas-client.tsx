"use client";

import { useEffect, useState, useTransition } from "react";
import { updateBooking, updateBookingStatus } from "@/lib/actions";
import { Pencil } from "lucide-react";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  booking_date: string;
  booking_time: string | null;
  guests: number;
  notes: string | null;
  status: string;
  created_at: string;
  services?: {
    name: string;
    price_cents?: number;
    duration_minutes?: number;
  }[] | null;
  total_price_cents?: number | null;
  total_duration_minutes?: number | null;
}

type FilterStatus = "all" | "pending" | "confirmed" | "cancelled" | "completed";

export default function ReservasClient({
  initialBookings,
}: {
  initialBookings: Booking[];
}) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);

  // 🔹 NUEVO: estado para la reserva que se está editando
  const [bookingEdit, setBookingEdit] = useState<Booking | null>(null);
  const [servicesText, setServicesText] = useState("");

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  const parseHour = (value: string | null) => {
    if (!value) return null;
    const parts = value.split(":").map(Number);
    return Number.isFinite(parts[0]) ? (parts[0] as number) : null;
  };

  const getTimeBucket = (bookingTime: string | null) => {
    const hour = parseHour(bookingTime);
    if (hour === null) return "Sin hora";
    if (hour < 13) return "Manana";
    if (hour < 20) return "Tarde";
    return "Noche";
  };

  const filteredBookings = bookings
    .filter((booking) => {
      const matchesFilter = filter === "all" || booking.status === filter;
      const matchesSearch =
        booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.customer_phone?.includes(searchTerm) ?? false) ||
        (booking.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const recentIds = new Set(filteredBookings.slice(0, 3).map((booking) => booking.id));

  const groupedBookings = [
    { label: "Manana", items: filteredBookings.filter((b) => getTimeBucket(b.booking_time) === "Manana") },
    { label: "Tarde", items: filteredBookings.filter((b) => getTimeBucket(b.booking_time) === "Tarde") },
    { label: "Noche", items: filteredBookings.filter((b) => getTimeBucket(b.booking_time) === "Noche") },
    { label: "Sin hora", items: filteredBookings.filter((b) => getTimeBucket(b.booking_time) === "Sin hora") },
  ].filter((group) => group.items.length > 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatPrice = (cents?: number | null) => {
    if (!Number.isFinite(cents)) return "-";
    return `${(Number(cents) / 100).toFixed(2)} EUR`;
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateBookingStatus(
        bookingId,
        newStatus as "pending" | "confirmed" | "cancelled" | "completed"
      );
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status: newStatus } : booking
        )
      );
    });
  };

  const handleBookingSave = async () => {
    if (!bookingEdit) return;
    setActionError(null);

    const customerName = bookingEdit.customer_name.trim();
    const customerPhone = bookingEdit.customer_phone?.trim() || "";

    const servicesList = servicesText
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((name) => {
        const existing = bookingEdit.services?.find((service) => service.name === name);
        return existing || { name };
      });

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      guests: bookingEdit.guests,
      notes: bookingEdit.notes?.trim() || null,
      services: servicesList.length ? servicesList : null,
    };

    if (!customerName || !customerPhone) {
      setActionError("Nombre y telefono son obligatorios.");
      return;
    }

    if (!Number.isFinite(payload.guests) || payload.guests <= 0) {
      setActionError("El numero de personas debe ser mayor que 0.");
      return;
    }

    startTransition(async () => {
      try {
        await updateBooking(bookingEdit.id, payload);
        setBookings((prev) =>
          prev.map((booking) =>
            booking.id === bookingEdit.id ? { ...booking, ...payload } : booking
          )
        );
        setBookingEdit(null);
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : "No se pudo actualizar la reserva."
        );
      }
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <span className="badge badge-confirmed">Confirmada</span>;
      case "pending":
        return <span className="badge badge-pending">Pendiente</span>;
      case "cancelled":
        return <span className="badge badge-cancelled">Cancelada</span>;
      case "completed":
        return <span className="badge badge-confirmed">Completada</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Reservas</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona las reservas de tu negocio
        </p>
      </div>

      {/* Error message */}
      {actionError && !bookingEdit && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="neumor-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por nombre, telefono o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="neumor-input w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "pending", "confirmed", "cancelled"] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`neumor-btn text-sm ${filter === status ? "neumor-btn-accent" : ""
                    }`}
                >
                  {status === "all" && "Todas"}
                  {status === "pending" && "Pendientes"}
                  {status === "confirmed" && "Confirmadas"}
                  {status === "cancelled" && "Canceladas"}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      <div className="neumor-card p-6">
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="w-16 h-16 mx-auto mb-4 text-[var(--text-secondary)]"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No hay reservas</h3>
            <p className="text-[var(--text-secondary)]">
              {searchTerm || filter !== "all"
                ? "No se encontraron reservas con los filtros seleccionados."
                : "Las reservas apareceran aqui cuando los clientes reserven."}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Fecha y Hora</th>
                  <th>Franja</th>
                  <th>Servicios</th>
                  <th>Precio</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className={isPending ? "opacity-50" : ""}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>{booking.customer_name}</span>
                        {recentIds.has(booking.id) && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full neumor-inset">
                            Nueva
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div>{booking.customer_phone || "-"}</div>
                        <div className="text-[var(--text-secondary)]">
                          {booking.customer_email || "-"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm">
                        <div>{formatDate(booking.booking_date)}</div>
                        <div className="text-[var(--text-secondary)]">
                          {booking.booking_time || "-"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-semibold px-3 py-1 rounded-full neumor-inset">
                        {getTimeBucket(booking.booking_time)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="text-sm text-[var(--text-secondary)] max-w-[180px] truncate block"
                        title={booking.services?.map((service) => service.name).join(", ") || ""}
                      >
                        {booking.services?.length
                          ? booking.services.map((service) => service.name).join(", ")
                          : "-"}
                      </span>
                    </td>
                    <td>{formatPrice(booking.total_price_cents)}</td>
                    <td>
                      <span
                        className="text-sm text-[var(--text-secondary)] max-w-[150px] truncate block"
                        title={booking.notes || ""}
                      >
                        {booking.notes || "-"}
                      </span>
                    </td>
                    <td>{getStatusBadge(booking.status)}</td>
                    <td>
                      <div className="flex gap-2">
                        {booking.status === "pending" && (
                          <>
                            <button
                              className="neumor-btn text-xs px-3 py-1"
                              onClick={() => handleStatusChange(booking.id, "confirmed")}
                              disabled={isPending}
                            >
                              Confirmar
                            </button>
                            <button
                              className="neumor-btn text-xs px-3 py-1"
                              onClick={() => handleStatusChange(booking.id, "cancelled")}
                              disabled={isPending}
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                        {booking.status === "confirmed" && (
                          <button
                            className="neumor-btn text-xs px-3 py-1"
                            onClick={() => handleStatusChange(booking.id, "completed")}
                            disabled={isPending}
                          >
                            Completar
                          </button>
                        )}

                        {/* ✏️ Botón Editar */}
                        <button
                          className="neumor-btn text-xs px-3 py-1 flex items-center gap-1"
                          onClick={() => {
                            setActionError(null);
                            setBookingEdit(booking);
                            setServicesText(
                              booking.services?.map((service) => service.name).join(", ") || ""
                            );
                          }}
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de edicion */}
      {bookingEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="neumor-card p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-heading font-semibold mb-6 text-[var(--text-primary)]">
              Editar reserva
            </h2>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {actionError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Nombre del cliente
                </label>
                <input
                  className="neumor-input w-full"
                  placeholder="Nombre completo"
                  value={bookingEdit.customer_name}
                  onChange={(e) =>
                    setBookingEdit({ ...bookingEdit, customer_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Telefono
                </label>
                <input
                  className="neumor-input w-full"
                  placeholder="+34 600 000 000"
                  value={bookingEdit.customer_phone ?? ""}
                  onChange={(e) =>
                    setBookingEdit({ ...bookingEdit, customer_phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Servicios
                </label>
                <input
                  className="neumor-input w-full"
                  placeholder="Corte, Color, Peinado"
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Notas
                </label>
                <textarea
                  className="neumor-input w-full min-h-[80px] resize-none"
                  placeholder="Notas adicionales..."
                  value={bookingEdit.notes ?? ""}
                  onChange={(e) =>
                    setBookingEdit({ ...bookingEdit, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="neumor-btn px-5"
                onClick={() => {
                  setActionError(null);
                  setBookingEdit(null);
                }}
              >
                Cancelar
              </button>

              <button
                className="neumor-btn neumor-btn-accent px-5"
                onClick={handleBookingSave}
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
