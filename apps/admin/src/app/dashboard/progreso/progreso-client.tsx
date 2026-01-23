"use client";

import { useState, useEffect } from "react";
import { createClientProgress, deleteClientProgress, createClientRecord, deleteClientRecord } from "@/lib/actions/client-progress";

interface Customer {
  id: string;
  name: string;
  email: string | null;
}

interface ProgressEntry {
  id: string;
  recorded_at: string;
  weight_kg: number | null;
  body_fat_percent: number | null;
  muscle_mass_kg: number | null;
  chest_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  arm_left_cm: number | null;
  arm_right_cm: number | null;
  thigh_left_cm: number | null;
  thigh_right_cm: number | null;
  calf_cm: number | null;
  notes: string | null;
}

interface RecordEntry {
  id: string;
  exercise_name: string;
  record_value: number;
  record_unit: string;
  previous_value: number | null;
  achieved_at: string;
  notes: string | null;
}

interface ProgresoClientProps {
  customers: Customer[];
}

export function ProgresoClient({ customers }: ProgresoClientProps) {
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"progress" | "records">("progress");

  // Cargar datos cuando se selecciona un cliente
  useEffect(() => {
    if (selectedCustomer) {
      loadClientData(selectedCustomer);
    } else {
      setProgress([]);
      setRecords([]);
    }
  }, [selectedCustomer]);

  async function loadClientData(customerId: string) {
    setLoading(true);
    try {
      const [progressRes, recordsRes] = await Promise.all([
        fetch(`/api/progress/${customerId}`),
        fetch(`/api/records/${customerId}`),
      ]);

      if (progressRes.ok) {
        const data = await progressRes.json();
        setProgress(data);
      }
      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data);
      }
    } catch {
      console.error("Error loading client data");
    } finally {
      setLoading(false);
    }
  }

  async function handleProgressSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("customer_id", selectedCustomer);

    try {
      const result = await createClientProgress(formData);
      if (result.error) {
        alert(result.error);
      } else {
        setShowProgressForm(false);
        loadClientData(selectedCustomer);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRecordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.set("customer_id", selectedCustomer);

    try {
      const result = await createClientRecord(formData);
      if (result.error) {
        alert(result.error);
      } else {
        setShowRecordForm(false);
        loadClientData(selectedCustomer);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProgress(id: string) {
    if (!confirm("¿Eliminar este registro de progreso?")) return;
    const result = await deleteClientProgress(id);
    if (result.error) {
      alert(result.error);
    } else {
      setProgress(progress.filter((p) => p.id !== id));
    }
  }

  async function handleDeleteRecord(id: string) {
    if (!confirm("¿Eliminar este record?")) return;
    const result = await deleteClientRecord(id);
    if (result.error) {
      alert(result.error);
    } else {
      setRecords(records.filter((r) => r.id !== id));
    }
  }

  const selectedCustomerData = customers.find((c) => c.id === selectedCustomer);

  return (
    <>
      {/* Selector de cliente */}
      <div className="neumor-card p-4">
        <label className="block text-sm font-medium mb-2">Selecciona un cliente</label>
        <select
          value={selectedCustomer}
          onChange={(e) => setSelectedCustomer(e.target.value)}
          className="neumor-input w-full max-w-md"
        >
          <option value="">-- Seleccionar cliente --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {c.email && `(${c.email})`}
            </option>
          ))}
        </select>
      </div>

      {!selectedCustomer ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">Selecciona un cliente</h2>
          <p className="text-[var(--text-secondary)]">
            Elige un cliente para ver y registrar su progreso
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-[var(--neumor-shadow)]">
            <button
              onClick={() => setActiveTab("progress")}
              className={`px-4 py-2 -mb-px transition-colors ${
                activeTab === "progress"
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Medidas corporales
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-4 py-2 -mb-px transition-colors ${
                activeTab === "records"
                  ? "border-b-2 border-[var(--accent)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Records personales
            </button>
          </div>

          {/* Contenido de tabs */}
          {activeTab === "progress" ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Historial de medidas - {selectedCustomerData?.name}</h3>
                <button
                  onClick={() => setShowProgressForm(true)}
                  className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nueva medicion
                </button>
              </div>

              {loading ? (
                <div className="neumor-card p-8 text-center">
                  <p className="text-[var(--text-secondary)]">Cargando...</p>
                </div>
              ) : progress.length === 0 ? (
                <div className="neumor-card p-8 text-center">
                  <p className="text-[var(--text-secondary)]">No hay registros de medidas</p>
                </div>
              ) : (
                <div className="neumor-card overflow-hidden">
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Peso</th>
                          <th>% Grasa</th>
                          <th>Pecho</th>
                          <th>Cintura</th>
                          <th>Cadera</th>
                          <th className="text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {progress.map((p) => (
                          <tr key={p.id}>
                            <td>{new Date(p.recorded_at).toLocaleDateString("es-ES")}</td>
                            <td>{p.weight_kg ? `${p.weight_kg} kg` : "-"}</td>
                            <td>{p.body_fat_percent ? `${p.body_fat_percent}%` : "-"}</td>
                            <td>{p.chest_cm ? `${p.chest_cm} cm` : "-"}</td>
                            <td>{p.waist_cm ? `${p.waist_cm} cm` : "-"}</td>
                            <td>{p.hips_cm ? `${p.hips_cm} cm` : "-"}</td>
                            <td>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleDeleteProgress(p.id)}
                                  className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                  title="Eliminar"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">Records personales - {selectedCustomerData?.name}</h3>
                <button
                  onClick={() => setShowRecordForm(true)}
                  className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Nuevo record
                </button>
              </div>

              {loading ? (
                <div className="neumor-card p-8 text-center">
                  <p className="text-[var(--text-secondary)]">Cargando...</p>
                </div>
              ) : records.length === 0 ? (
                <div className="neumor-card p-8 text-center">
                  <p className="text-[var(--text-secondary)]">No hay records registrados</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {records.map((r) => (
                    <div key={r.id} className="neumor-card p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold">{r.exercise_name}</h4>
                        <button
                          onClick={() => handleDeleteRecord(r.id)}
                          className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                      <div className="text-2xl font-bold text-[var(--accent)]">
                        {r.record_value} {r.record_unit}
                      </div>
                      {r.previous_value && (
                        <div className="text-sm text-green-600 mt-1">
                          +{(r.record_value - r.previous_value).toFixed(1)} {r.record_unit} vs anterior
                        </div>
                      )}
                      <div className="text-xs text-[var(--text-secondary)] mt-2">
                        {new Date(r.achieved_at).toLocaleDateString("es-ES")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal formulario progreso */}
      {showProgressForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Nueva medicion</h2>
              <button onClick={() => setShowProgressForm(false)} className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleProgressSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  name="recorded_at"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="neumor-input w-full"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Peso (kg)</label>
                  <input type="number" name="weight_kg" step="0.1" className="neumor-input w-full" placeholder="75.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">% Grasa</label>
                  <input type="number" name="body_fat_percent" step="0.1" className="neumor-input w-full" placeholder="18.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Masa musc. (kg)</label>
                  <input type="number" name="muscle_mass_kg" step="0.1" className="neumor-input w-full" placeholder="35.2" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Pecho (cm)</label>
                  <input type="number" name="chest_cm" step="0.1" className="neumor-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cintura (cm)</label>
                  <input type="number" name="waist_cm" step="0.1" className="neumor-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cadera (cm)</label>
                  <input type="number" name="hips_cm" step="0.1" className="neumor-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Brazo izq. (cm)</label>
                  <input type="number" name="arm_left_cm" step="0.1" className="neumor-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Brazo der. (cm)</label>
                  <input type="number" name="arm_right_cm" step="0.1" className="neumor-input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Muslo izq. (cm)</label>
                  <input type="number" name="thigh_left_cm" step="0.1" className="neumor-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Muslo der. (cm)</label>
                  <input type="number" name="thigh_right_cm" step="0.1" className="neumor-input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gemelo (cm)</label>
                  <input type="number" name="calf_cm" step="0.1" className="neumor-input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea name="notes" className="neumor-input w-full" rows={2} placeholder="Observaciones..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowProgressForm(false)} className="flex-1 neumor-btn px-4 py-2 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50">
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal formulario record */}
      {showRecordForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Nuevo record personal</h2>
              <button onClick={() => setShowRecordForm(false)} className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ejercicio *</label>
                <input
                  type="text"
                  name="exercise_name"
                  required
                  className="neumor-input w-full"
                  placeholder="Ej: Sentadilla, Press Banca, Peso Muerto"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valor *</label>
                  <input
                    type="number"
                    name="record_value"
                    required
                    step="0.1"
                    className="neumor-input w-full"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unidad</label>
                  <select name="record_unit" defaultValue="kg" className="neumor-input w-full">
                    <option value="kg">kg</option>
                    <option value="reps">repeticiones</option>
                    <option value="segundos">segundos</option>
                    <option value="metros">metros</option>
                    <option value="min">minutos</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor anterior (opcional)</label>
                <input
                  type="number"
                  name="previous_value"
                  step="0.1"
                  className="neumor-input w-full"
                  placeholder="Para calcular mejora"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha</label>
                <input
                  type="date"
                  name="achieved_at"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="neumor-input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea name="notes" className="neumor-input w-full" rows={2} placeholder="Detalles del record..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowRecordForm(false)} className="flex-1 neumor-btn px-4 py-2 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50">
                  {loading ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
