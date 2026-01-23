"use client";

import { useState } from "react";
import { createClientPackage, updateClientPackage, deleteClientPackage } from "@/lib/actions/client-packages";

interface Customer {
  id: string;
  name: string;
  email: string | null;
}

interface ClientPackage {
  id: string;
  customer_id: string;
  name: string;
  total_sessions: number | null;
  used_sessions: number;
  remaining_sessions: number | null;
  price_cents: number;
  valid_from: string;
  valid_until: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  customers?: Customer;
}

interface PaquetesClientProps {
  initialPackages: ClientPackage[];
  customers: Customer[];
}

export function PaquetesClient({ initialPackages, customers }: PaquetesClientProps) {
  const [packages, setPackages] = useState(initialPackages);
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ClientPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "completed">("all");

  const filteredPackages = packages.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (editingPackage) {
        const result = await updateClientPackage(editingPackage.id, formData);
        if (result.error) {
          alert(result.error);
        } else {
          window.location.reload();
        }
      } else {
        const result = await createClientPackage(formData);
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
    if (!confirm("¿Seguro que quieres eliminar este paquete?")) return;

    const result = await deleteClientPackage(id);
    if (result.error) {
      alert(result.error);
    } else {
      setPackages(packages.filter((p) => p.id !== id));
    }
  }

  function openEdit(pkg: ClientPackage) {
    setEditingPackage(pkg);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingPackage(null);
  }

  function formatPrice(cents: number) {
    return (cents / 100).toFixed(2) + " €";
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      active: "bg-green-100 text-green-700",
      expired: "bg-red-100 text-red-700",
      completed: "bg-blue-100 text-blue-700",
      cancelled: "bg-gray-100 text-gray-600",
    };
    const labels: Record<string, string> = {
      active: "Activo",
      expired: "Expirado",
      completed: "Completado",
      cancelled: "Cancelado",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.cancelled}`}>
        {labels[status] || status}
      </span>
    );
  }

  function getCustomerName(pkg: ClientPackage) {
    return pkg.customers?.name || "Cliente desconocido";
  }

  return (
    <>
      {/* Barra de acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2">
          {(["all", "active", "expired", "completed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filter === f
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--neumor-bg)] hover:bg-[var(--neumor-shadow)]"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Activos" : f === "expired" ? "Expirados" : "Completados"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo paquete
        </button>
      </div>

      {/* Lista de paquetes */}
      {filteredPackages.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {filter === "all" ? "No hay paquetes todavia" : `No hay paquetes ${filter === "active" ? "activos" : filter === "expired" ? "expirados" : "completados"}`}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {filter === "all" ? "Crea el primer bono o paquete de sesiones" : "Cambia el filtro para ver otros paquetes"}
          </p>
        </div>
      ) : (
        <div className="neumor-card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Paquete</th>
                  <th>Sesiones</th>
                  <th>Precio</th>
                  <th>Validez</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPackages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td className="font-medium">{getCustomerName(pkg)}</td>
                    <td>{pkg.name}</td>
                    <td>
                      {pkg.total_sessions ? (
                        <span>
                          {pkg.used_sessions}/{pkg.total_sessions}
                          <span className="text-[var(--text-secondary)] text-xs ml-1">
                            ({pkg.remaining_sessions} rest.)
                          </span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)]">Ilimitado</span>
                      )}
                    </td>
                    <td>{formatPrice(pkg.price_cents)}</td>
                    <td>
                      <span className="text-sm">
                        {new Date(pkg.valid_from).toLocaleDateString("es-ES")}
                        {pkg.valid_until && (
                          <> - {new Date(pkg.valid_until).toLocaleDateString("es-ES")}</>
                        )}
                      </span>
                    </td>
                    <td>{getStatusBadge(pkg.status)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(pkg)}
                          className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(pkg.id)}
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

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingPackage ? "Editar paquete" : "Nuevo paquete"}
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
                <select
                  name="customer_id"
                  required
                  defaultValue={editingPackage?.customer_id || ""}
                  className="neumor-input w-full"
                  disabled={!!editingPackage}
                >
                  <option value="">Selecciona cliente</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.email && `(${c.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Nombre del paquete *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingPackage?.name || ""}
                  className="neumor-input w-full"
                  placeholder="Ej: Bono 10 sesiones"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Total sesiones</label>
                  <input
                    type="number"
                    name="total_sessions"
                    defaultValue={editingPackage?.total_sessions || ""}
                    className="neumor-input w-full"
                    min="1"
                    placeholder="Vacio = ilimitado"
                  />
                </div>
                {editingPackage && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Sesiones usadas</label>
                    <input
                      type="number"
                      name="used_sessions"
                      defaultValue={editingPackage?.used_sessions || 0}
                      className="neumor-input w-full"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Precio (centimos) *</label>
                <input
                  type="number"
                  name="price_cents"
                  required
                  defaultValue={editingPackage?.price_cents || ""}
                  className="neumor-input w-full"
                  min="0"
                  placeholder="30000 = 300€"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Valido desde</label>
                  <input
                    type="date"
                    name="valid_from"
                    defaultValue={editingPackage?.valid_from || new Date().toISOString().split("T")[0]}
                    className="neumor-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valido hasta</label>
                  <input
                    type="date"
                    name="valid_until"
                    defaultValue={editingPackage?.valid_until || ""}
                    className="neumor-input w-full"
                  />
                </div>
              </div>

              {editingPackage && (
                <div>
                  <label className="block text-sm font-medium mb-1">Estado</label>
                  <select
                    name="status"
                    defaultValue={editingPackage?.status || "active"}
                    className="neumor-input w-full"
                  >
                    <option value="active">Activo</option>
                    <option value="expired">Expirado</option>
                    <option value="completed">Completado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  name="notes"
                  defaultValue={editingPackage?.notes || ""}
                  className="neumor-input w-full"
                  rows={2}
                  placeholder="Notas internas..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 neumor-btn px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 neumor-btn-primary px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  {loading ? "Guardando..." : editingPackage ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
