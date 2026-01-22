"use client";

import { useState } from "react";
import { createPayment, updatePayment, deletePayment, markPaymentAsPaid } from "@/lib/actions/payments";

interface Payment {
  id: string;
  client_name: string;
  amount: number;
  method: string | null;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  job_id: string | null;
  created_at: string;
}

interface PagosClientProps {
  initialPayments: Payment[];
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pendiente", color: "badge-pending" },
  { value: "paid", label: "Pagado", color: "badge-confirmed" },
  { value: "partial", label: "Pago parcial", color: "badge-pending" },
];

const METHOD_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "bizum", label: "Bizum" },
  { value: "card", label: "Tarjeta" },
];

export function PagosClient({ initialPayments }: PagosClientProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const filteredPayments = payments.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  // Calcular totales
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0) / 100;
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0) / 100;

  function getStatusBadge(status: string) {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt || { label: status, color: "badge-pending" };
  }

  function getMethodLabel(method: string | null) {
    if (!method) return "-";
    const opt = METHOD_OPTIONS.find((o) => o.value === method);
    return opt?.label || method;
  }

  function formatAmount(cents: number) {
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
    if (editingPayment) {
      formData.append("current_status", editingPayment.status);
    }

    try {
      if (editingPayment) {
        const result = await updatePayment(editingPayment.id, formData);
        if (result.error) {
          alert(result.error);
        } else {
          window.location.reload();
        }
      } else {
        const result = await createPayment(formData);
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
    if (!confirm("¿Seguro que quieres eliminar este pago?")) return;

    const result = await deletePayment(id);
    if (result.error) {
      alert(result.error);
    } else {
      setPayments(payments.filter((p) => p.id !== id));
    }
  }

  async function handleMarkPaid(id: string) {
    const result = await markPaymentAsPaid(id);
    if (result.error) {
      alert(result.error);
    } else {
      setPayments(
        payments.map((p) =>
          p.id === id ? { ...p, status: "paid", paid_at: new Date().toISOString() } : p
        )
      );
    }
  }

  function openEdit(payment: Payment) {
    setEditingPayment(payment);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPayment(null);
  }

  return (
    <>
      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4">
        <div className="neumor-card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Pendiente de cobro</p>
          <p className="text-2xl font-bold text-orange-600">{totalPending.toLocaleString("es-ES")} €</p>
        </div>
        <div className="neumor-card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Cobrado total</p>
          <p className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString("es-ES")} €</p>
        </div>
      </div>

      {/* Filtros y acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === "all" ? "bg-[var(--accent)] text-white" : "neumor-btn"}`}
          >
            Todos ({payments.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === "pending" ? "bg-[var(--accent)] text-white" : "neumor-btn"}`}
          >
            Pendientes ({payments.filter((p) => p.status === "pending").length})
          </button>
          <button
            onClick={() => setFilter("paid")}
            className={`px-3 py-1.5 rounded-lg text-sm ${filter === "paid" ? "bg-[var(--accent)] text-white" : "neumor-btn"}`}
          >
            Pagados ({payments.filter((p) => p.status === "paid").length})
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
          Nuevo pago
        </button>
      </div>

      {/* Lista de pagos */}
      {filteredPayments.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">No hay pagos</h2>
          <p className="text-[var(--text-secondary)]">
            Registra tu primer pago para empezar a llevar el control
          </p>
        </div>
      ) : (
        <div className="neumor-card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Importe</th>
                  <th>Metodo</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => {
                  const badge = getStatusBadge(payment.status);
                  return (
                    <tr key={payment.id}>
                      <td className="font-medium">{payment.client_name}</td>
                      <td className="font-semibold">{formatAmount(payment.amount)}</td>
                      <td>{getMethodLabel(payment.method)}</td>
                      <td>{formatDate(payment.due_date)}</td>
                      <td>
                        <span className={`badge ${badge.color}`}>{badge.label}</span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-2">
                          {payment.status === "pending" && (
                            <button
                              onClick={() => handleMarkPaid(payment.id)}
                              className="p-2 hover:bg-green-100 text-green-600 rounded-lg"
                              title="Marcar como pagado"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(payment)}
                            className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(payment.id)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingPayment ? "Editar pago" : "Nuevo pago"}
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
                <label className="block text-sm font-medium mb-1">Cliente *</label>
                <input
                  type="text"
                  name="client_name"
                  required
                  defaultValue={editingPayment?.client_name || ""}
                  className="neumor-input w-full"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Importe (€) *</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    step="0.01"
                    min="0"
                    defaultValue={editingPayment ? (editingPayment.amount / 100).toFixed(2) : ""}
                    className="neumor-input w-full"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Metodo</label>
                  <select
                    name="method"
                    defaultValue={editingPayment?.method || ""}
                    className="neumor-input w-full"
                  >
                    <option value="">Sin especificar</option>
                    {METHOD_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select
                    name="status"
                    defaultValue={editingPayment?.status || "pending"}
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
                  <label className="block text-sm font-medium mb-1">Vencimiento</label>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={editingPayment?.due_date || ""}
                    className="neumor-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  name="notes"
                  defaultValue={editingPayment?.notes || ""}
                  className="neumor-input w-full"
                  rows={2}
                  placeholder="Concepto, detalles..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeForm} className="flex-1 neumor-btn px-4 py-2 rounded-lg">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Guardando..." : editingPayment ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
