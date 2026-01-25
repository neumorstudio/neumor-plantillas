"use client";

import { useMemo, useState } from "react";
import { deleteBooking, updateBooking } from "@/lib/actions";

interface BusinessHour {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string | null;
  booking_date: string;
  booking_time: string | null;
  created_at?: string | null;
  services?: { name: string }[] | null;
  status: string;
  notes?: string | null;
  total_price_cents?: number | null;
}

interface SpecialDay {
  id?: string;
  date: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  note?: string | null;
}

interface Props {
  initialHours: BusinessHour[];
  initialBookings: Booking[];
  initialSpecialDays: SpecialDay[];
  year: number;
  month: number;
}

const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export default function CalendarioClient({
  initialHours,
  initialBookings,
  initialSpecialDays,
  year,
  month,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hours, setHours] = useState<BusinessHour[]>(initialHours);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(year);
  const [calendarMonth, setCalendarMonth] = useState(month);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingEdit, setBookingEdit] = useState<Booking | null>(null);
  const [servicesText, setServicesText] = useState("");
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [savingBooking, setSavingBooking] = useState(false);
  const [priceText, setPriceText] = useState("");
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>(initialSpecialDays);
  const [savingSpecialDays, setSavingSpecialDays] = useState(false);
  const [specialDaysMessage, setSpecialDaysMessage] = useState<string | null>(null);

  const monthLabel = new Date(calendarYear, calendarMonth, 1).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstWeekday = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7;

  const calendarDays = useMemo(() => {
    const days: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push(date);
    }
    return days;
  }, [calendarMonth, calendarYear, daysInMonth, firstWeekday]);

  const bookingsForDay = useMemo(() => {
    if (!selectedDate) return [];
    return bookings
      .filter((booking) => booking.booking_date === selectedDate)
      .sort((a, b) => {
        const timeA = a.booking_time || "99:99:99";
        const timeB = b.booking_time || "99:99:99";
        return timeA.localeCompare(timeB);
      });
  }, [bookings, selectedDate]);

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

  const bookingsByBucket = useMemo(() => {
    const groups: Record<string, Booking[]> = {
      Manana: [],
      Tarde: [],
      Noche: [],
      "Sin hora": [],
    };

    bookingsForDay.forEach((booking) => {
      const bucket = getTimeBucket(booking.booking_time);
      groups[bucket] = [...(groups[bucket] || []), booking];
    });

    return groups;
  }, [bookingsForDay]);


  const handleHourChange = (day: number, field: keyof BusinessHour, value: string | boolean) => {
    setHours((prev) =>
      prev.map((item) =>
        item.day_of_week === day ? { ...item, [field]: value } : item
      )
    );
  };

  const fetchBookings = async (nextYear: number, nextMonth: number) => {
    setLoadingBookings(true);
    try {
      const response = await fetch(
        `/api/calendario/bookings?year=${nextYear}&month=${nextMonth}`
      );
      if (!response.ok) {
        throw new Error("No se pudieron cargar las reservas.");
      }
      const data = await response.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      setBookings([]);
      setMessage(error instanceof Error ? error.message : "Error al cargar reservas.");
    } finally {
      setLoadingBookings(false);
    }
  };

  const handlePrevMonth = () => {
    const nextMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
    const nextYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
    setCalendarMonth(nextMonth);
    setCalendarYear(nextYear);
    setSelectedDate(null);
    fetchBookings(nextYear, nextMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
    setCalendarMonth(nextMonth);
    setCalendarYear(nextYear);
    setSelectedDate(null);
    fetchBookings(nextYear, nextMonth);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/calendario/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo guardar.");
      }

      setMessage("Horarios guardados.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleSpecialDayChange = (
    index: number,
    field: keyof SpecialDay,
    value: string | boolean
  ) => {
    setSpecialDays((prev) =>
      prev.map((item, current) =>
        current === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddSpecialDay = () => {
    const today = new Date().toISOString().split("T")[0];
    setSpecialDays((prev) => [
      ...prev,
      {
        date: today,
        is_open: false,
        open_time: "09:00",
        close_time: "19:00",
        note: "",
      },
    ]);
  };

  const handleDeleteSpecialDay = async (index: number) => {
    const entry = specialDays[index];
    const confirmed = window.confirm("Eliminar esta fecha especial?");
    if (!confirmed) return;

    if (entry.id) {
      try {
        const response = await fetch(`/api/calendario/especiales?id=${entry.id}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("No se pudo eliminar.");
        }
      } catch (error) {
        setSpecialDaysMessage(
          error instanceof Error ? error.message : "No se pudo eliminar."
        );
        return;
      }
    }

    setSpecialDays((prev) => prev.filter((_, current) => current !== index));
  };

  const handleSaveSpecialDays = async () => {
    setSavingSpecialDays(true);
    setSpecialDaysMessage(null);

    try {
      const response = await fetch("/api/calendario/especiales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialDays }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "No se pudo guardar.");
      }

      const data = await response.json();
      setSpecialDays(data);
      setSpecialDaysMessage("Fechas especiales guardadas.");
    } catch (error) {
      setSpecialDaysMessage(error instanceof Error ? error.message : "Error al guardar.");
    } finally {
      setSavingSpecialDays(false);
    }
  };

  const handleBookingSave = async () => {
    if (!bookingEdit) return;
    setSavingBooking(true);
    setBookingError(null);

    try {
      const servicesList = servicesText
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((name) => ({ name }));

      const parsedPrice = Number(priceText.replace(",", "."));
      const totalPriceCents = Number.isFinite(parsedPrice)
        ? Math.round(parsedPrice * 100)
        : null;

      await updateBooking(bookingEdit.id, {
        customer_name: bookingEdit.customer_name,
        customer_phone: bookingEdit.customer_phone,
        booking_time: bookingEdit.booking_time || null,
        notes: bookingEdit.notes || null,
        services: servicesList.length ? servicesList : null,
        total_price_cents: totalPriceCents,
      } as unknown as Record<string, unknown>);

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingEdit.id
            ? {
                ...booking,
                customer_name: bookingEdit.customer_name,
                customer_phone: bookingEdit.customer_phone,
                booking_time: bookingEdit.booking_time,
                notes: bookingEdit.notes,
                services: servicesList.length ? servicesList : null,
                total_price_cents: totalPriceCents,
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
    const confirmed = window.confirm("Borrado permanente de reserva. Deseas continuar?");
    if (!confirmed) return;
    setBookingError(null);

    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "No se pudo eliminar.");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Calendario</h1>
        <p className="text-[var(--text-secondary)]">
          Configura horarios y revisa las reservas del dia.
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--shadow-light)] text-sm">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
        <div className="neumor-card p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="neumor-btn text-sm"
              disabled={loadingBookings}
            >
              ←
            </button>
            <h2 className="text-xl font-semibold capitalize">{monthLabel}</h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="neumor-btn text-sm"
              disabled={loadingBookings}
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs text-[var(--text-secondary)] mb-2">
            {dayLabels.map((label) => (
              <span key={label} className="text-center">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((date, index) => (
              <button
                key={`${date || "empty"}-${index}`}
                type="button"
                disabled={!date}
                onClick={() => date && setSelectedDate(date)}
                className={`neumor-btn h-10 text-sm ${
                  date === selectedDate ? "neumor-btn-accent" : ""
                } ${!date ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                {date ? Number(date.split("-")[2]) : ""}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="neumor-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Reservas del dia</h3>
              {selectedDate && (
                <span className="text-sm text-[var(--text-secondary)]">{selectedDate}</span>
              )}
            </div>
            {selectedDate ? (
              <div className="space-y-3">
                {bookingsForDay.length ? (
                  <div className="space-y-5">
                    {(["Manana", "Tarde", "Noche", "Sin hora"] as const).map((bucket) => {
                      const bucketBookings = bookingsByBucket[bucket] || [];
                      if (!bucketBookings.length) {
                        return null;
                      }
                      return (
                        <div key={bucket} className="space-y-3">
                          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold neumor-inset">
                            {bucket}
                          </span>
                          {bucketBookings.map((booking, index) => (
                            <div key={booking.id} className="space-y-3">
                              <div className="neumor-card-sm p-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{booking.customer_name}</span>
                                  <span className="text-lg font-semibold text-[var(--text-primary)]">
                                    {booking.booking_time || "-"}
                                  </span>
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <button
                                    type="button"
                                    className="neumor-btn text-xs px-3 py-1"
                                    onClick={() => {
                                      setBookingEdit(booking);
                                      setServicesText(
                                        booking.services?.map((service) => service.name).join(", ") || ""
                                      );
                                      setPriceText(
                                        Number.isFinite(booking.total_price_cents)
                                          ? (Number(booking.total_price_cents) / 100).toFixed(2)
                                          : ""
                                      );
                                    }}
                                  >
                                    Ver
                                  </button>
                                  <button
                                    type="button"
                                    className="neumor-btn text-xs px-3 py-1"
                                    onClick={() => handleBookingDelete(booking.id)}
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                              {index < bucketBookings.length - 1 && (
                                <div className="h-px bg-[var(--shadow-dark)] opacity-40" />
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No hay reservas para este dia.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">
                Selecciona un dia para ver las reservas.
              </p>
            )}
          </div>

          <div className="neumor-card p-6">
            <h3 className="text-lg font-semibold mb-4">Horarios del local</h3>
            <div className="space-y-3">
              {dayLabels.map((label, index) => {
                const day = hours.find((item) => item.day_of_week === index) || {
                  day_of_week: index,
                  is_open: true,
                  open_time: "09:00",
                  close_time: "19:00",
                };

                return (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-10 text-sm font-medium">{label}</span>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={day.is_open}
                        onChange={(event) =>
                          handleHourChange(index, "is_open", event.target.checked)
                        }
                      />
                      Abierto
                    </label>
                    <input
                      type="time"
                      value={day.open_time}
                      onChange={(event) =>
                        handleHourChange(index, "open_time", event.target.value)
                      }
                      className="neumor-input w-24"
                      disabled={!day.is_open}
                    />
                    <span className="text-xs text-[var(--text-secondary)]">a</span>
                    <input
                      type="time"
                      value={day.close_time}
                      onChange={(event) =>
                        handleHourChange(index, "close_time", event.target.value)
                      }
                      className="neumor-input w-24"
                      disabled={!day.is_open}
                    />
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="neumor-btn neumor-btn-accent mt-4"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar horarios"}
            </button>
          </div>

          <div className="neumor-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Fechas especiales</h3>
              <button
                type="button"
                className="neumor-btn text-sm px-3"
                onClick={handleAddSpecialDay}
              >
                Agregar
              </button>
            </div>

            {specialDaysMessage && (
              <div className="mb-3 p-2 rounded-lg bg-[var(--shadow-light)] text-xs">
                {specialDaysMessage}
              </div>
            )}

            <div className="space-y-3">
              {specialDays.length ? (
                specialDays.map((item, index) => (
                  <div key={`${item.date}-${index}`} className="neumor-card-sm p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="date"
                        value={item.date}
                        onChange={(event) =>
                          handleSpecialDayChange(index, "date", event.target.value)
                        }
                        className="neumor-input"
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={item.is_open}
                          onChange={(event) =>
                            handleSpecialDayChange(index, "is_open", event.target.checked)
                          }
                        />
                        Abierto
                      </label>
                      <input
                        type="time"
                        value={item.open_time}
                        onChange={(event) =>
                          handleSpecialDayChange(index, "open_time", event.target.value)
                        }
                        className="neumor-input w-24"
                        disabled={!item.is_open}
                      />
                      <span className="text-xs text-[var(--text-secondary)]">a</span>
                      <input
                        type="time"
                        value={item.close_time}
                        onChange={(event) =>
                          handleSpecialDayChange(index, "close_time", event.target.value)
                        }
                        className="neumor-input w-24"
                        disabled={!item.is_open}
                      />
                      <button
                        type="button"
                        className="neumor-btn text-xs px-3"
                        onClick={() => handleDeleteSpecialDay(index)}
                      >
                        Quitar
                      </button>
                    </div>
                    <input
                      className="neumor-input w-full"
                      placeholder="Motivo (opcional)"
                      value={item.note ?? ""}
                      onChange={(event) =>
                        handleSpecialDayChange(index, "note", event.target.value)
                      }
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  No hay fechas especiales configuradas.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSaveSpecialDays}
              className="neumor-btn neumor-btn-accent mt-4"
              disabled={savingSpecialDays}
            >
              {savingSpecialDays ? "Guardando..." : "Guardar fechas"}
            </button>
          </div>
        </div>
      </div>

      {bookingEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="neumor-card p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-heading font-semibold mb-6 text-[var(--text-primary)]">
              Editar reserva
            </h2>

            {bookingError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {bookingError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Nombre del cliente
                </label>
                <input
                  className="neumor-input w-full"
                  value={bookingEdit.customer_name}
                  onChange={(event) =>
                    setBookingEdit({ ...bookingEdit, customer_name: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Telefono
                </label>
                <input
                  className="neumor-input w-full"
                  value={bookingEdit.customer_phone ?? ""}
                  onChange={(event) =>
                    setBookingEdit({ ...bookingEdit, customer_phone: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Hora
                </label>
                <input
                  type="time"
                  className="neumor-input w-full"
                  value={bookingEdit.booking_time ?? ""}
                  onChange={(event) =>
                    setBookingEdit({ ...bookingEdit, booking_time: event.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Servicios
                </label>
                <input
                  className="neumor-input w-full"
                  value={servicesText}
                  onChange={(event) => setServicesText(event.target.value)}
                  placeholder="Corte, Color, Peinado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Precio total (EUR)
                </label>
                <input
                  className="neumor-input w-full"
                  value={priceText}
                  onChange={(event) => setPriceText(event.target.value)}
                  placeholder="25.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Notas
                </label>
                <textarea
                  className="neumor-input w-full min-h-[80px] resize-none"
                  value={bookingEdit.notes ?? ""}
                  onChange={(event) =>
                    setBookingEdit({ ...bookingEdit, notes: event.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="neumor-btn px-5"
                onClick={() => {
                  setBookingEdit(null);
                  setBookingError(null);
                }}
              >
                Cancelar
              </button>

              <button
                className="neumor-btn neumor-btn-accent px-5"
                onClick={handleBookingSave}
                disabled={savingBooking}
              >
                {savingBooking ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
