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
  services?: { name: string; duration_minutes?: number; price_cents?: number }[] | null;
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
  businessType: string;
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
  businessType,
}: Props) {
  const isRestaurant = businessType === "restaurant";
  const bookingLabel = isRestaurant ? "Reserva" : "Cita";
  const bookingLabelPlural = isRestaurant ? "Reservas" : "Citas";

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

  const parseLegacyNotes = (notes?: string | null) => {
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
  };

  const getBookingPriceText = (booking: Booking) => {
    if (Number.isFinite(booking.total_price_cents) && Number(booking.total_price_cents) > 0) {
      return (Number(booking.total_price_cents) / 100).toFixed(2);
    }
    const catalogItems = serviceCatalog.flatMap((category) => category.items);
    const priceByName = new Map<string, number>();
    catalogItems.forEach((item) => {
      priceByName.set(item.name.trim().toLowerCase(), item.price_cents || 0);
    });
    let total = 0;
    const services = booking.services || [];
    services.forEach((service) => {
      const servicePrice = Number(service.price_cents);
      if (Number.isFinite(servicePrice) && servicePrice > 0) {
        total += servicePrice;
        return;
      }
      const match = priceByName.get((service.name || "").trim().toLowerCase());
      if (match) {
        total += match;
      }
    });
    return total > 0 ? (total / 100).toFixed(2) : "";
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
  const [deleteConfirm, setDeleteConfirm] = useState<Booking | null>(null);
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
    if (isRestaurant || selectedProfessionalId === "all") {
      return bookingsForDay;
    }
    return bookingsForDay.filter(
      (booking) => booking.professional_id === selectedProfessionalId
    );
  }, [bookingsForDay, isRestaurant, selectedProfessionalId]);

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
    if (isRestaurant) return [];
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
    if (!dateValue || (!isRestaurant && !professionalId)) return [];
    const schedule = getScheduleForDate(dateValue);
    if (!schedule.is_open || !schedule.slots.length) return [];

    const selectedServices = getSelectedServiceItems();
    const totalDuration = selectedServices.reduce(
      (sum, service) => sum + (service.duration_minutes || 0),
      0
    );
    const duration = totalDuration > 0 ? totalDuration : 30;

    const bookedIntervals = isRestaurant
      ? []
      : bookings
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
    [createForm.service_ids, professionals, professionalCategoryMap, isRestaurant]
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
      isRestaurant,
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
    if (!isRestaurant && !selectedServices.length) {
      setCreateError("Selecciona al menos un servicio.");
      return;
    }
    if (!isRestaurant && !createForm.professional_id) {
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
          services: isRestaurant ? [] : selectedServices,
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
      const servicesList = isRestaurant
        ? []
        : servicesText
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((name) => ({ name }));

      const parsedPrice = Number(priceText.replace(",", "."));
      const totalPriceCents = Number.isFinite(parsedPrice)
        ? Math.round(parsedPrice * 100)
        : null;

      const updatePayload: Record<string, unknown> = {
        customer_name: bookingEdit.customer_name,
        customer_phone: bookingEdit.customer_phone,
        booking_time: bookingEdit.booking_time || null,
        notes: bookingEdit.notes || null,
      };

      if (!isRestaurant) {
        updatePayload.services = servicesList.length ? servicesList : null;
        updatePayload.total_price_cents = totalPriceCents;
      }

      await updateBooking(bookingEdit.id, updatePayload);

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingEdit.id
            ? {
                ...booking,
                customer_name: bookingEdit.customer_name,
                customer_phone: bookingEdit.customer_phone,
                booking_time: bookingEdit.booking_time,
                notes: bookingEdit.notes,
                services: isRestaurant
                  ? booking.services
                  : servicesList.length
                    ? servicesList
                    : null,
                total_price_cents: isRestaurant ? booking.total_price_cents : totalPriceCents,
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

    try {
      await deleteBooking(bookingId);
      setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));
      return true;
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "No se pudo eliminar.");
      return false;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Calendario</h1>
        <p className="text-[var(--text-secondary)]">
          Configura horarios y revisa las {bookingLabelPlural.toLowerCase()} del dia.
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--shadow-light)] text-sm">
          {message}
        </div>
      )}

      {/* Layout principal reorganizado - Mobile First */}
      <div className="space-y-4 md:space-y-6">
        {/* Fila superior: Calendario + Citas del día */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Calendario - full width en móvil, fijo en desktop */}
          <div className="neumor-card p-4 md:p-5 w-full lg:w-[420px] xl:w-[480px] lg:shrink-0">
            <div className="flex items-center justify-between mb-3 md:mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="neumor-btn text-base w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 flex items-center justify-center"
              disabled={loadingBookings}
              aria-label="Mes anterior"
            >
              ←
            </button>
            <h2 className="text-lg md:text-xl font-semibold capitalize">{monthLabel}</h2>
            <button
              type="button"
              onClick={handleNextMonth}
              className="neumor-btn text-base w-10 h-10 md:w-auto md:h-auto md:px-3 md:py-2 flex items-center justify-center"
              disabled={loadingBookings}
              aria-label="Mes siguiente"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 text-xs md:text-sm text-[var(--text-secondary)] mb-2">
            {dayLabels.map((label) => (
              <span key={label} className="text-center font-medium">
                {label}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {calendarDays.map((date, index) => (
              <button
                key={`${date || "empty"}-${index}`}
                type="button"
                disabled={!date}
                onClick={() => date && setSelectedDate(date)}
                className={`neumor-btn h-11 md:h-10 text-sm md:text-base font-medium ${
                  date === selectedDate ? "day-selected" : ""
                } ${!date ? "opacity-30 cursor-not-allowed" : ""}`}
              >
                {date ? Number(date.split("-")[2]) : ""}
              </button>
            ))}
          </div>
          </div>

          {/* Citas del día - altura controlada con scroll */}
          <div className="neumor-card p-4 md:p-5 w-full lg:flex-1 lg:max-w-[400px] flex flex-col max-h-[400px] md:max-h-[500px]">
            {/* Cabecera compacta - siempre visible */}
            <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                  {bookingLabelPlural}
                </h3>
                {selectedDate && (
                  <span className="text-xs md:text-sm font-medium text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded-lg">
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                )}
                {filteredBookingsForDay.length > 0 && (
                  <span className="text-xs font-bold text-white bg-[var(--accent)] px-2 py-0.5 rounded-full">
                    {filteredBookingsForDay.length}
                  </span>
                )}
              </div>
              <button
                type="button"
                className="neumor-btn neumor-btn-accent text-sm font-semibold px-3 py-2 shrink-0"
                onClick={() => {
                  setCreateForm((prev) => ({
                    ...prev,
                    booking_date: selectedDate || todayIso,
                  }));
                  setCreateOpen(true);
                  setCreateError(null);
                }}
              >
                + Nueva
              </button>
            </div>

            {/* Filtro de profesional - siempre visible */}
            {!isRestaurant && professionals.length > 1 && (
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <label className="text-xs md:text-sm font-medium text-[var(--text-secondary)] whitespace-nowrap">
                  Filtrar:
                </label>
                <select
                  className="neumor-input text-sm py-2 flex-1"
                  value={selectedProfessionalId}
                  onChange={(event) => setSelectedProfessionalId(event.target.value)}
                >
                  <option value="all">Todos</option>
                  {professionals.map((professional) => (
                    <option key={professional.id} value={professional.id}>
                      {professional.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Lista de citas - con scroll */}
            {selectedDate ? (
              <div className="flex-1 overflow-y-auto scroll-hidden min-h-0 -mx-1 px-1">
                {filteredBookingsForDay.length ? (
                  <div className="space-y-3">
                    {(["Manana", "Tarde", "Noche", "Sin hora"] as const).map((bucket) => {
                      const bucketBookings = bookingsByBucket[bucket] || [];
                      if (!bucketBookings.length) return null;
                      return (
                        <div key={bucket}>
                          <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold neumor-inset mb-2">
                            {bucket}
                          </span>
                          <div className="space-y-2">
                            {bucketBookings.map((booking) => (
                              <div
                                key={booking.id}
                                className="neumor-inset p-3 md:p-3 cursor-pointer rounded-xl transition active:scale-[0.98] hover:ring-2 hover:ring-[var(--accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                                role="button"
                                tabIndex={0}
                                onClick={() => {
                                  const legacy = parseLegacyNotes(booking.notes);
                                  const servicesFromBooking =
                                    booking.services?.map((service) => service.name).join(", ") ||
                                    legacy.servicesFromNotes ||
                                    "";
                                  setBookingEdit({ ...booking, notes: legacy.cleanNotes });
                                  setServicesText(servicesFromBooking);
                                  setPriceText(getBookingPriceText(booking));
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    const legacy = parseLegacyNotes(booking.notes);
                                    const servicesFromBooking =
                                      booking.services?.map((service) => service.name).join(", ") ||
                                      legacy.servicesFromNotes ||
                                      "";
                                    setBookingEdit({ ...booking, notes: legacy.cleanNotes });
                                    setServicesText(servicesFromBooking);
                                    setPriceText(getBookingPriceText(booking));
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="flex items-center gap-2 font-medium text-[var(--text-primary)] text-sm md:text-base truncate">
                                    <svg className="shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M19 21a7 7 0 0 0-14 0" />
                                      <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <span className="truncate">{booking.customer_name}</span>
                                  </span>
                                  <span className="text-base font-bold text-[var(--accent)] shrink-0">
                                    {booking.booking_time?.slice(0, 5) || "-"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="neumor-inset p-4 rounded-xl text-center">
                    <p className="text-sm text-[var(--text-secondary)]">
                      Sin {bookingLabelPlural.toLowerCase()} este día
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="neumor-inset p-4 rounded-xl text-center flex-1 flex items-center justify-center min-h-[80px]">
                <p className="text-sm text-[var(--text-secondary)]">
                  Selecciona un día en el calendario
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fila inferior: Horarios del local */}
        <div className="neumor-card p-4 md:p-5">
          <h3 className="text-lg md:text-xl font-bold mb-4 md:mb-5 text-[var(--text-primary)]">Horarios del local</h3>

          {/* Grid de días - responsive: 1 columna en móvil, flex en desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-3 md:gap-4">
              {dayLabels.map((label, index) => {
                const daySlots = getSlotsForDay(index);
                const isOpen = daySlots.length > 0;
                const isWeekend = index >= 5;
                const fullDayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

                return (
                  <div
                    key={label}
                    className={`neumor-card-sm p-3 md:p-4 rounded-2xl transition-all w-full lg:w-[280px] lg:shrink-0 ${
                      isOpen
                        ? "border-l-4 border-l-green-500"
                        : "border-l-4 border-l-gray-300 opacity-75"
                    } ${isWeekend ? "bg-[var(--shadow-light)]/30" : ""}`}
                  >
                    {/* Cabecera del día */}
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <span className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                        {fullDayNames[index]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleDay(index, !isOpen)}
                        className={`px-3 py-2 md:py-1.5 rounded-full text-sm font-semibold transition-all active:scale-95 ${
                          isOpen
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        aria-label={isOpen ? "Marcar como cerrado" : "Marcar como abierto"}
                      >
                        {isOpen ? "Abierto" : "Cerrado"}
                      </button>
                    </div>

                    {/* Tramos horarios */}
                    {isOpen ? (
                      <div className="space-y-2 md:space-y-3">
                        {daySlots.map((slot, slotIndex) => {
                          const slotKey = slot.id || slot.temp_id || `${index}-${slotIndex}`;
                          return (
                            <div key={slotKey} className="neumor-inset p-2 md:p-3 rounded-xl">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                                  Tramo {slotIndex + 1}
                                </span>
                                {daySlots.length > 1 && (
                                  <button
                                    type="button"
                                    className="text-red-500 hover:text-red-700 text-xs md:text-sm font-medium py-1 px-2 active:scale-95"
                                    onClick={() => handleRemoveSlot(index, slotKey)}
                                    aria-label="Eliminar tramo"
                                  >
                                    Eliminar
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
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
                                  className="neumor-input text-sm md:text-base font-semibold w-[6.5rem] md:w-[7.5rem] text-center py-2"
                                  aria-label="Hora de apertura"
                                />
                                <span className="text-sm md:text-base font-medium text-[var(--text-secondary)]">→</span>
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
                                  className="neumor-input text-sm md:text-base font-semibold w-[6.5rem] md:w-[7.5rem] text-center py-2"
                                  aria-label="Hora de cierre"
                                />
                              </div>
                            </div>
                          );
                        })}
                        <button
                          type="button"
                          className="w-full py-2.5 md:py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)]/10 rounded-lg transition-colors active:scale-[0.98]"
                          onClick={() => handleAddSlot(index)}
                        >
                          + Agregar tramo
                        </button>
                      </div>
                    ) : (
                      <div className="text-center py-3 md:py-4">
                        <p className="text-sm md:text-base text-[var(--text-secondary)]">
                          Sin horario
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-sm text-[var(--accent)] hover:underline py-1 active:scale-95"
                          onClick={() => handleToggleDay(index, true)}
                        >
                          Configurar horario
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleSave}
              className="neumor-btn neumor-btn-accent mt-4 md:mt-6 text-sm md:text-base font-semibold w-full sm:w-auto px-6 md:px-8 py-3 active:scale-[0.98]"
              disabled={saving}
            >
              {saving ? "Guardando..." : "Guardar horarios"}
            </button>
          </div>

          <div className="neumor-card p-4 md:p-5 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-5">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)]">Fechas especiales</h3>
                <p className="text-xs md:text-sm text-[var(--text-secondary)] mt-1">Festivos, vacaciones o días con horario diferente</p>
              </div>
              <button
                type="button"
                className="neumor-btn neumor-btn-accent text-sm md:text-base font-semibold w-full sm:w-auto px-5 py-2.5 active:scale-[0.98]"
                onClick={handleAddSpecialDay}
              >
                + Agregar fecha
              </button>
            </div>

            {specialDaysMessage && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-base">
                {specialDaysMessage}
              </div>
            )}

            <div className="grid grid-cols-1 md:flex md:flex-wrap gap-3 md:gap-4">
              {specialDays.length ? (
                specialDays.map((item, index) => {
                  const dateObj = new Date(item.date + "T00:00:00");
                  const formattedDate = dateObj.toLocaleDateString("es-ES", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={`${item.date}-${index}`}
                      className={`neumor-card-sm p-3 md:p-4 rounded-2xl border-l-4 w-full md:w-[380px] md:shrink-0 ${
                        item.is_open ? "border-l-green-500" : "border-l-red-400"
                      }`}
                    >
                      {/* Cabecera: Fecha + Estado + Eliminar */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 md:gap-4 mb-3 md:mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 md:gap-3 mb-2">
                            <input
                              type="date"
                              value={item.date}
                              onChange={(event) =>
                                handleSpecialDayChange(index, "date", event.target.value)
                              }
                              className="neumor-input text-sm md:text-base font-semibold w-full sm:w-auto py-2"
                              aria-label="Fecha especial"
                            />
                          </div>
                          <p className="text-sm md:text-base text-[var(--text-secondary)] capitalize truncate">
                            {formattedDate}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 md:gap-3">
                          <button
                            type="button"
                            onClick={() => handleSpecialDayChange(index, "is_open", !item.is_open)}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-full text-sm md:text-base font-semibold transition-all active:scale-95 ${
                              item.is_open
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-red-100 text-red-600 hover:bg-red-200"
                            }`}
                          >
                            {item.is_open ? "Abierto" : "Cerrado"}
                          </button>
                          <button
                            type="button"
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors active:scale-95 shrink-0"
                            onClick={() => handleDeleteSpecialDay(index)}
                            aria-label="Eliminar fecha especial"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Tramos horarios (si está abierto) */}
                      {item.is_open && (
                        <div className="mb-3 md:mb-4">
                          <p className="text-xs md:text-sm font-medium text-[var(--text-secondary)] mb-2 md:mb-3">Horarios del día:</p>
                          {item.slots?.length ? (
                            <div className="space-y-2 md:space-y-3">
                              {item.slots.map((slot, slotIndex) => {
                                const slotKey = slot.id || slot.temp_id || `${item.date}-${slotIndex}`;
                                return (
                                  <div key={slotKey} className="neumor-inset p-2 md:p-3 rounded-xl">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs md:text-sm font-medium text-[var(--text-secondary)]">
                                        Tramo {slotIndex + 1}
                                      </span>
                                      <button
                                        type="button"
                                        className="text-red-500 hover:text-red-700 text-xs md:text-sm font-medium py-1 px-2 active:scale-95"
                                        onClick={() => handleRemoveSpecialSlot(index, slotKey)}
                                      >
                                        Eliminar
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-1 md:gap-2 flex-wrap justify-center">
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
                                        className="neumor-input text-sm md:text-base font-semibold w-[6.5rem] md:w-[7.5rem] text-center py-2"
                                        aria-label="Hora de apertura"
                                      />
                                      <span className="text-sm md:text-base font-medium text-[var(--text-secondary)]">→</span>
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
                                        className="neumor-input text-sm md:text-base font-semibold w-[6.5rem] md:w-[7.5rem] text-center py-2"
                                        aria-label="Hora de cierre"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm md:text-base text-[var(--text-secondary)] neumor-inset p-3 rounded-xl text-center">
                              Sin tramos. Agrega uno para definir el horario.
                            </p>
                          )}
                          <button
                            type="button"
                            className="mt-2 md:mt-3 w-full sm:w-auto text-sm md:text-base font-medium text-[var(--accent)] hover:underline py-2 active:scale-95"
                            onClick={() => handleAddSpecialSlot(index)}
                          >
                            + Agregar tramo horario
                          </button>
                        </div>
                      )}

                      {!item.is_open && (
                        <div className="mb-3 md:mb-4 neumor-inset p-3 md:p-4 rounded-xl text-center">
                          <p className="text-sm md:text-base text-red-600 font-medium">
                            Este día permanecerá cerrado
                          </p>
                        </div>
                      )}

                      {/* Motivo */}
                      <div>
                        <label className="block text-xs md:text-sm font-medium text-[var(--text-secondary)] mb-1.5 md:mb-2">
                          Motivo o descripción:
                        </label>
                        <input
                          className="neumor-input w-full text-sm md:text-base py-2.5"
                          placeholder="Ej: Navidad, Vacaciones..."
                          value={item.note ?? ""}
                          onChange={(event) =>
                            handleSpecialDayChange(index, "note", event.target.value)
                          }
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="neumor-inset p-4 rounded-xl text-center">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Sin fechas especiales configuradas
                  </p>
                </div>
              )}
            </div>

            {specialDays.length > 0 && (
              <button
                type="button"
                onClick={handleSaveSpecialDays}
                className="neumor-btn neumor-btn-accent mt-4 md:mt-6 text-sm md:text-base font-semibold w-full sm:w-auto px-6 md:px-8 py-3 active:scale-[0.98]"
                disabled={savingSpecialDays}
              >
                {savingSpecialDays ? "Guardando..." : "Guardar fechas especiales"}
              </button>
            )}
          </div>
        </div>

      {createOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="neumor-card p-4 sm:p-6 w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-hidden rounded-t-3xl sm:rounded-2xl">
            <h2 className="text-lg sm:text-xl font-heading font-semibold mb-4 text-[var(--text-primary)]">
              Nueva {bookingLabel.toLowerCase()} interna
            </h2>

            {createError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {createError}
              </div>
            )}

            <div className="space-y-4 sm:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Nombre
                  </label>
                  <input
                    className="neumor-input w-full text-base py-2.5"
                    value={createForm.customer_name}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, customer_name: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Teléfono
                  </label>
                  <input
                    className="neumor-input w-full text-base py-2.5"
                    type="tel"
                    value={createForm.customer_phone}
                    onChange={(event) =>
                      setCreateForm((prev) => ({ ...prev, customer_phone: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Email (opcional)
                </label>
                <input
                  className="neumor-input w-full text-base py-2.5"
                  type="email"
                  value={createForm.customer_email}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, customer_email: event.target.value }))
                  }
                />
              </div>

              {!isRestaurant && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Servicios
                  </label>
                  <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 overflow-y-auto scroll-hidden">
                    {serviceCatalog.length ? (
                      serviceCatalog.map((category) => (
                        <div key={category.id} className="neumor-card-sm p-2 sm:p-3">
                          <p className="text-xs sm:text-sm font-semibold mb-2">{category.name}</p>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            {category.items.map((item) => {
                              const selected = createForm.service_ids.includes(item.id);
                              return (
                                <label
                                  key={item.id}
                                  className={`neumor-inset px-2 sm:px-3 py-1.5 sm:py-1 rounded-full text-xs flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 transition ${selected ? "ring-2 ring-[var(--accent)]" : ""}`}
                                >
                                  <input
                                    type="checkbox"
                                    className="w-4 h-4"
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
                                          professionalCategoryMap.get(prev.professional_id) ||
                                          new Set();
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
                                  <span className="leading-tight">
                                    {item.name} · {(item.price_cents / 100).toFixed(2)}€ ·{" "}
                                    {item.duration_minutes}min
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
              )}

              <div
                className={`grid grid-cols-1 ${
                  isRestaurant ? "sm:grid-cols-1" : "sm:grid-cols-2"
                } gap-3 sm:gap-4`}
              >
                {!isRestaurant && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Profesional
                    </label>
                    <select
                      className="neumor-input w-full text-base py-2.5"
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
                )}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    className="neumor-input w-full text-base py-2.5"
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
                <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Hora
                </label>
                <div className="neumor-inset p-2 sm:p-3 max-h-40 sm:max-h-52 overflow-y-auto scroll-hidden">
                  {availableTimes.length ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableTimes.map((time) => (
                        <button
                          key={time}
                          type="button"
                          className={`rounded-full py-2.5 text-sm font-medium neumor-inset active:scale-95 transition ${
                            createForm.booking_time === time ? "day-selected" : ""
                          }`}
                          onClick={() =>
                            setCreateForm((prev) => ({ ...prev, booking_time: time }))
                          }
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-[var(--text-secondary)] block text-center py-2">
                      {isRestaurant
                        ? "Selecciona fecha para ver horas."
                        : "Selecciona servicios, profesional y fecha para ver horas."}
                    </span>
                  )}
                </div>
              </div>

              {!isRestaurant && (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Precio total
                    </label>
                    <div className="neumor-input w-full text-sm sm:text-base py-2.5 font-semibold text-[var(--accent)]">
                      {(
                        getSelectedServiceItems().reduce(
                          (sum, service) => sum + (service.price_cents || 0),
                          0
                        ) / 100
                      ).toFixed(2)}€
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                      Categorías
                    </label>
                    <div className="neumor-input w-full text-sm sm:text-base py-2.5 truncate">
                      {getSelectedCategoryNames().length
                        ? getSelectedCategoryNames().join(", ")
                        : "Sin categorías"}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  className="neumor-input w-full text-base py-2.5"
                  rows={2}
                  value={createForm.notes}
                  onChange={(event) =>
                    setCreateForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button
                type="button"
                className="neumor-btn w-full sm:w-auto py-3 sm:py-2 active:scale-[0.98]"
                onClick={() => setCreateOpen(false)}
                disabled={savingCreate}
              >
                Cerrar
              </button>
              <button
                type="button"
                className="neumor-btn neumor-btn-accent w-full sm:w-auto py-3 sm:py-2 active:scale-[0.98]"
                onClick={handleCreateBooking}
                disabled={savingCreate}
              >
                {savingCreate ? "Guardando..." : `Guardar ${bookingLabel.toLowerCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {bookingEdit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="neumor-card p-4 sm:p-6 w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto scroll-hidden rounded-t-3xl sm:rounded-2xl">
            <h2 className="text-lg sm:text-xl font-heading font-semibold mb-4 sm:mb-6 text-[var(--text-primary)]">
              Editar {bookingLabel.toLowerCase()}
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
                    Teléfono
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

              {!isRestaurant && (
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
                      Precio total (EUR)
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
                onClick={async () => {
                  if (!bookingEdit) return;
                  setDeleteConfirm(bookingEdit);
                }}
                disabled={savingBooking}
              >
                Cancelar {bookingLabel.toLowerCase()}
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="neumor-card p-4 sm:p-6 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl">
            <h2 className="text-lg sm:text-xl font-heading font-semibold mb-3 text-[var(--text-primary)]">
              Eliminar {bookingLabel.toLowerCase()}
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Esta acción es permanente. Se eliminará la {bookingLabel.toLowerCase()} de{" "}
              <span className="font-semibold text-[var(--text-primary)]">
                {deleteConfirm.customer_name}
              </span>{" "}
              y se liberará la hora para nuevas {bookingLabelPlural.toLowerCase()}.
            </p>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                className="neumor-btn w-full sm:w-auto px-5 py-3 sm:py-2 active:scale-[0.98]"
                onClick={() => setDeleteConfirm(null)}
              >
                Cerrar
              </button>
              <button
                className="neumor-btn w-full sm:w-auto px-5 py-3 sm:py-2 text-red-600 active:scale-[0.98]"
                onClick={async () => {
                  const removed = await handleBookingDelete(deleteConfirm.id);
                  if (removed) {
                    setDeleteConfirm(null);
                    setBookingEdit(null);
                    setBookingError(null);
                  }
                }}
              >
                Eliminar {bookingLabel.toLowerCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
