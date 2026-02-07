"use client";

/**
 * RestaurantReservasMobile - Vista móvil simplificada para RESTAURANT
 * 
 * CORRECCIONES IMPLEMENTADAS:
 * 1. Fecha activa desde query param (no siempre "hoy")
 * 2. Navegación entre días (anterior/siguiente)
 * 3. Botón para ir al calendario
 * 
 * IMPORTANTE: Este componente SOLO se renderiza cuando isRestaurantMobile === true
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Phone, User, FileText, Pencil, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { SegmentedControl } from "@/components/mobile";

// Reutilizar tipos del ReservasClient original
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

type MealFilter = "all" | "comida" | "cena";

interface RestaurantReservasMobileProps {
  bookings: Booking[];
  isPending: boolean;
  onEdit: (booking: Booking) => void;
  onConfirm: (bookingId: string) => void;
  onCancel: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  getStatusBadge: (status: string) => React.ReactNode;
  // Funciones reutilizadas del componente padre
  formatDate: (dateStr: string) => string;
  formatTime: (timeStr: string | null) => string;
  getTimeBucket: (bookingTime: string | null) => string;
  getRelativeLabel: (dateStr: string, timeStr: string | null) => string | null;
  // CORRECCIÓN 1: Fecha activa desde query param
  activeDate: string;
}

const MEAL_FILTERS: { value: MealFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "comida", label: "Comida" },
  { value: "cena", label: "Cena" },
];

export function RestaurantReservasMobile({
  bookings,
  isPending,
  onEdit,
  onConfirm,
  onCancel,
  onComplete,
  getStatusBadge,
  formatDate,
  formatTime,
  getTimeBucket,
  getRelativeLabel,
  activeDate, // CORRECCIÓN 1: Recibir fecha activa como prop
}: RestaurantReservasMobileProps) {
  const router = useRouter();
  const [mealFilter, setMealFilter] = useState<MealFilter>("all");

  // CORRECCIÓN 2: Helpers para navegación de fechas
  const todayIso = new Date().toISOString().split("T")[0];
  
  const parseLocalDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const toIsoDate = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // Navegar al día anterior
  const goToPreviousDay = () => {
    const currentDate = parseLocalDate(activeDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const newDate = toIsoDate(currentDate);
    router.push(`/dashboard/reservas?date=${newDate}`);
  };

  // Navegar al día siguiente
  const goToNextDay = () => {
    const currentDate = parseLocalDate(activeDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const newDate = toIsoDate(currentDate);
    router.push(`/dashboard/reservas?date=${newDate}`);
  };

  // Ir al calendario
  const goToCalendar = () => {
    router.push("/dashboard/calendario");
  };

  // Formatear fecha activa para mostrar
  const activeDateFormatted = useMemo(() => {
    const date = parseLocalDate(activeDate);
    const isToday = activeDate === todayIso;
    return {
      full: date.toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }),
      isToday,
    };
  }, [activeDate, todayIso]);

  // CORRECCIÓN 1: Filtrar reservas por fecha activa (no siempre hoy)
  const dayBookings = useMemo(() => {
    return bookings.filter((booking) => booking.booking_date === activeDate);
  }, [bookings, activeDate]);

  // Agrupar por franja horaria (reutilizando getTimeBucket)
  const bookingsByMeal = useMemo(() => {
    const comida: Booking[] = [];
    const cena: Booking[] = [];

    dayBookings.forEach((booking) => {
      const bucket = getTimeBucket(booking.booking_time);
      // Mañana y Tarde = Comida, Noche = Cena
      if (bucket === "Mañana" || bucket === "Tarde") {
        comida.push(booking);
      } else if (bucket === "Noche") {
        cena.push(booking);
      }
    });

    return { comida, cena };
  }, [dayBookings, getTimeBucket]);

  // Reservas filtradas según pestaña activa
  const filteredBookings = useMemo(() => {
    switch (mealFilter) {
      case "comida":
        return bookingsByMeal.comida;
      case "cena":
        return bookingsByMeal.cena;
      case "all":
      default:
        return dayBookings;
    }
  }, [mealFilter, bookingsByMeal, dayBookings]);

  // Contadores para badges
  const comidaCount = bookingsByMeal.comida.length;
  const cenaCount = bookingsByMeal.cena.length;
  const allCount = dayBookings.length;

  // Opciones de filtro con contadores
  const filterOptions = useMemo(() => [
    { value: "all" as MealFilter, label: "Todas", count: allCount },
    { value: "comida" as MealFilter, label: "Comida", count: comidaCount },
    { value: "cena" as MealFilter, label: "Cena", count: cenaCount },
  ], [allCount, comidaCount, cenaCount]);

  return (
    <div className="restaurant-reservas-mobile">
      {/* CORRECCIÓN 2: Header con navegación entre días */}
      <div className="restaurant-reservas-date">
        <button
          onClick={goToPreviousDay}
          className="restaurant-reservas-nav-btn"
          aria-label="Día anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="restaurant-reservas-date-content">
          <Calendar className="w-5 h-5" />
          <span className="capitalize">
            {activeDateFormatted.full}
            {activeDateFormatted.isToday && (
              <span className="restaurant-reservas-today-badge">Hoy</span>
            )}
          </span>
        </div>
        
        <button
          onClick={goToNextDay}
          className="restaurant-reservas-nav-btn"
          aria-label="Día siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Botón para ir al calendario */}
      <button
        onClick={goToCalendar}
        className="restaurant-reservas-calendar-btn"
      >
        <CalendarDays className="w-4 h-4" />
        <span>Ver en calendario</span>
      </button>

      {/* Pestañas: Todas, Comida, Cena */}
      <div className="restaurant-reservas-tabs">
        <SegmentedControl
          options={filterOptions.map((opt) => ({
            value: opt.value,
            label: opt.label,
            count: opt.count,
          }))}
          value={mealFilter}
          onChange={(value) => setMealFilter(value as MealFilter)}
        />
      </div>

      {/* Lista de reservas */}
      <div className="restaurant-reservas-list">
        {filteredBookings.length === 0 ? (
          <div className="restaurant-reservas-empty">
            <Calendar className="w-12 h-12" />
            <p>No hay reservas para {mealFilter === "all" ? "este día" : mealFilter}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings
              .sort((a, b) => (a.booking_time || "99:99").localeCompare(b.booking_time || "99:99"))
              .map((booking) => (
                <div
                  key={booking.id}
                  className={`restaurant-reservas-card ${isPending ? "opacity-50" : ""}`}
                >
                  {/* Header de la card */}
                  <div className="restaurant-reservas-card-header">
                    <div className="restaurant-reservas-card-title">
                      <h3>{booking.customer_name}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <button
                      className="neumor-btn p-2"
                      onClick={() => onEdit(booking)}
                      aria-label="Editar reserva"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>

                  {/* Info */}
                  <div className="restaurant-reservas-card-info">
                    <div className="restaurant-reservas-card-row">
                      <Phone className="w-4 h-4" />
                      {booking.customer_phone ? (
                        <a href={`tel:${booking.customer_phone}`}>
                          {booking.customer_phone}
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </div>
                    <div className="restaurant-reservas-card-row">
                      <User className="w-4 h-4" />
                      <span>
                        {booking.guests} {booking.guests === 1 ? "persona" : "personas"}
                      </span>
                    </div>
                    <div className="restaurant-reservas-card-row">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatTime(booking.booking_time)}
                        {getRelativeLabel(booking.booking_date, booking.booking_time)
                          ? ` · ${getRelativeLabel(booking.booking_date, booking.booking_time)}`
                          : ""}
                        {` · ${getTimeBucket(booking.booking_time)}`}
                      </span>
                    </div>
                    {booking.notes?.trim() && (
                      <div className="restaurant-reservas-card-row">
                        <FileText className="w-4 h-4" />
                        <span className="line-clamp-1">{booking.notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="restaurant-reservas-card-actions">
                    {booking.status === "pending" && (
                      <>
                        <button
                          className="neumor-btn neumor-btn-accent flex-1"
                          onClick={() => onConfirm(booking.id)}
                          disabled={isPending}
                        >
                          Confirmar
                        </button>
                        <button
                          className="neumor-btn flex-1 text-red-600"
                          onClick={() => onCancel(booking.id)}
                          disabled={isPending}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        className="neumor-btn neumor-btn-accent flex-1"
                        onClick={() => onComplete(booking.id)}
                        disabled={isPending}
                      >
                        Completar
                      </button>
                    )}
                    {(booking.status === "cancelled" || booking.status === "completed") && (
                      <div className="restaurant-reservas-card-status">
                        {booking.status === "cancelled" ? "Reserva cancelada" : "Reserva completada"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
