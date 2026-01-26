"use client";

import { useEffect, useState, useTransition } from "react";
import { updateBooking, updateBookingStatus } from "@/lib/actions";
import { Pencil, Calendar, Phone, User, Clock, FileText, DollarSign, X } from "lucide-react";
import { BottomSheet, ConfirmDialog, SegmentedControl } from "@/components/mobile";

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

const filterOptions: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "pending", label: "Pendientes" },
  { value: "confirmed", label: "Confirmadas" },
  { value: "cancelled", label: "Canceladas" },
];

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

  // Estado para la reserva que se está editando
  const [bookingEdit, setBookingEdit] = useState<Booking | null>(null);
  const [servicesText, setServicesText] = useState("");

  // Estado para diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    bookingId: string;
    action: "cancel" | "confirm" | "complete";
  }>({ isOpen: false, bookingId: "", action: "cancel" });

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
    setConfirmDialog({ isOpen: false, bookingId: "", action: "cancel" });

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

  const openConfirmDialog = (bookingId: string, action: "cancel" | "confirm" | "complete") => {
    setConfirmDialog({ isOpen: true, bookingId, action });
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

  const getConfirmDialogProps = () => {
    const booking = bookings.find((b) => b.id === confirmDialog.bookingId);
    const name = booking?.customer_name || "esta reserva";

    switch (confirmDialog.action) {
      case "cancel":
        return {
          title: "Cancelar reserva",
          description: `¿Estas seguro de cancelar la reserva de ${name}? Esta accion notificara al cliente.`,
          confirmText: "Si, cancelar",
          variant: "danger" as const,
        };
      case "confirm":
        return {
          title: "Confirmar reserva",
          description: `¿Confirmar la reserva de ${name}?`,
          confirmText: "Confirmar",
          variant: "success" as const,
        };
      case "complete":
        return {
          title: "Completar reserva",
          description: `¿Marcar como completada la reserva de ${name}?`,
          confirmText: "Completar",
          variant: "success" as const,
        };
      default:
        return {
          title: "",
          description: "",
          confirmText: "",
          variant: "info" as const,
        };
    }
  };

  const handleConfirmAction = () => {
    const statusMap = {
      cancel: "cancelled",
      confirm: "confirmed",
      complete: "completed",
    };
    handleStatusChange(confirmDialog.bookingId, statusMap[confirmDialog.action]);
  };

  // Contadores para badges
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;

  return (
    <div>
      {/* Header */}
      <div className="page-header mb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-1">Reservas</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestiona las reservas de tu negocio
        </p>
      </div>

      {/* Error message */}
      {actionError && !bookingEdit && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      {/* Filters */}
      <div className="neumor-card p-4 mb-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, telefono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neumor-input w-full pl-10"
          />
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
        </div>

        {/* Status Filter - Segmented Control */}
        <SegmentedControl
          options={filterOptions.map((opt) => ({
            ...opt,
            count: opt.value === "pending" ? pendingCount : opt.value === "confirmed" ? confirmedCount : undefined,
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {/* Reservations List */}
      <div className="neumor-card p-4 sm:p-6">
        {filteredBookings.length === 0 ? (
          <div className="empty-state">
            <Calendar className="w-16 h-16" />
            <h3>No hay reservas</h3>
            <p>
              {searchTerm || filter !== "all"
                ? "No se encontraron reservas con los filtros seleccionados."
                : "Las reservas apareceran aqui cuando los clientes reserven."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Fecha y Hora</th>
                    <th>Franja</th>
                    <th>Servicios</th>
                    <th>Precio</th>
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
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-blue-100 text-blue-700">
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
                          title={booking.services?.map((s) => s.name).join(", ") || ""}
                        >
                          {booking.services?.length
                            ? booking.services.map((s) => s.name).join(", ")
                            : "-"}
                        </span>
                      </td>
                      <td>{formatPrice(booking.total_price_cents)}</td>
                      <td>{getStatusBadge(booking.status)}</td>
                      <td>
                        <div className="flex gap-2">
                          {booking.status === "pending" && (
                            <>
                              <button
                                className="neumor-btn text-xs px-3 py-1.5"
                                onClick={() => openConfirmDialog(booking.id, "confirm")}
                                disabled={isPending}
                              >
                                Confirmar
                              </button>
                              <button
                                className="neumor-btn text-xs px-3 py-1.5 text-red-600"
                                onClick={() => openConfirmDialog(booking.id, "cancel")}
                                disabled={isPending}
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                          {booking.status === "confirmed" && (
                            <button
                              className="neumor-btn text-xs px-3 py-1.5"
                              onClick={() => openConfirmDialog(booking.id, "complete")}
                              disabled={isPending}
                            >
                              Completar
                            </button>
                          )}
                          <button
                            className="neumor-btn text-xs px-3 py-1.5 flex items-center gap-1"
                            onClick={() => {
                              setActionError(null);
                              setBookingEdit(booking);
                              setServicesText(
                                booking.services?.map((s) => s.name).join(", ") || ""
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

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`neumor-card-sm p-4 ${isPending ? "opacity-50" : ""}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{booking.customer_name}</h3>
                        {recentIds.has(booking.id) && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                            Nueva
                          </span>
                        )}
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                    <button
                      className="neumor-btn p-2"
                      onClick={() => {
                        setActionError(null);
                        setBookingEdit(booking);
                        setServicesText(
                          booking.services?.map((s) => s.name).join(", ") || ""
                        );
                      }}
                      aria-label="Editar reserva"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{booking.customer_phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      <span>
                        {formatDate(booking.booking_date)}
                        {booking.booking_time && ` · ${booking.booking_time}`}
                        {` · ${getTimeBucket(booking.booking_time)}`}
                      </span>
                    </div>
                    {booking.services?.length ? (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="line-clamp-1">
                          {booking.services.map((s) => s.name).join(", ")}
                        </span>
                      </div>
                    ) : null}
                    {booking.total_price_cents ? (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <DollarSign className="w-4 h-4 flex-shrink-0" />
                        <span>{formatPrice(booking.total_price_cents)}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--shadow-dark)]">
                    {booking.status === "pending" && (
                      <>
                        <button
                          className="neumor-btn neumor-btn-accent flex-1 text-sm py-2.5"
                          onClick={() => openConfirmDialog(booking.id, "confirm")}
                          disabled={isPending}
                        >
                          Confirmar
                        </button>
                        <button
                          className="neumor-btn flex-1 text-sm py-2.5 text-red-600"
                          onClick={() => openConfirmDialog(booking.id, "cancel")}
                          disabled={isPending}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        className="neumor-btn neumor-btn-accent flex-1 text-sm py-2.5"
                        onClick={() => openConfirmDialog(booking.id, "complete")}
                        disabled={isPending}
                      >
                        Completar
                      </button>
                    )}
                    {(booking.status === "cancelled" || booking.status === "completed") && (
                      <div className="text-sm text-[var(--text-secondary)] italic">
                        {booking.status === "cancelled" ? "Reserva cancelada" : "Reserva completada"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, bookingId: "", action: "cancel" })}
        onConfirm={handleConfirmAction}
        isLoading={isPending}
        {...getConfirmDialogProps()}
      />

      {/* Edit Modal / Bottom Sheet */}
      <BottomSheet
        isOpen={!!bookingEdit}
        onClose={() => {
          setActionError(null);
          setBookingEdit(null);
        }}
        title="Editar reserva"
      >
        {bookingEdit && (
          <div className="p-5">
            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" />
                {actionError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Nombre del cliente *
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
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Telefono *
                </label>
                <input
                  className="neumor-input w-full"
                  placeholder="+34 600 000 000"
                  type="tel"
                  value={bookingEdit.customer_phone ?? ""}
                  onChange={(e) =>
                    setBookingEdit({ ...bookingEdit, customer_phone: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Numero de personas
                </label>
                <input
                  className="neumor-input w-full"
                  placeholder="1"
                  type="number"
                  min="1"
                  value={bookingEdit.guests}
                  onChange={(e) =>
                    setBookingEdit({ ...bookingEdit, guests: parseInt(e.target.value) || 1 })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Servicios
                </label>
                <input
                  className="neumor-input w-full"
                  placeholder="Corte, Color, Peinado"
                  value={servicesText}
                  onChange={(e) => setServicesText(e.target.value)}
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Separados por coma
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                  Notas
                </label>
                <textarea
                  className="neumor-input w-full min-h-[100px] resize-none"
                  placeholder="Notas adicionales..."
                  value={bookingEdit.notes ?? ""}
                  onChange={(e) =>
                    setBookingEdit({ ...bookingEdit, notes: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                className="neumor-btn flex-1 py-3"
                onClick={() => {
                  setActionError(null);
                  setBookingEdit(null);
                }}
              >
                Cancelar
              </button>

              <button
                className="neumor-btn neumor-btn-accent flex-1 py-3"
                onClick={handleBookingSave}
                disabled={isPending}
              >
                {isPending ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
