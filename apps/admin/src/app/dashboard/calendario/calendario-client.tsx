"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteBooking, updateBooking } from "@/lib/actions";

interface BusinessHour {
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

interface BusinessHourSlot {
  id?: string;
  temp_id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  sort_order: number;
  is_active: boolean;
}

interface Booking {
  id: string;
  customer_name: string;
  customer_email?: string | null;
  customer_phone: string | null;
  booking_date: string;
  booking_time: string | null;
  professional_id?: string | null;
  created_at?: string | null;
  services?: { name: string; duration_minutes?: number }[] | null;
  status: string;
  notes?: string | null;
  total_price_cents?: number | null;
  total_duration_minutes?: number | null;
}

interface SpecialDay {
  id?: string;
  date: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  note?: string | null;
  slots?: SpecialDaySlot[];
}

interface SpecialDaySlot {
  id?: string;
  temp_id?: string;
  open_time: string;
  close_time: string;
  sort_order: number;
}

interface Professional {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
}

interface ServiceCategory {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
  items: ServiceItem[];
}

interface ProfessionalCategory {
  professional_id: string;
  category_id: string;
}

interface Props {
  initialHours: BusinessHour[];
  initialSlots: BusinessHourSlot[];
  initialBookings: Booking[];
  initialSpecialDays: SpecialDay[];
  initialProfessionals: Professional[];
  serviceCatalog: ServiceCategory[];
  professionalCategories: ProfessionalCategory[];
  year: number;
  month: number;
}

const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export default function CalendarioClient({
  initialHours,
  initialSlots,
  initialBookings,
  initialSpecialDays,
  initialProfessionals,
  serviceCatalog,
  professionalCategories,
  year,
  month,
}: Props) {
  const createTempId = () =>
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  const normalizeTime = (value: string) => {
    const [hours = "00", minutes = "00"] = value.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  };

  const timeToMinutes = (value: string) => {
    const [hours = "0", minutes = "0"] = value.split(":");
    return Number(hours) * 60 + Number(minutes);
  };

  const minutesToTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };
  const fallbackSlots =
    initialSlots.length > 0
      ? initialSlots
      : initialHours
          .filter((hour) => hour.is_open)
          .map((hour) => ({
            temp_id: createTempId(),
            day_of_week: hour.day_of_week,
            open_time: hour.open_time,
            close_time: hour.close_time,
            sort_order: 0,
            is_active: true,
          }));
  const todayIso = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso);
  const [slots, setSlots] = useState<BusinessHourSlot[]>(fallbackSlots);
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
  const [professionals] = useState<Professional[]>(initialProfessionals);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [savingCreate, setSavingCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    booking_date: todayIso,
    booking_time: "",
    professional_id: "",
    notes: "",
    service_ids: [] as string[],
  });

  const allServiceItems = useMemo(
    () => serviceCatalog.flatMap((category) => category.items),
    [serviceCatalog]
  );
  const professionalCategoryMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    professionalCategories.forEach((item) => {
      const existing = map.get(item.professional_id) || new Set<string>();
      existing.add(item.category_id);
      map.set(item.professional_id, existing);
    });
    return map;
  }, [professionalCategories]);

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

  const filteredBookingsForDay = useMemo(() => {
    if (selectedProfessionalId === "all") {
      return bookingsForDay;
    }
    return bookingsForDay.filter(
      (booking) => booking.professional_id === selectedProfessionalId
    );
  }, [bookingsForDay, selectedProfessionalId]);

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

    filteredBookingsForDay.forEach((booking) => {
      const bucket = getTimeBucket(booking.booking_time);
      groups[bucket] = [...(groups[bucket] || []), booking];
    });

    return groups;
  }, [filteredBookingsForDay]);


  const getSlotsForDay = (day: number, source = slots) =>
    source
      .filter((slot) => slot.day_of_week === day && slot.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);

  const getScheduleForDate = (dateValue: string) => {
    const special = specialDays.find((item) => item.date === dateValue);
    if (special) {
      if (!special.is_open) {
        return { is_open: false, slots: [] as { open_time: string; close_time: string }[] };
      }
      if (special.slots?.length) {
        return {
          is_open: true,
          slots: special.slots
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((slot) => ({
              open_time: slot.open_time,
              close_time: slot.close_time,
            })),
        };
      }
      return {
        is_open: true,
        slots: [{ open_time: special.open_time, close_time: special.close_time }],
      };
    }

    const date = new Date(dateValue);
    const dayIndex = (date.getDay() + 6) % 7;
    const daySlots = getSlotsForDay(dayIndex);
    if (daySlots.length) {
      return {
        is_open: true,
        slots: daySlots.map((slot) => ({
          open_time: slot.open_time,
          close_time: slot.close_time,
        })),
      };
    }

    return { is_open: false, slots: [] as { open_time: string; close_time: string }[] };
  };

  const getSelectedServiceItems = () =>
    allServiceItems.filter((item) => createForm.service_ids.includes(item.id));

  const getSelectedCategoryNames = () => {
    const ids = new Set(getSelectedServiceItems().map((item) => item.category_id));
    return serviceCatalog
      .filter((category) => ids.has(category.id))
      .map((category) => category.name);
  };

  const getSelectedServiceCategories = () =>
    Array.from(
      new Set(getSelectedServiceItems().map((item) => item.category_id).filter(Boolean))
    );

  const getAvailableProfessionals = () => {
    const requiredCategories = getSelectedServiceCategories();
    const activeProfessionals = professionals.filter((professional) => professional.is_active);
    if (!requiredCategories.length) return activeProfessionals;
    return activeProfessionals.filter((professional) => {
      const categories = professionalCategoryMap.get(professional.id) || new Set<string>();
      return requiredCategories.every((categoryId) => categories.has(categoryId));
    });
  };

  const getAvailableTimes = () => {
    const dateValue = createForm.booking_date;
    const professionalId = createForm.professional_id;
    if (!dateValue || !professionalId) return [];
    const schedule = getScheduleForDate(dateValue);
    if (!schedule.is_open || !schedule.slots.length) return [];

    const selectedServices = getSelectedServiceItems();
    const totalDuration = selectedServices.reduce(
      (sum, service) => sum + (service.duration_minutes || 0),
      0
    );
    const duration = totalDuration > 0 ? totalDuration : 30;

    const bookedIntervals = bookings
      .filter(
        (booking) =>
          booking.booking_date === dateValue &&
          booking.professional_id === professionalId &&
          ["pending", "confirmed"].includes(booking.status)
      )
      .map((booking) => {
        const durationFromServices = Array.isArray(booking.services)
          ? booking.services.reduce(
              (sum, service) => sum + (service.duration_minutes || 0),
              0
            )
          : 0;
        const durationMinutes =
          booking.total_duration_minutes || durationFromServices || 30;
        const start = timeToMinutes(booking.booking_time || "00:00");
        return { start, end: start + durationMinutes };
      });

    const step = 15;
    const times: string[] = [];
    schedule.slots.forEach((slot) => {
      const start = timeToMinutes(slot.open_time);
      const end = timeToMinutes(slot.close_time);
      for (let minutes = start; minutes + duration <= end; minutes += step) {
        const slotEnd = minutes + duration;
        const overlaps = bookedIntervals.some(
          (interval) => minutes < interval.end && slotEnd > interval.start
        );
        if (!overlaps) {
          times.push(minutesToTime(minutes));
        }
      }
    });

    return times;
  };

  const availableProfessionals = useMemo(
    () => getAvailableProfessionals(),
    [createForm.service_ids, professionals, professionalCategoryMap]
  );
  const availableTimes = useMemo(
    () => getAvailableTimes(),
    [
      createForm.booking_date,
      createForm.professional_id,
      createForm.service_ids,
      bookings,
      slots,
      specialDays,
    ]
  );

  const handleSlotChange = (
    slotId: string,
    field: keyof BusinessHourSlot,
    value: string
  ) => {
    setSlots((prev) =>
      prev.map((slot) => {
        const key = slot.id || slot.temp_id || "";
        if (key !== slotId) return slot;
        return { ...slot, [field]: value };
      })
    );
  };

  const handleAddSlot = (day: number) => {
    setSlots((prev) => {
      const daySlots = getSlotsForDay(day, prev);
      const nextOrder = daySlots.length;
      return [
        ...prev,
        {
          temp_id: createTempId(),
          day_of_week: day,
          open_time: "09:00",
          close_time: "14:00",
          sort_order: nextOrder,
          is_active: true,
        },
      ];
    });
  };

  const handleRemoveSlot = (day: number, slotId: string) => {
    setSlots((prev) => {
      const filtered = prev.filter((slot) => {
        if (slot.day_of_week !== day) return true;
        const key = slot.id || slot.temp_id || "";
        return key !== slotId;
      });
      const updatedDaySlots = getSlotsForDay(day, filtered).map((slot, idx) => ({
        ...slot,
        sort_order: idx,
      }));
      return [
        ...filtered.filter((slot) => slot.day_of_week !== day),
        ...updatedDaySlots,
      ];
    });
  };

  const handleToggleDay = (day: number, isOpen: boolean) => {
    if (!isOpen) {
      setSlots((prev) => prev.filter((slot) => slot.day_of_week !== day));
      return;
    }
    setSlots((prev) => {
      if (getSlotsForDay(day, prev).length > 0) {
        return prev;
      }
      return [
        ...prev,
        {
          temp_id: createTempId(),
          day_of_week: day,
          open_time: "09:00",
          close_time: "14:00",
          sort_order: 0,
          is_active: true,
        },
      ];
    });
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

  useEffect(() => {
    if (!createOpen) return;
    fetchBookings(calendarYear, calendarMonth);
  }, [createOpen, calendarMonth, calendarYear]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchBookings(calendarYear, calendarMonth);
    }, 10000);
    return () => clearInterval(interval);
  }, [calendarYear, calendarMonth]);

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
        body: JSON.stringify({ slots }),
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
      prev.map((item, current) => {
        if (current !== index) return item;
        if (field === "is_open" && value === false) {
          return { ...item, is_open: false, slots: [] };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleSpecialSlotChange = (
    dayIndex: number,
    slotKey: string,
    field: "open_time" | "close_time",
    value: string
  ) => {
    setSpecialDays((prev) =>
      prev.map((day, current) => {
        if (current !== dayIndex) return day;
        const slots = (day.slots || []).map((slot) => {
          const key = slot.id || slot.temp_id;
          return key === slotKey ? { ...slot, [field]: value } : slot;
        });
        return { ...day, slots };
      })
    );
  };

  const handleAddSpecialSlot = (dayIndex: number) => {
    setSpecialDays((prev) =>
      prev.map((day, current) => {
        if (current !== dayIndex) return day;
        const nextOrder = (day.slots?.length || 0) + 1;
        const nextSlot: SpecialDaySlot = {
          temp_id: createTempId(),
          open_time: "09:00",
          close_time: "14:00",
          sort_order: nextOrder - 1,
        };
        return { ...day, is_open: true, slots: [...(day.slots || []), nextSlot] };
      })
    );
  };

  const handleRemoveSpecialSlot = (dayIndex: number, slotKey: string) => {
    setSpecialDays((prev) =>
      prev.map((day, current) => {
        if (current !== dayIndex) return day;
        const slots = (day.slots || []).filter((slot) => {
          const key = slot.id || slot.temp_id;
          return key !== slotKey;
        });
        return { ...day, slots };
      })
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
        slots: [],
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

  const handleCreateBooking = async () => {
    setCreateError(null);
    const selectedServices = getSelectedServiceItems();
    if (!createForm.customer_name.trim() || !createForm.customer_phone.trim()) {
      setCreateError("Nombre y telefono son obligatorios.");
      return;
    }
    if (!selectedServices.length) {
      setCreateError("Selecciona al menos un servicio.");
      return;
    }
    if (!createForm.professional_id) {
      setCreateError("Selecciona un profesional.");
      return;
    }
    if (!createForm.booking_date || !createForm.booking_time) {
      setCreateError("Selecciona fecha y hora.");
      return;
    }

    setSavingCreate(true);
    try {
      const response = await fetch("/api/calendario/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: createForm.customer_name,
          customer_phone: createForm.customer_phone,
          customer_email: createForm.customer_email || null,
          booking_date: createForm.booking_date,
          booking_time: createForm.booking_time,
          professional_id: createForm.professional_id,
          notes: createForm.notes || null,
          services: selectedServices,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear la reserva.");
      }
      if (data.booking) {
        setBookings((prev) => [...prev, data.booking]);
      }
      setCreateOpen(false);
      setCreateForm({
        customer_name: "",
        customer_phone: "",
        customer_email: "",
        booking_date: selectedDate || todayIso,
        booking_time: "",
        professional_id: "",
        notes: "",
        service_ids: [],
      });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "No se pudo crear la reserva.");
    } finally {
      setSavingCreate(false);
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
                  date === selectedDate ? "day-selected" : ""
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
              <h3 className="text-lg font-semibold">Citas del dia</h3>
              {selectedDate && (
                <span className="text-sm text-[var(--text-secondary)]">{selectedDate}</span>
              )}
            </div>
            <div className="mb-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="neumor-btn text-xs px-3 py-1"
                onClick={() => {
                  setCreateForm((prev) => ({
                    ...prev,
                    booking_date: selectedDate || todayIso,
                  }));
                  setCreateOpen(true);
                  setCreateError(null);
                }}
              >
                Nueva reserva
              </button>
            </div>
            <div className="mb-4">
              <label className="text-xs text-[var(--text-secondary)] block mb-2">
                Profesional
              </label>
              <select
                className="neumor-input w-full"
                value={selectedProfessionalId}
                onChange={(event) => setSelectedProfessionalId(event.target.value)}
              >
                <option value="all">Todos los profesionales</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedDate ? (
              <div className="space-y-3">
                {filteredBookingsForDay.length ? (
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
                const daySlots = getSlotsForDay(index);
                const isOpen = daySlots.length > 0;

                return (
                  <div key={label} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-10 text-sm font-medium">{label}</span>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={isOpen}
                          onChange={(event) => handleToggleDay(index, event.target.checked)}
                        />
                        Abierto
                      </label>
                      <button
                        type="button"
                        className="neumor-btn text-xs px-3 py-1"
                        onClick={() => handleAddSlot(index)}
                        disabled={!isOpen}
                      >
                        Agregar tramo
                      </button>
                    </div>

                    {isOpen ? (
                      <div className="space-y-2">
                        {daySlots.map((slot, slotIndex) => {
                          const slotKey = slot.id || slot.temp_id || `${index}-${slotIndex}`;
                          return (
                            <div key={slotKey} className="flex items-center gap-3">
                              <span className="text-xs text-[var(--text-secondary)] w-14">
                                Tramo {slotIndex + 1}
                              </span>
                              <div className="flex items-center gap-2 time-field">
                                <input
                                  type="time"
                                  value={normalizeTime(slot.open_time)}
                                  onChange={(event) =>
                                    handleSlotChange(
                                      slotKey,
                                      "open_time",
                                      normalizeTime(event.target.value)
                                    )
                                  }
                                  className="neumor-input w-28 no-native-time"
                                />
                                <button
                                  type="button"
                                  className="neumor-inset w-8 h-8 flex items-center justify-center"
                                  onClick={(event) => {
                                    const input = event.currentTarget
                                      .closest(".time-field")
                                      ?.querySelector("input") as HTMLInputElement | null;
                                    if (!input) return;
                                    if (typeof input.showPicker === "function") {
                                      input.showPicker();
                                    } else {
                                      input.focus();
                                    }
                                  }}
                                  aria-label="Seleccionar hora de apertura"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                </button>
                              </div>
                              <span className="text-xs text-[var(--text-secondary)]">a</span>
                              <div className="flex items-center gap-2 time-field">
                                <input
                                  type="time"
                                  value={normalizeTime(slot.close_time)}
                                  onChange={(event) =>
                                    handleSlotChange(
                                      slotKey,
                                      "close_time",
                                      normalizeTime(event.target.value)
                                    )
                                  }
                                  className="neumor-input w-28 no-native-time"
                                />
                                <button
                                  type="button"
                                  className="neumor-inset w-8 h-8 flex items-center justify-center"
                                  onClick={(event) => {
                                    const input = event.currentTarget
                                      .closest(".time-field")
                                      ?.querySelector("input") as HTMLInputElement | null;
                                    if (!input) return;
                                    if (typeof input.showPicker === "function") {
                                      input.showPicker();
                                    } else {
                                      input.focus();
                                    }
                                  }}
                                  aria-label="Seleccionar hora de cierre"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                </button>
                              </div>
                              {daySlots.length > 1 && (
                                <button
                                  type="button"
                                  className="neumor-btn text-xs px-3 py-1"
                                  onClick={() => handleRemoveSlot(index, slotKey)}
                                >
                                  Quitar
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Cerrado.
                      </p>
                    )}
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
                      <button
                        type="button"
                        className="neumor-btn text-xs px-3 py-1"
                        onClick={() => handleAddSpecialSlot(index)}
                        disabled={!item.is_open}
                      >
                        Agregar tramo
                      </button>
                      <button
                        type="button"
                        className="neumor-btn text-xs px-3"
                        onClick={() => handleDeleteSpecialDay(index)}
                      >
                        Quitar
                      </button>
                    </div>
                    {item.is_open ? (
                      item.slots?.length ? (
                        <div className="space-y-2">
                          {item.slots.map((slot, slotIndex) => {
                            const slotKey = slot.id || slot.temp_id || `${item.date}-${slotIndex}`;
                            return (
                              <div key={slotKey} className="flex items-center gap-3">
                                <span className="text-xs text-[var(--text-secondary)] w-14">
                                  Tramo {slotIndex + 1}
                                </span>
                                <div className="flex items-center gap-2 time-field">
                                  <input
                                    type="time"
                                    value={normalizeTime(slot.open_time)}
                                    onChange={(event) =>
                                      handleSpecialSlotChange(
                                        index,
                                        slotKey,
                                        "open_time",
                                        normalizeTime(event.target.value)
                                      )
                                    }
                                    className="neumor-input w-24 no-native-time"
                                  />
                                  <button
                                    type="button"
                                    className="neumor-inset w-8 h-8 flex items-center justify-center"
                                    onClick={(event) => {
                                      const input = event.currentTarget
                                        .closest(".time-field")
                                        ?.querySelector("input") as HTMLInputElement | null;
                                      if (!input) return;
                                      if (typeof input.showPicker === "function") {
                                        input.showPicker();
                                      } else {
                                        input.focus();
                                      }
                                    }}
                                    aria-label="Seleccionar hora de apertura"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                  </button>
                                </div>
                                <span className="text-xs text-[var(--text-secondary)]">a</span>
                                <div className="flex items-center gap-2 time-field">
                                  <input
                                    type="time"
                                    value={normalizeTime(slot.close_time)}
                                    onChange={(event) =>
                                      handleSpecialSlotChange(
                                        index,
                                        slotKey,
                                        "close_time",
                                        normalizeTime(event.target.value)
                                      )
                                    }
                                    className="neumor-input w-24 no-native-time"
                                  />
                                  <button
                                    type="button"
                                    className="neumor-inset w-8 h-8 flex items-center justify-center"
                                    onClick={(event) => {
                                      const input = event.currentTarget
                                        .closest(".time-field")
                                        ?.querySelector("input") as HTMLInputElement | null;
                                      if (!input) return;
                                      if (typeof input.showPicker === "function") {
                                        input.showPicker();
                                      } else {
                                        input.focus();
                                      }
                                    }}
                                    aria-label="Seleccionar hora de cierre"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="14"
                                      height="14"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  className="neumor-btn text-xs px-3 py-1"
                                  onClick={() => handleRemoveSpecialSlot(index, slotKey)}
                                >
                                  Quitar
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--text-secondary)]">
                          Sin tramos. Agrega uno para abrir este dia.
                        </p>
                      )
                    ) : (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Cerrado.
                      </p>
                    )}
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

      {createOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="neumor-card p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
              Nueva reserva interna
            </h2>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Nombre
                  </label>
                  <input
                    className="neumor-input w-full"
                    value={createForm.customer_name}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, customer_name: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Telefono
                  </label>
                  <input
                    className="neumor-input w-full"
                    value={createForm.customer_phone}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, customer_phone: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Email (opcional)
                </label>
                <input
                  className="neumor-input w-full"
                  value={createForm.customer_email}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, customer_email: event.target.value }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Servicios
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {serviceCatalog.length ? (
                    serviceCatalog.map((category) => (
                      <div key={category.id} className="neumor-card-sm p-3">
                        <p className="text-sm font-semibold mb-2">{category.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {category.items.map((item) => {
                            const selected = createForm.service_ids.includes(item.id);
                            return (
                              <label
                                key={item.id}
                                className="neumor-inset px-3 py-1 rounded-full text-xs flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={(event) => {
                                    const checked = event.target.checked;
                                    setCreateForm((prev) => {
                                      const nextServiceIds = checked
                                        ? [...prev.service_ids, item.id]
                                        : prev.service_ids.filter((id) => id !== item.id);
                                      const requiredCategories = new Set(
                                        allServiceItems
                                          .filter((service) => nextServiceIds.includes(service.id))
                                          .map((service) => service.category_id)
                                          .filter(Boolean)
                                      );
                                      const currentCategories =
                                        professionalCategoryMap.get(prev.professional_id) || new Set();
                                      const keepProfessional =
                                        prev.professional_id &&
                                        Array.from(requiredCategories).every((categoryId) =>
                                          currentCategories.has(categoryId)
                                        );

                                      return {
                                        ...prev,
                                        service_ids: nextServiceIds,
                                        professional_id: keepProfessional
                                          ? prev.professional_id
                                          : "",
                                        booking_time: "",
                                      };
                                    });
                                  }}
                                />
                                <span>
                                  {item.name} · {(item.price_cents / 100).toFixed(2)} EUR ·{" "}
                                  {item.duration_minutes} min
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[var(--text-secondary)]">
                      No hay servicios configurados.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Profesional
                  </label>
                  <select
                    className="neumor-input w-full"
                    value={createForm.professional_id}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        professional_id: event.target.value,
                        booking_time: "",
                      }))
                    }
                  >
                    <option value="">Selecciona profesional</option>
                    {availableProfessionals.map((professional) => (
                      <option key={professional.id} value={professional.id}>
                        {professional.name}
                      </option>
                    ))}
                  </select>
                  {createForm.service_ids.length > 0 && !availableProfessionals.length && (
                    <p className="text-xs text-red-600 mt-2">
                      No hay profesionales que cubran esos servicios.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="neumor-input w-full"
                    value={createForm.booking_date}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        booking_date: event.target.value,
                        booking_time: "",
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Hora
                </label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {availableTimes.length ? (
                    availableTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        className={`neumor-btn text-xs px-3 py-1 ${
                          createForm.booking_time === time ? "day-selected" : ""
                        }`}
                        onClick={() =>
                          setCreateForm((prev) => ({ ...prev, booking_time: time }))
                        }
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)]">
                      Selecciona servicios, profesional y fecha para ver horas.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Precio total
                  </label>
                  <div className="neumor-input w-full">
                    {(
                      getSelectedServiceItems().reduce(
                        (sum, service) => sum + (service.price_cents || 0),
                        0
                      ) / 100
                    ).toFixed(2)}{" "}
                    EUR
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Categorias
                  </label>
                  <div className="neumor-input w-full">
                    {getSelectedCategoryNames().length
                      ? getSelectedCategoryNames().join(", ")
                      : "Sin categorias"}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  className="neumor-input w-full"
                  rows={3}
                  value={createForm.notes}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                className="neumor-btn"
                onClick={() => setCreateOpen(false)}
                disabled={savingCreate}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="neumor-btn neumor-btn-accent"
                onClick={handleCreateBooking}
                disabled={savingCreate}
              >
                {savingCreate ? "Guardando..." : "Guardar reserva"}
              </button>
            </div>
          </div>
        </div>
      )}

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
