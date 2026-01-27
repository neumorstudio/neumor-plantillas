"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  ServiceCategory,
  ServiceItem,
  BusinessHour,
  BusinessHourSlot,
  Professional,
  ProfessionalCategory,
  SpecialDay,
  SpecialDaySlot,
} from "@/lib/booking-data";

interface AppointmentFormProps {
  websiteId: string;
  serviceCatalog: ServiceCategory[];
  businessHours: BusinessHour[];
  businessHourSlots: BusinessHourSlot[];
  professionals: Professional[];
  professionalCategories: ProfessionalCategory[];
  specialDays: SpecialDay[];
  specialDaySlots: SpecialDaySlot[];
  title?: string;
  subtitle?: string;
}

interface SelectedService {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  category_id: string;
}

interface BookedSlot {
  start: number;
  end: number;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const SLOT_STEP_MINUTES = 15;

const timeToMinutes = (value: string) => {
  const parts = value.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

const minutesToTime = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export default function AppointmentForm({
  websiteId,
  serviceCatalog,
  businessHours,
  businessHourSlots,
  professionals,
  professionalCategories,
  specialDays,
  specialDaySlots,
  title = "Reserva tu Cita",
  subtitle = "Elige el servicio, luego fecha y hora.",
}: AppointmentFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [selectedProfessional, setSelectedProfessional] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" | "warning" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Build professional -> categories map
  const professionalCategoryMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    professionalCategories.forEach((item) => {
      const existing = map.get(item.professional_id) || new Set<string>();
      existing.add(item.category_id);
      map.set(item.professional_id, existing);
    });
    return map;
  }, [professionalCategories]);

  // Get selected services data
  const selectedServicesData = useMemo(() => {
    const result: SelectedService[] = [];
    serviceCatalog.forEach((category) => {
      category.items.forEach((item) => {
        if (selectedServices.has(item.id)) {
          result.push({
            id: item.id,
            name: item.name,
            price_cents: item.price_cents,
            duration_minutes: item.duration_minutes,
            category_id: item.category_id,
          });
        }
      });
    });
    return result;
  }, [serviceCatalog, selectedServices]);

  // Get selected category IDs
  const selectedCategoryIds = useMemo(() => {
    return Array.from(new Set(selectedServicesData.map((s) => s.category_id)));
  }, [selectedServicesData]);

