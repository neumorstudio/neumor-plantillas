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

  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  const filteredBookings = bookings.filter((booking) => {
    const matchesFilter = filter === "all" || booking.status === filter;
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.customer_phone?.includes(searchTerm) ?? false) ||
      (booking.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesFilter && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
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

    const payload = {
      customer_name: customerName,
      customer_phone: customerPhone,
      guests: bookingEdit.guests,
      notes: bookingEdit.notes?.trim() || null,
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
                  <th>Personas</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id} className={isPending ? "opacity-50" : ""}>
                    <td className="font-medium">{booking.customer_name}</td>
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
                    <td>{booking.guests}</td>
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

      {/* 🔹 Modal de edición */}
      {bookingEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Editar reserva</h2>
            {actionError && (
              <div className="mb-3 p-2 rounded-lg bg-red-100 text-red-700 text-sm">
                {actionError}
              </div>
            )}

            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Nombre"
              value={bookingEdit.customer_name}
              onChange={(e) =>
                setBookingEdit({ ...bookingEdit, customer_name: e.target.value })
              }
            />

            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Teléfono"
              value={bookingEdit.customer_phone ?? ""}
              onChange={(e) =>
                setBookingEdit({ ...bookingEdit, customer_phone: e.target.value })
              }
            />

            <input
              type="number"
              className="w-full border p-2 rounded mb-2"
              placeholder="Personas"
              value={bookingEdit.guests}
              onChange={(e) =>
                setBookingEdit({ ...bookingEdit, guests: Number(e.target.value) })
              }
            />

            <textarea
              className="w-full border p-2 rounded mb-2"
              placeholder="Notas"
              value={bookingEdit.notes ?? ""}
              onChange={(e) =>
                setBookingEdit({ ...bookingEdit, notes: e.target.value })
              }
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="neumor-btn"
                onClick={() => {
                  setActionError(null);
                  setBookingEdit(null);
                }}
              >
                Cancelar
              </button>

              <button
                className="neumor-btn"
                onClick={handleBookingSave}
                disabled={isPending}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
