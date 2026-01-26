"use client";

import { useMemo, useState } from "react";
import { createSession, updateSession, deleteSession, completeSession } from "@/lib/actions/sessions";
import { Plus, ChevronLeft, ChevronRight, Clock, User, Pencil, Trash2, Check, X, Calendar, Dumbbell, CreditCard, FileText } from "lucide-react";
import { BottomSheet, ConfirmDialog } from "@/components/mobile";

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

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

interface TrainerService {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
}

interface ClientPackage {
  id: string;
  customer_id: string;
  name: string;
  remaining_sessions: number | null;
}

interface Session {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  booking_date: string;
  booking_time: string | null;
  service_id: string | null;
  package_id: string | null;
  duration_minutes: number | null;
  status: string;
  session_notes: string | null;
  workout_summary: string | null;
  is_paid: boolean;
  created_at: string;
  customers?: Customer;
  trainer_services?: TrainerService;
  client_packages?: { id: string; name: string; remaining_sessions: number | null };
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
  initialSlots: BusinessHourSlot[];
  initialSessions: Session[];
  initialSpecialDays: SpecialDay[];
  customers: Customer[];
  services: TrainerService[];
  packages: ClientPackage[];
  year: number;
  month: number;
}

const dayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

export function CalendarioFitnessClient({
  initialHours,
  initialSlots,
  initialSessions,
  initialSpecialDays,
  customers,
  services,
  packages,
  year,
  month,
}: Props) {
  const createTempId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
  const [calendarYear, setCalendarYear] = useState(year);
  const [calendarMonth, setCalendarMonth] = useState(month);
  const [sessions, setSessions] = useState<Session[]>(initialSessions);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>(initialSpecialDays);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [completingSession, setCompletingSession] = useState<Session | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    sessionId: string;
    action: "delete" | "cancel";
  }>({ isOpen: false, sessionId: "", action: "delete" });

  // Form fields
  const [formCustomerId, setFormCustomerId] = useState("");
  const [formServiceId, setFormServiceId] = useState("");
  const [formPackageId, setFormPackageId] = useState("");
  const [formTime, setFormTime] = useState("09:00");
  const [formNotes, setFormNotes] = useState("");

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

  const sessionsForDay = useMemo(() => {
    if (!selectedDate) return [];
    return sessions
      .filter((session) => session.booking_date === selectedDate)
      .sort((a, b) => {
        const timeA = a.booking_time || "99:99";
        const timeB = b.booking_time || "99:99";
        return timeA.localeCompare(timeB);
      });
  }, [sessions, selectedDate]);

  const getSessionCountForDate = (date: string) =>
    sessions.filter((s) => s.booking_date === date).length;

  const getCustomerPackages = (customerId: string) =>
    packages.filter((p) => p.customer_id === customerId);

  const fetchSessions = async (nextYear: number, nextMonth: number) => {
    setLoadingSessions(true);
    try {
      const response = await fetch(
        `/api/sessions?year=${nextYear}&month=${nextMonth}`
      );
      if (response.ok) {
        const data = await response.json();
        setSessions(Array.isArray(data) ? data : []);
      }
    } catch {
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handlePrevMonth = () => {
    const nextMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
    const nextYear = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
    setCalendarMonth(nextMonth);
    setCalendarYear(nextYear);
    setSelectedDate(null);
    fetchSessions(nextYear, nextMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const nextYear = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
    setCalendarMonth(nextMonth);
    setCalendarYear(nextYear);
    setSelectedDate(null);
    fetchSessions(nextYear, nextMonth);
  };

  const resetForm = () => {
    setFormCustomerId("");
    setFormServiceId("");
    setFormPackageId("");
    setFormTime("09:00");
    setFormNotes("");
    setFormError(null);
  };

  const openNewSessionForm = () => {
    resetForm();
    setEditingSession(null);
    setShowForm(true);
  };

  const openEditForm = (session: Session) => {
    setEditingSession(session);
    setFormCustomerId(session.customer_id || "");
    setFormServiceId(session.service_id || "");
    setFormPackageId(session.package_id || "");
    setFormTime(session.booking_time || "09:00");
    setFormNotes(session.session_notes || "");
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    setSaving(true);
    setFormError(null);

    const formData = new FormData();
    formData.append("customer_id", formCustomerId);
    formData.append("service_id", formServiceId);
    formData.append("package_id", formPackageId);
    formData.append("booking_date", selectedDate);
    formData.append("booking_time", formTime);
    formData.append("session_notes", formNotes);

    // Get customer name for display
    const customer = customers.find((c) => c.id === formCustomerId);
    if (customer) {
      formData.append("customer_name", customer.name);
    }

    try {
      if (editingSession) {
        const result = await updateSession(editingSession.id, formData);
        if (result.error) {
          setFormError(result.error);
        } else {
          setShowForm(false);
          fetchSessions(calendarYear, calendarMonth);
        }
      } else {
        const result = await createSession(formData);
        if (result.error) {
          setFormError(result.error);
        } else {
          setShowForm(false);
          fetchSessions(calendarYear, calendarMonth);
        }
      }
    } catch {
      setFormError("Error al guardar la sesion");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    const result = await deleteSession(sessionId);
    if (!result.error) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
    setConfirmDialog({ isOpen: false, sessionId: "", action: "delete" });
  };

  const openCompleteForm = (session: Session) => {
    setCompletingSession(session);
    setShowCompleteForm(true);
  };

  const handleComplete = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!completingSession) return;

    setSaving(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await completeSession(completingSession.id, formData);
      if (result.error) {
        setFormError(result.error);
      } else {
        setShowCompleteForm(false);
        setCompletingSession(null);
        fetchSessions(calendarYear, calendarMonth);
      }
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string, isPaid: boolean) => {
    const badges = [];

    switch (status) {
      case "confirmed":
        badges.push(<span key="status" className="badge badge-confirmed">Confirmada</span>);
        break;
      case "pending":
        badges.push(<span key="status" className="badge badge-pending">Pendiente</span>);
        break;
      case "completed":
        badges.push(<span key="status" className="badge badge-confirmed">Completada</span>);
        break;
      case "cancelled":
        badges.push(<span key="status" className="badge badge-cancelled">Cancelada</span>);
        break;
      default:
        badges.push(<span key="status" className="badge">{status}</span>);
    }

    if (isPaid) {
      badges.push(<span key="paid" className="badge badge-confirmed ml-1">Pagada</span>);
    }

    return <div className="flex flex-wrap gap-1">{badges}</div>;
  };

  const formatPrice = (cents: number) => `${(cents / 100).toFixed(2)} EUR`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold mb-1">Calendario</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestiona tu agenda de entrenamientos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="neumor-card p-4 sm:p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevMonth}
                className="neumor-btn p-2"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold capitalize">{monthLabel}</h2>
              <button
                onClick={handleNextMonth}
                className="neumor-btn p-2"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayLabels.map((label) => (
                <div key={label} className="text-center text-xs font-medium text-[var(--text-secondary)] py-2">
                  {label}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-12 sm:h-16" />;
                }

                const isToday = date === todayIso;
                const isSelected = date === selectedDate;
                const sessionCount = getSessionCountForDate(date);
                const dayNum = parseInt(date.split("-")[2], 10);

                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`
                      h-12 sm:h-16 rounded-lg flex flex-col items-center justify-center gap-1
                      transition-all text-sm relative
                      ${isSelected ? "day-selected" : "neumor-inset"}
                      ${isToday && !isSelected ? "ring-2 ring-[var(--accent)]" : ""}
                    `}
                  >
                    <span className={isSelected ? "font-bold" : ""}>{dayNum}</span>
                    {sessionCount > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isSelected ? "bg-white/30 text-white" : "bg-[var(--accent)] text-white"
                      }`}>
                        {sessionCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {loadingSessions && (
              <div className="text-center text-sm text-[var(--text-secondary)] py-4">
                Cargando sesiones...
              </div>
            )}
          </div>
        </div>

        {/* Sessions for selected day */}
        <div className="lg:col-span-1">
          <div className="neumor-card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                {selectedDate
                  ? new Date(selectedDate + "T12:00:00").toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    })
                  : "Selecciona un dia"}
              </h3>
              {selectedDate && (
                <button
                  onClick={openNewSessionForm}
                  className="neumor-btn neumor-btn-accent p-2"
                  aria-label="Nueva sesion"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>

            {sessionsForDay.length === 0 ? (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Sin sesiones</p>
                {selectedDate && (
                  <button
                    onClick={openNewSessionForm}
                    className="neumor-btn neumor-btn-accent mt-4 text-sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Programar sesion
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {sessionsForDay.map((session) => (
                  <div key={session.id} className="neumor-card-sm p-3 space-y-2">
                    {/* Time and status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--accent)]" />
                        <span className="font-medium">{session.booking_time || "Sin hora"}</span>
                      </div>
                      {getStatusBadge(session.status, session.is_paid)}
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span>{session.customer_name || session.customers?.name || "Sin cliente"}</span>
                    </div>

                    {/* Service */}
                    {session.trainer_services && (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <Dumbbell className="w-4 h-4" />
                        <span>{session.trainer_services.name}</span>
                        <span className="text-xs">({session.trainer_services.duration_minutes} min)</span>
                      </div>
                    )}

                    {/* Package */}
                    {session.client_packages && (
                      <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <CreditCard className="w-4 h-4" />
                        <span>{session.client_packages.name}</span>
                        {session.client_packages.remaining_sessions !== null && (
                          <span className="text-xs">({session.client_packages.remaining_sessions} restantes)</span>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {session.session_notes && (
                      <div className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{session.session_notes}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-[var(--shadow-dark)]">
                      {session.status === "confirmed" && (
                        <button
                          onClick={() => openCompleteForm(session)}
                          className="neumor-btn neumor-btn-accent flex-1 text-xs py-2"
                        >
                          <Check className="w-3 h-3 mr-1" />
                          Completar
                        </button>
                      )}
                      <button
                        onClick={() => openEditForm(session)}
                        className="neumor-btn flex-1 text-xs py-2"
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ isOpen: true, sessionId: session.id, action: "delete" })}
                        className="neumor-btn text-xs py-2 text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Session Form */}
      <BottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingSession ? "Editar sesion" : "Nueva sesion"}
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-100 text-red-700 text-sm flex items-center gap-2">
              <X className="w-4 h-4" />
              {formError}
            </div>
          )}

          {/* Customer select */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Cliente *</label>
            <select
              value={formCustomerId}
              onChange={(e) => {
                setFormCustomerId(e.target.value);
                setFormPackageId(""); // Reset package when customer changes
              }}
              className="neumor-input w-full"
              required
            >
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Service select */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Servicio</label>
            <select
              value={formServiceId}
              onChange={(e) => setFormServiceId(e.target.value)}
              className="neumor-input w-full"
            >
              <option value="">Seleccionar servicio</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {formatPrice(service.price_cents)} ({service.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Package select (filtered by customer) */}
          {formCustomerId && getCustomerPackages(formCustomerId).length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Paquete (opcional)</label>
              <select
                value={formPackageId}
                onChange={(e) => setFormPackageId(e.target.value)}
                className="neumor-input w-full"
              >
                <option value="">Sin paquete</option>
                {getCustomerPackages(formCustomerId).map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.remaining_sessions ?? "∞"} sesiones restantes)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Time */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Hora *</label>
            <input
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              className="neumor-input w-full"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Notas</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="neumor-input w-full min-h-[80px] resize-none"
              placeholder="Notas para la sesion..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="neumor-btn flex-1 py-3"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="neumor-btn neumor-btn-accent flex-1 py-3"
            >
              {saving ? "Guardando..." : editingSession ? "Guardar" : "Crear"}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Complete Session Form */}
      <BottomSheet
        isOpen={showCompleteForm}
        onClose={() => {
          setShowCompleteForm(false);
          setCompletingSession(null);
        }}
        title="Completar sesion"
      >
        {completingSession && (
          <form onSubmit={handleComplete} className="p-5 space-y-4">
            <div className="neumor-inset p-3 rounded-lg">
              <p className="text-sm text-[var(--text-secondary)]">
                <strong>{completingSession.customer_name}</strong> - {completingSession.booking_time}
              </p>
              {completingSession.trainer_services && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {completingSession.trainer_services.name}
                </p>
              )}
            </div>

            {/* Workout summary */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Resumen del entrenamiento</label>
              <textarea
                name="workout_summary"
                className="neumor-input w-full min-h-[100px] resize-none"
                placeholder="Ejercicios realizados, series, repeticiones..."
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Duracion real (minutos)</label>
              <input
                type="number"
                name="duration_minutes"
                defaultValue={completingSession.trainer_services?.duration_minutes || 60}
                className="neumor-input w-full"
                min="1"
              />
            </div>

            {/* Is paid */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_paid"
                id="is_paid"
                defaultChecked={completingSession.is_paid}
                className="w-5 h-5 accent-[var(--accent)]"
              />
              <label htmlFor="is_paid" className="text-sm font-medium">Sesion pagada</label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowCompleteForm(false);
                  setCompletingSession(null);
                }}
                className="neumor-btn flex-1 py-3"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="neumor-btn neumor-btn-accent flex-1 py-3"
              >
                {saving ? "Completando..." : "Completar sesion"}
              </button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, sessionId: "", action: "delete" })}
        onConfirm={() => handleDelete(confirmDialog.sessionId)}
        title="Eliminar sesion"
        description="¿Estas seguro de eliminar esta sesion? Esta accion no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