  // Calculate total duration
  const totalDuration = useMemo(() => {
    return selectedServicesData.reduce((sum, s) => sum + s.duration_minutes, 0) || 30;
  }, [selectedServicesData]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    return selectedServicesData.reduce((sum, s) => sum + s.price_cents, 0);
  }, [selectedServicesData]);

  // Filter available professionals based on selected categories
  const availableProfessionals = useMemo(() => {
    if (selectedCategoryIds.length === 0) return professionals;
    return professionals.filter((prof) => {
      const categories = professionalCategoryMap.get(prof.id);
      if (!categories) return false;
      return selectedCategoryIds.every((catId) => categories.has(catId));
    });
  }, [professionals, selectedCategoryIds, professionalCategoryMap]);

  // Auto-select first available professional when selection changes
  useEffect(() => {
    if (selectedProfessional && !availableProfessionals.find((p) => p.id === selectedProfessional)) {
      setSelectedProfessional(availableProfessionals[0]?.id || "");
      setSelectedTime("");
    } else if (!selectedProfessional && availableProfessionals.length > 0) {
      setSelectedProfessional(availableProfessionals[0].id);
    }
  }, [availableProfessionals, selectedProfessional]);

  // Get day schedule
  const getDaySchedule = useCallback((dateValue: string) => {
    const special = specialDays.find((item) => item.date === dateValue);
    if (special) {
      if (!special.is_open) {
        return { is_open: false, slots: [] };
      }
      const daySlots = specialDaySlots
        .filter((slot) => slot.special_day_id === special.id)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      if (daySlots.length) {
        return {
          is_open: true,
          slots: daySlots.map((slot) => ({
            open_time: slot.open_time,
            close_time: slot.close_time,
          })),
        };
      }
      return {
        is_open: true,
        slots: [{ open_time: special.open_time || "09:00", close_time: special.close_time || "19:00" }],
      };
    }

    const date = new Date(dateValue);
    const dayIndex = (date.getDay() + 6) % 7;
    const slotMatches = businessHourSlots
      .filter((slot) => slot.day_of_week === dayIndex)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    if (slotMatches.length) {
      return {
        is_open: true,
        slots: slotMatches.map((slot) => ({
          open_time: slot.open_time || "09:00",
          close_time: slot.close_time || "19:00",
        })),
      };
    }

    const day = businessHours.find((item) => item.day_of_week === dayIndex);
    if (!day) {
      return { is_open: true, slots: [{ open_time: "09:00", close_time: "19:00" }] };
    }
    if (!day.is_open) {
      return { is_open: false, slots: [] };
    }
    return {
      is_open: true,
      slots: [{ open_time: day.open_time || "09:00", close_time: day.close_time || "19:00" }],
    };
  }, [specialDays, specialDaySlots, businessHourSlots, businessHours]);

  // Load booked slots for selected date and professional
  useEffect(() => {
    if (!selectedDate || !selectedProfessional) {
      setBookedSlots([]);
      return;
    }

    const loadBookedSlots = async () => {
      setIsLoadingSlots(true);
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
          setBookedSlots([]);
          return;
        }

        const url = `${supabaseUrl}/rest/v1/bookings?select=booking_time,total_duration_minutes,services,status&website_id=eq.${websiteId}&booking_date=eq.${selectedDate}&professional_id=eq.${selectedProfessional}&status=in.(pending,confirmed)`;
        const response = await fetch(url, {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
          },
        });

        if (!response.ok) {
          setBookedSlots([]);
          return;
        }

        const data = await response.json();
        const slots = (data || [])
          .filter((item: { booking_time?: string | null }) => item.booking_time)
          .map((item: {
            booking_time: string;
            total_duration_minutes?: number | null;
            services?: { duration_minutes?: number }[] | null;
          }) => {
            const durationFromServices = Array.isArray(item.services)
              ? item.services.reduce((sum, service) => sum + (service.duration_minutes || 0), 0)
              : 0;
            const duration = item.total_duration_minutes || durationFromServices || 30;
            const start = timeToMinutes(item.booking_time);
            return { start, end: start + duration };
          });

        setBookedSlots(slots);
      } catch {
        setBookedSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    loadBookedSlots();
  }, [selectedDate, selectedProfessional, websiteId]);

  // Generate time slots
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const schedule = getDaySchedule(selectedDate);
    if (!schedule.is_open || !schedule.slots.length) return [];

    const slots: { time: string; disabled: boolean }[] = [];
    schedule.slots.forEach((slotRange) => {
      const startMinutes = timeToMinutes(slotRange.open_time);
      const endMinutes = timeToMinutes(slotRange.close_time);

      for (let minutes = startMinutes; minutes + totalDuration <= endMinutes; minutes += SLOT_STEP_MINUTES) {
        const time = minutesToTime(minutes);
        const slotEnd = minutes + totalDuration;
        const isBlocked = bookedSlots.some((booked) => minutes < booked.end && slotEnd > booked.start);
        slots.push({ time, disabled: isBlocked });
      }
    });

    return slots;
  }, [selectedDate, getDaySchedule, totalDuration, bookedSlots]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;

    const days: { day: number | null; date: string; disabled: boolean; selected: boolean }[] = [];

    // Add empty days for offset
    for (let i = 0; i < startOffset; i++) {
      days.push({ day: null, date: "", disabled: true, selected: false });
    }

    // Add actual days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateValue = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dateObj = new Date(year, month, day);
      const schedule = getDaySchedule(dateValue);
      const disabled = dateObj < today || !schedule.is_open;
      days.push({
        day,
        date: dateValue,
        disabled,
        selected: selectedDate === dateValue,
      });
    }

    return days;
  }, [currentMonth, selectedDate, getDaySchedule]);

  // Show toast
  const showToast = (message: string, type: "error" | "success" | "warning" = "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Validation
  const validateStep = () => {
    if (currentStep === 1) {
      if (serviceCatalog.length > 0 && selectedServices.size === 0) {
        showToast("Selecciona al menos un servicio.", "warning");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!selectedProfessional) {
        showToast("Selecciona un profesional.", "warning");
        return false;
      }
      if (!selectedDate) {
        showToast("Selecciona una fecha.", "warning");
        return false;
      }
      if (!selectedTime) {
        showToast("Selecciona una hora.", "warning");
        return false;
      }
    }
    return true;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setIsSubmitting(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        showToast("Error de configuracion. Contacta con el negocio.", "error");
        return;
      }

      const data = {
        website_id: websiteId,
        customer_name: customerName,
        customer_email: customerEmail || null,
        customer_phone: customerPhone,
        booking_date: selectedDate,
        booking_time: selectedTime,
        professional_id: selectedProfessional || null,
        guests: 1,
        notes: notes || null,
        status: "confirmed",
        source: "website",
        services: selectedServicesData,
        total_price_cents: totalPrice,
        total_duration_minutes: totalDuration,
      };

      const response = await fetch(`${supabaseUrl}/rest/v1/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast("Cita reservada correctamente. Te contactaremos para confirmar.", "success");
        // Reset form
        setSelectedServices(new Set());
        setSelectedTime("");
        setCustomerName("");
        setCustomerPhone("");
        setCustomerEmail("");
        setNotes("");
        setCurrentStep(1);
      } else {
        const errorText = await response.text();
        showToast(`Error al reservar: ${errorText || "Intentalo de nuevo"}`, "error");
      }
    } catch {
      showToast("Error de red. Intentalo de nuevo.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleService = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
    setSelectedTime("");
  };

  return (
    <section id="reservar" className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">{title}</h2>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          {/* Stepper */}
          <div className="flex justify-center gap-4 mb-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                    currentStep >= step
                      ? "bg-pink-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                <span className="text-xs mt-1 text-gray-500">
                  {step === 1 ? "Servicios" : step === 2 ? "Fecha" : "Contacto"}
                </span>
              </div>
            ))}
          </div>

          {/* Step 1: Services */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Selecciona servicios</h3>
                <p className="text-sm text-gray-500 mb-4">Elige uno o varios servicios para tu cita.</p>
              </div>

              {serviceCatalog.length > 0 ? (
                <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                  {serviceCatalog.map((category) => (
                    <div key={category.id} className="bg-gray-50 rounded-xl p-4">
                      <h4 className="font-semibold mb-3">{category.name}</h4>
                      <div className="grid gap-3">
                        {category.items.map((item) => (
                          <label
                            key={item.id}
                            className={`flex items-center justify-between p-4 bg-white rounded-lg cursor-pointer border-2 transition-colors ${
                              selectedServices.has(item.id)
                                ? "border-pink-500"
                                : "border-transparent hover:border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedServices.has(item.id)}
                                onChange={() => toggleService(item.id)}
                                className="w-5 h-5 text-pink-500 rounded"
                              />
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.notes && (
                                  <div className="text-sm text-gray-500">{item.notes}</div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">{(item.price_cents / 100).toFixed(2)}€</div>
                              <div className="text-sm text-gray-500">{item.duration_minutes} min</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay servicios configurados.</p>
              )}
            </div>
          )}

          {/* Step 2: Date & Time */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Professional selection */}
              {professionals.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Selecciona profesional</h4>
                  {availableProfessionals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {availableProfessionals.map((prof) => (
                        <label
                          key={prof.id}
                          className={`px-4 py-2 rounded-full cursor-pointer border-2 transition-colors ${
                            selectedProfessional === prof.id
                              ? "border-pink-500 bg-pink-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="professional"
                            value={prof.id}
                            checked={selectedProfessional === prof.id}
                            onChange={() => {
                              setSelectedProfessional(prof.id);
                              setSelectedTime("");
                            }}
                            className="sr-only"
                          />
                          {prof.name}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-orange-600">No hay profesionales disponibles para estos servicios.</p>
                  )}
                </div>
              )}

              {/* Calendar and time */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Calendar */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                      className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
                    >
                      &lt;
                    </button>
                    <span className="font-semibold">
                      {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                      className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50"
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                    {["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"].map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, i) => (
                      <button
                        key={i}
                        type="button"
                        disabled={day.disabled || day.day === null}
                        onClick={() => {
                          if (day.date) {
                            setSelectedDate(day.date);
                            setSelectedTime("");
                          }
                        }}
                        className={`w-8 h-8 rounded-full text-sm transition-colors ${
                          day.day === null
                            ? "invisible"
                            : day.disabled
                            ? "text-gray-300 cursor-not-allowed"
                            : day.selected
                            ? "bg-pink-500 text-white"
                            : "hover:bg-gray-200"
                        }`}
                      >
                        {day.day}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time slots */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold mb-3">Hora</h4>
                  {isLoadingSlots ? (
                    <p className="text-sm text-gray-500">Cargando disponibilidad...</p>
                  ) : timeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          type="button"
                          disabled={slot.disabled}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                            slot.disabled
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : selectedTime === slot.time
                              ? "bg-pink-500 text-white"
                              : "bg-white hover:bg-gray-100"
                          }`}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  ) : selectedDate ? (
                    <p className="text-sm text-gray-500">No hay horas disponibles para este dia.</p>
                  ) : (
                    <p className="text-sm text-gray-500">Selecciona una fecha primero.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Contact */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-3">Resumen</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Servicios</span>
                    <span className="font-medium">
                      {selectedServicesData.map((s) => s.name).join(", ") || "Sin seleccionar"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Fecha y hora</span>
                    <span className="font-medium">
                      {selectedDate && selectedTime ? `${selectedDate} - ${selectedTime}` : "Sin seleccionar"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total</span>
                    <span className="font-semibold text-pink-600">{(totalPrice / 100).toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* Contact form */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email (opcional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas adicionales</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none resize-none"
                  placeholder="Describe lo que buscas, referencias, etc."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="px-6 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep()) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="px-6 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 transition-colors"
              >
                Continuar
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg bg-pink-500 text-white hover:bg-pink-600 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Enviando..." : "Confirmar reserva"}
              </button>
            )}
          </div>

          <p className="text-center text-sm text-gray-400 mt-4">
            Te confirmaremos la cita por telefono o WhatsApp.
          </p>
        </form>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : toast.type === "warning"
                ? "bg-yellow-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <span>{toast.type === "success" ? "✓" : toast.type === "warning" ? "⚠" : "✕"}</span>
            <span>{toast.message}</span>
          </div>
        )}
      </div>
    </section>
  );
}
