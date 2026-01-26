"use client";

import { useState, useEffect } from "react";
import { createSession, updateSession, deleteSession, completeSession, updateSessionStatus } from "@/lib/actions/sessions";
import { Plus, ChevronLeft, ChevronRight, Clock, User, Pencil, Trash2, Check, X, Calendar } from "lucide-react";
import { BottomSheet, ConfirmDialog } from "@/components/mobile";

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
  customers?: Customer;
}

interface Session {
  id: string;
  booking_date: string;
  booking_time: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_id: string | null;
  package_id: string | null;
  duration_minutes: number | null;
  status: string;
  session_notes: string | null;
  workout_summary: string | null;
  is_paid: boolean;
  customers?: Customer;
  trainer_services?: TrainerService;
}

interface SesionesClientProps {
  initialSessions: Session[];
  customers: Customer[];
  services: TrainerService[];
  packages: ClientPackage[];
}

export function SesionesClient({ initialSessions, customers, services, packages }: SesionesClientProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [showForm, setShowForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [completingSession, setCompletingSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customerPackages, setCustomerPackages] = useState<ClientPackage[]>([]);

  // Filtrar paquetes del cliente seleccionado
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerPackages(packages.filter((p) => p.customer_id === selectedCustomer));
    } else {
      setCustomerPackages([]);
    }
  }, [selectedCustomer, packages]);

  // Cargar sesiones de la fecha seleccionada
  async function loadSessions(date: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/sessions?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch {
      console.error("Error loading sessions");
    } finally {
      setLoading(false);
    }
  }

  // Recargar al cambiar fecha
  useEffect(() => {
    loadSessions(selectedDate);
  }, [selectedDate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (editingSession) {
        const result = await updateSession(editingSession.id, formData);
        if (result.error) {
          alert(result.error);
        } else {
          setShowForm(false);
          setEditingSession(null);
          loadSessions(selectedDate);
        }
      } else {
        const result = await createSession(formData);
        if (result.error) {
          alert(result.error);
        } else {
          setShowForm(false);
          loadSessions(selectedDate);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!completingSession) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await completeSession(completingSession.id, formData);
      if (result.error) {
        alert(result.error);
      } else {
        setShowCompleteForm(false);
        setCompletingSession(null);
        loadSessions(selectedDate);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(session: Session, newStatus: string) {
    const result = await updateSessionStatus(session.id, newStatus);
    if (result.error) {
      alert(result.error);
    } else {
      loadSessions(selectedDate);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que quieres eliminar esta sesion?")) return;

    const result = await deleteSession(id);
    if (result.error) {
      alert(result.error);
    } else {
      setSessions(sessions.filter((s) => s.id !== id));
    }
  }

  function openEdit(session: Session) {
    setEditingSession(session);
    setSelectedCustomer(session.customer_id || "");
    setShowForm(true);
  }

  function openComplete(session: Session) {
    setCompletingSession(session);
    setShowCompleteForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSession(null);
    setSelectedCustomer("");
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      confirmed: "bg-blue-100 text-blue-700",
      completed: "bg-green-100 text-green-700",
      cancelled: "bg-red-100 text-red-700",
      no_show: "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      completed: "Completada",
      cancelled: "Cancelada",
      no_show: "No asistio",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  }

  function formatTime(time: string) {
    return time.slice(0, 5);
  }

  // Autocompletar datos del cliente
  function handleCustomerSelect(customerId: string) {
    setSelectedCustomer(customerId);
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      const nameInput = document.querySelector('input[name="customer_name"]') as HTMLInputElement;
      const emailInput = document.querySelector('input[name="customer_email"]') as HTMLInputElement;
      const phoneInput = document.querySelector('input[name="customer_phone"]') as HTMLInputElement;
      if (nameInput) nameInput.value = customer.name;
      if (emailInput) emailInput.value = customer.email || "";
      if (phoneInput) phoneInput.value = customer.phone || "";
    }
  }

  return (
    <>
      {/* Selector de fecha y acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }}
            className="p-2 neumor-btn rounded-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="neumor-input"
          />
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }}
            className="p-2 neumor-btn rounded-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
            className="px-3 py-1.5 text-sm neumor-btn rounded-lg"
          >
            Hoy
          </button>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nueva sesion
        </button>
      </div>

      {/* Fecha seleccionada */}
      <div className="text-lg font-semibold">
        {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>

      {/* Lista de sesiones */}
      {loading ? (
        <div className="neumor-card p-8 text-center">
          <p className="text-[var(--text-secondary)]">Cargando...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">No hay sesiones para este dia</h2>
          <p className="text-[var(--text-secondary)]">
            Programa una nueva sesion de entrenamiento
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions
            .sort((a, b) => a.booking_time.localeCompare(b.booking_time))
            .map((session) => (
              <div key={session.id} className={`neumor-card p-4 ${session.status === "cancelled" ? "opacity-60" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatTime(session.booking_time)}</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {session.duration_minutes || 60} min
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold">{session.customer_name}</div>
                      {session.trainer_services && (
                        <div className="text-sm text-[var(--text-secondary)]">
                          {session.trainer_services.name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(session.status)}
                        {session.is_paid && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Pagado</span>
                        )}
                        {session.package_id && (
                          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Bono</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.status !== "completed" && session.status !== "cancelled" && (
                      <>
                        <button
                          onClick={() => openComplete(session)}
                          className="px-3 py-1.5 text-sm bg-green-100 text-green-700 hover:bg-green-200 rounded-lg transition-colors"
                          title="Completar sesion"
                        >
                          Completar
                        </button>
                        <button
                          onClick={() => handleStatusChange(session, "cancelled")}
                          className="px-3 py-1.5 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
                          title="Cancelar sesion"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openEdit(session)}
                      className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {session.session_notes && (
                  <div className="mt-3 pt-3 border-t border-[var(--neumor-shadow)] text-sm text-[var(--text-secondary)]">
                    {session.session_notes}
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {/* Modal nueva/editar sesion */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingSession ? "Editar sesion" : "Nueva sesion"}
              </h2>
              <button onClick={closeForm} className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Cliente existente</label>
                <select
                  name="customer_id"
                  value={selectedCustomer}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="neumor-input w-full"
                >
                  <option value="">-- Cliente nuevo --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  name="customer_name"
                  required
                  defaultValue={editingSession?.customer_name || ""}
                  className="neumor-input w-full"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="customer_email"
                    defaultValue={editingSession?.customer_email || ""}
                    className="neumor-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input
                    type="tel"
                    name="customer_phone"
                    defaultValue={editingSession?.customer_phone || ""}
                    className="neumor-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Fecha *</label>
                  <input
                    type="date"
                    name="booking_date"
                    required
                    defaultValue={editingSession?.booking_date || selectedDate}
                    className="neumor-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hora *</label>
                  <input
                    type="time"
                    name="booking_time"
                    required
                    defaultValue={editingSession?.booking_time?.slice(0, 5) || ""}
                    className="neumor-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Servicio</label>
                <select
                  name="service_id"
                  defaultValue={editingSession?.service_id || ""}
                  className="neumor-input w-full"
                >
                  <option value="">-- Sin servicio --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.duration_minutes}min - {(s.price_cents / 100).toFixed(2)}€)
                    </option>
                  ))}
                </select>
              </div>

              {customerPackages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Usar paquete/bono</label>
                  <select
                    name="package_id"
                    defaultValue={editingSession?.package_id || ""}
                    className="neumor-input w-full"
                  >
                    <option value="">-- Sesion suelta --</option>
                    {customerPackages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.remaining_sessions ?? "∞"} sesiones rest.)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Duracion (min)</label>
                <input
                  type="number"
                  name="duration_minutes"
                  defaultValue={editingSession?.duration_minutes || 60}
                  className="neumor-input w-full"
                  min="15"
                  step="15"
                />
              </div>

              {editingSession && (
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select
                    name="status"
                    defaultValue={editingSession?.status || "confirmed"}
                    className="neumor-input w-full"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="no_show">No asistio</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  name="session_notes"
                  defaultValue={editingSession?.session_notes || ""}
                  className="neumor-input w-full"
                  rows={2}
                  placeholder="Notas para la sesion..."
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_paid"
                  value="true"
                  defaultChecked={editingSession?.is_paid || false}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm">Sesion pagada</span>
              </label>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeForm} className="flex-1 neumor-btn px-4 py-2 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50">
                  {loading ? "Guardando..." : editingSession ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal completar sesion */}
      {showCompleteForm && completingSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Completar sesion</h2>
              <button onClick={() => { setShowCompleteForm(false); setCompletingSession(null); }} className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-3 bg-[var(--neumor-bg)] rounded-lg">
              <div className="font-medium">{completingSession.customer_name}</div>
              <div className="text-sm text-[var(--text-secondary)]">
                {formatTime(completingSession.booking_time)} - {completingSession.trainer_services?.name || "Sesion"}
              </div>
            </div>

            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resumen del entrenamiento</label>
                <textarea
                  name="workout_summary"
                  className="neumor-input w-full"
                  rows={4}
                  placeholder="Ejercicios realizados, series, repeticiones, pesos..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas adicionales</label>
                <textarea
                  name="session_notes"
                  defaultValue={completingSession.session_notes || ""}
                  className="neumor-input w-full"
                  rows={2}
                  placeholder="Observaciones, proximos pasos..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCompleteForm(false); setCompletingSession(null); }}
                  className="flex-1 neumor-btn px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Completar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
