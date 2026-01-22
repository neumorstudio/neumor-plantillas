"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob, updateJob, deleteJob, updateJobStatus } from "@/lib/actions/jobs";
import { createPayment } from "@/lib/actions/payments";

interface Job {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  address: string | null;
  description: string | null;
  status: string;
  estimated_end_date: string | null;
  actual_end_date: string | null;
  notes: string | null;
  total_amount: number | null;
  created_at: string;
}

interface TrabajosClientProps {
  initialJobs: Job[];
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente", color: "badge-pending" },
  { value: "in_progress", label: "En curso", color: "badge-confirmed" },
  { value: "waiting_material", label: "Esperando material", color: "badge-pending" },
  { value: "completed", label: "Finalizado", color: "badge-confirmed" },
  { value: "cancelled", label: "Cancelado", color: "badge-cancelled" },
];

export function TrabajosClient({ initialJobs }: TrabajosClientProps) {
  const router = useRouter();
  const [jobs, setJobs] = useState(initialJobs);
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [creatingPaymentFor, setCreatingPaymentFor] = useState<string | null>(null);

  const filteredJobs = jobs.filter((j) => {
    if (filter === "all") return true;
    if (filter === "active") return ["pending", "in_progress", "waiting_material"].includes(j.status);
    return j.status === filter;
  });

  function getStatusBadge(status: string) {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt || { label: status, color: "badge-pending" };
  }

  function formatAmount(cents: number | null) {
    if (!cents) return "-";
    return `${(cents / 100).toLocaleString("es-ES")} €`;
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (editingJob) {
        const result = await updateJob(editingJob.id, formData);
        if (result.error) {
          alert(result.error);
        } else {
          window.location.reload();
        }
      } else {
        const result = await createJob(formData);
        if (result.error) {
          alert(result.error);
        } else {
          window.location.reload();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que quieres eliminar este trabajo?")) return;

    const result = await deleteJob(id);
    if (result.error) {
      alert(result.error);
    } else {
      setJobs(jobs.filter((j) => j.id !== id));
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const result = await updateJobStatus(id, newStatus);
    if (result.error) {
      alert(result.error);
    } else {
      setJobs(jobs.map((j) => (j.id === id ? { ...j, status: newStatus } : j)));
    }
  }

  async function handleCreatePayment(job: Job) {
    if (!job.total_amount) {
      alert("Este trabajo no tiene importe definido");
      return;
    }

    setCreatingPaymentFor(job.id);

    try {
      const formData = new FormData();
      formData.append("client_name", job.client_name);
      formData.append("amount", (job.total_amount / 100).toString());
      formData.append("status", "pending");
      formData.append("job_id", job.id);
      formData.append("notes", `Pago por trabajo: ${job.description || job.address || ""}`);

      const result = await createPayment(formData);
      if (result.error) {
        alert(result.error);
      } else {
        router.push("/dashboard/pagos");
      }
    } finally {
      setCreatingPaymentFor(null);
    }
  }

  function openEdit(job: Job) {
    setEditingJob(job);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingJob(null);
  }

  return (
    <>
      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === "all" ? "bg-[var(--accent)] text-white" : "neumor-btn"}`}
          >
            Todos ({jobs.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === "active" ? "bg-[var(--accent)] text-white" : "neumor-btn"}`}
          >
            Activos ({jobs.filter((j) => ["pending", "in_progress", "waiting_material"].includes(j.status)).length})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === "completed" ? "bg-[var(--accent)] text-white" : "neumor-btn"}`}
          >
            Finalizados ({jobs.filter((j) => j.status === "completed").length})
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
          Nuevo trabajo
        </button>
      </div>

      {/* Lista de trabajos */}
      {filteredJobs.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">No hay trabajos</h2>
          <p className="text-[var(--text-secondary)]">
            Crea un nuevo trabajo o convierte un presupuesto aceptado
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => {
            const badge = getStatusBadge(job.status);
            return (
              <div key={job.id} className="neumor-card p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">{job.client_name}</h3>
                      <span className={`badge ${badge.color}`}>{badge.label}</span>
                    </div>
                    {job.address && (
                      <p className="text-sm text-[var(--text-secondary)] mb-1">
                        📍 {job.address}
                      </p>
                    )}
                    {job.description && (
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                        {job.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-4 mt-3 text-sm">
                      {job.total_amount && (
                        <span className="font-medium text-[var(--accent)]">
                          {formatAmount(job.total_amount)}
                        </span>
                      )}
                      {job.estimated_end_date && (
                        <span className="text-[var(--text-secondary)]">
                          Fecha estimada: {formatDate(job.estimated_end_date)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job.id, e.target.value)}
                      className="neumor-input text-sm py-1"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {job.total_amount && job.status !== "cancelled" && (
                      <button
                        onClick={() => handleCreatePayment(job)}
                        disabled={creatingPaymentFor === job.id}
                        className="p-2 hover:bg-green-100 text-green-600 rounded-lg"
                        title="Crear pago"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                          <line x1="1" y1="10" x2="23" y2="10" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(job)}
                      className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                      title="Eliminar"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingJob ? "Editar trabajo" : "Nuevo trabajo"}
              </h2>
              <button onClick={closeForm} className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Cliente *</label>
                  <input
                    type="text"
                    name="client_name"
                    required
                    defaultValue={editingJob?.client_name || ""}
                    className="neumor-input w-full"
                    placeholder="Nombre del cliente"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    name="client_email"
                    defaultValue={editingJob?.client_email || ""}
                    className="neumor-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Telefono</label>
                  <input
                    type="tel"
                    name="client_phone"
                    defaultValue={editingJob?.client_phone || ""}
                    className="neumor-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Direccion del trabajo</label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingJob?.address || ""}
                  className="neumor-input w-full"
                  placeholder="Calle, numero, ciudad..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripcion</label>
                <textarea
                  name="description"
                  defaultValue={editingJob?.description || ""}
                  className="neumor-input w-full"
                  rows={3}
                  placeholder="Descripcion del trabajo a realizar..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select
                    name="status"
                    defaultValue={editingJob?.status || "pending"}
                    className="neumor-input w-full"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Importe (€)</label>
                  <input
                    type="number"
                    name="total_amount"
                    step="0.01"
                    min="0"
                    defaultValue={editingJob?.total_amount ? (editingJob.total_amount / 100).toFixed(2) : ""}
                    className="neumor-input w-full"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fecha estimada fin</label>
                <input
                  type="date"
                  name="estimated_end_date"
                  defaultValue={editingJob?.estimated_end_date || ""}
                  className="neumor-input w-full"
                />
              </div>

              {editingJob && (
                <div>
                  <label className="block text-sm font-medium mb-1">Notas internas</label>
                  <textarea
                    name="notes"
                    defaultValue={editingJob?.notes || ""}
                    className="neumor-input w-full"
                    rows={2}
                    placeholder="Notas sobre el trabajo..."
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeForm} className="flex-1 neumor-btn px-4 py-2 rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Guardando..." : editingJob ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
