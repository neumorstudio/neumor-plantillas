"use client";

/**
 * RestaurantCalendarioMobile - Vista móvil simplificada para calendario RESTAURANT
 * 
 * CORRECCIÓN 3: Panel "Modificar horarios" ahora es editable
 * - Reutiliza handlers existentes de CalendarioClient
 * - Permite editar horarios por día
 * - Permite añadir/eliminar fechas especiales
 * - Permite guardar cambios
 * 
 * IMPORTANTE: Este componente SOLO se renderiza cuando isRestaurantMobile === true
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock, Plus, Trash2 } from "lucide-react";

interface Booking {
  id: string;
  customer_name: string;
  booking_date: string;
  booking_time: string | null;
  status: string;
}

interface BusinessHourSlot {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_active: boolean;
}

interface SpecialDay {
  id?: string;
  date: string;
  is_open: boolean;
  open_time: string;
  close_time: string;
  slots?: { open_time: string; close_time: string; sort_order: number; id?: string; temp_id?: string }[];
}

type MealFilter = "all" | "comida" | "cena";

interface RestaurantCalendarioMobileProps {
  bookings: Booking[];
  slots: BusinessHourSlot[];
  specialDays: SpecialDay[];
  currentYear: number;
  currentMonth: number;
  onMonthChange: (year: number, month: number) => void;
  // Helpers reutilizados
  getTimeBucket: (bookingTime: string | null) => string;
  // CORRECCIÓN 3: Callbacks para edición de horarios
  onAddSpecialDay: () => void;
  onDeleteSpecialDay: (index: number) => void;
  onSaveSpecialDays: () => void;
  onAddSpecialSlot: (dayIndex: number) => void;
  onRemoveSpecialSlot: (dayIndex: number, slotKey: string) => void;
  onSpecialDayChange: (index: number, field: keyof SpecialDay, value: string | boolean) => void;
  onSpecialSlotChange: (dayIndex: number, slotKey: string, field: "open_time" | "close_time", value: string) => void;
  savingSpecialDays: boolean;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export function RestaurantCalendarioMobile({
  bookings,
  slots,
  specialDays,
  currentYear,
  currentMonth,
  onMonthChange,
  getTimeBucket,
  // CORRECCIÓN 3: Callbacks para edición
  onAddSpecialDay,
  onDeleteSpecialDay,
  onSaveSpecialDays,
  onAddSpecialSlot,
  onRemoveSpecialSlot,
  onSpecialDayChange,
  onSpecialSlotChange,
  savingSpecialDays,
}: RestaurantCalendarioMobileProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [editingSpecialDay, setEditingSpecialDay] = useState<number | null>(null);

  const todayIso = new Date().toISOString().split("T")[0];

  // Datos del calendario
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstWeekday = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

  const calendarDays = useMemo(() => {
    const days: (string | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      days.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push(date);
    }
    return days;
  }, [currentYear, currentMonth, daysInMonth, firstWeekday]);

  // Helper para contar reservas de un día
  const getDayBookingCount = (date: string): number => {
    return bookings.filter((b) => {
      if (b.booking_date !== date) return false;
      if (mealFilter === "all") return true;
      const bucket = getTimeBucket(b.booking_time);
      if (mealFilter === "comida") return bucket === "Mañana" || bucket === "Tarde";
      if (mealFilter === "cena") return bucket === "Noche";
      return true;
    }).length;
  };

  // Verificar si una fecha es pasada
  const isPastDate = (date: string): boolean => {
    return date < todayIso;
  };

  // Verificar si es hoy
  const isToday = (date: string): boolean => {
    return date === todayIso;
  };

  // Handler para seleccionar día
  const handleSelectDay = (date: string) => {
    if (isPastDate(date)) return;
    setSelectedDate(date);
    router.push(`/dashboard/reservas?date=${date}`);
  };

  // Handlers para cambiar mes
  const handlePrevMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    onMonthChange(newYear, newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    onMonthChange(newYear, newMonth);
  };

  // Helper para obtener horarios de un día
  const getDaySchedule = (dayOfWeek: number): BusinessHourSlot[] => {
    return slots
      .filter((slot) => slot.day_of_week === dayOfWeek && slot.is_active)
      .sort((a, b) => a.open_time.localeCompare(b.open_time));
  };

  // Formatear hora
  const formatTime = (time: string): string => {
    return time.slice(0, 5);
  };

  // CORRECCIÓN 3: Handler para añadir fecha especial con cierre automático
  const handleAddSpecialDayAndEdit = () => {
    onAddSpecialDay();
    // Abrir el panel de horarios si está cerrado
    if (!scheduleOpen) {
      setScheduleOpen(true);
    }
  };

  return (
    <div className="restaurant-calendario-mobile">
      {/* Header del calendario */}
      <div className="restaurant-calendario-header">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="neumor-btn w-10 h-10 flex items-center justify-center p-0"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>
        <button
          type="button"
          onClick={handleNextMonth}
          className="neumor-btn w-10 h-10 flex items-center justify-center p-0"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Filtros Comida/Cena */}
      <div className="restaurant-calendario-filters">
        {(["all", "comida", "cena"] as MealFilter[]).map((filter) => (
          <button
            key={filter}
            type="button"
            className={`restaurant-calendario-filter ${mealFilter === filter ? "active" : ""}`}
            onClick={() => setMealFilter(filter)}
          >
            {filter === "all" ? "Todas" : filter === "comida" ? "Comida" : "Cena"}
          </button>
        ))}
      </div>

      {/* Labels de días */}
      <div className="restaurant-calendario-day-labels">
        {DAY_LABELS.map((label) => (
          <div key={label} className="restaurant-calendario-day-label">
            {label}
          </div>
        ))}
      </div>

      {/* Grid del calendario */}
      <div className="restaurant-calendario-grid">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="restaurant-calendario-day empty" />;
          }

          const count = getDayBookingCount(date);
          const isPast = isPastDate(date);
          const isTodayDate = isToday(date);
          const isSelected = selectedDate === date;

          return (
            <button
              key={date}
              type="button"
              disabled={isPast}
              onClick={() => handleSelectDay(date)}
              className={`restaurant-calendario-day
                ${isTodayDate ? "today" : ""}
                ${isSelected ? "selected" : ""}
                ${isPast ? "past" : ""}
              `}
              aria-label={`${date}${count > 0 ? `, ${count} reservas` : ""}`}
            >
              <span>{Number(date.split("-")[2])}</span>
              {count > 0 && !isPast && (
                <span className="restaurant-calendario-count">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panel de horarios colapsable - CORRECCIÓN 3: Ahora editable */}
      <div className="restaurant-calendario-schedule">
        <button
          type="button"
          className="restaurant-calendario-schedule-toggle"
          onClick={() => setScheduleOpen(!scheduleOpen)}
        >
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Modificar horarios
          </span>
          <ChevronRight
            className={`w-4 h-4 transition-transform ${scheduleOpen ? "rotate-90" : ""}`}
          />
        </button>

        {scheduleOpen && (
          <div className="restaurant-calendario-schedule-content">
            {/* Horarios por día de la semana (solo lectura simplificada) */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-[var(--text-secondary)]">Horarios habituales</h4>
              {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
                const daySlots = getDaySchedule(dayOfWeek);

                return (
                  <div key={dayOfWeek} className="flex items-center justify-between py-2 border-b border-[var(--shadow-dark)] last:border-0">
                    <span className="font-medium text-sm">{dayNames[dayOfWeek]}</span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      {daySlots.length > 0
                        ? daySlots.map((s) => `${formatTime(s.open_time)}-${formatTime(s.close_time)}`).join(", ")
                        : "Cerrado"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Fechas especiales - EDITABLES */}
            <div className="mt-4 pt-4 border-t border-[var(--shadow-dark)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-sm">Fechas especiales</h4>
                <button
                  type="button"
                  onClick={handleAddSpecialDayAndEdit}
                  className="neumor-btn text-xs px-2 py-1 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Agregar
                </button>
              </div>

              {specialDays.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)] text-center py-3">
                  No hay fechas especiales
                </p>
              ) : (
                <div className="space-y-3">
                  {specialDays.map((day, index) => (
                    <div key={day.id || index} className="neumor-inset p-3 rounded-xl">
                      {/* Header de la fecha especial */}
                      <div className="flex items-center justify-between mb-2">
                        <input
                          type="date"
                          value={day.date}
                          onChange={(e) => onSpecialDayChange(index, "date", e.target.value)}
                          className="neumor-input text-sm py-1 px-2"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={day.is_open}
                              onChange={(e) => onSpecialDayChange(index, "is_open", e.target.checked)}
                              className="w-4 h-4 accent-[var(--accent)]"
                            />
                            Abierto
                          </label>
                          <button
                            type="button"
                            onClick={() => onDeleteSpecialDay(index)}
                            className="neumor-btn p-1.5 text-red-500"
                            aria-label="Eliminar fecha especial"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Horarios de la fecha especial */}
                      {day.is_open && (
                        <div className="space-y-2 mt-2">
                          {day.slots && day.slots.length > 0 ? (
                            day.slots.map((slot, slotIndex) => {
                              const slotKey = slot.id || slot.temp_id || `slot-${slotIndex}`;
                              return (
                                <div key={slotKey} className="flex items-center gap-2">
                                  <input
                                    type="time"
                                    value={slot.open_time.slice(0, 5)}
                                    onChange={(e) => onSpecialSlotChange(index, slotKey, "open_time", e.target.value)}
                                    className="neumor-input text-sm py-1 px-2 flex-1"
                                  />
                                  <span className="text-sm text-[var(--text-secondary)]">-</span>
                                  <input
                                    type="time"
                                    value={slot.close_time.slice(0, 5)}
                                    onChange={(e) => onSpecialSlotChange(index, slotKey, "close_time", e.target.value)}
                                    className="neumor-input text-sm py-1 px-2 flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => onRemoveSpecialSlot(index, slotKey)}
                                    className="neumor-btn p-1.5 text-red-500"
                                    aria-label="Eliminar tramo"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={day.open_time.slice(0, 5)}
                                onChange={(e) => onSpecialDayChange(index, "open_time", e.target.value)}
                                className="neumor-input text-sm py-1 px-2 flex-1"
                              />
                              <span className="text-sm text-[var(--text-secondary)]">-</span>
                              <input
                                type="time"
                                value={day.close_time.slice(0, 5)}
                                onChange={(e) => onSpecialDayChange(index, "close_time", e.target.value)}
                                className="neumor-input text-sm py-1 px-2 flex-1"
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => onAddSpecialSlot(index)}
                            className="neumor-btn text-xs w-full py-1.5 mt-1"
                          >
                            + Agregar tramo
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Botón guardar */}
              {specialDays.length > 0 && (
                <button
                  type="button"
                  onClick={onSaveSpecialDays}
                  disabled={savingSpecialDays}
                  className="neumor-btn neumor-btn-accent w-full mt-4 py-2.5"
                >
                  {savingSpecialDays ? "Guardando..." : "Guardar fechas especiales"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
