"use client";

import { useState } from "react";
import { createCustomer, updateCustomer, deleteCustomer } from "@/lib/actions/customers";

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

interface ClientesClientProps {
  initialCustomers: Customer[];
}

export function ClientesClient({ initialCustomers }: ClientesClientProps) {
  const [customers, setCustomers] = useState(initialCustomers);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (editingCustomer) {
        const result = await updateCustomer(editingCustomer.id, formData);
        if (result.error) {
          alert(result.error);
        } else {
          // Actualizar lista local
          setCustomers(
            customers.map((c) =>
              c.id === editingCustomer.id
                ? {
                    ...c,
                    name: formData.get("name") as string,
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string,
                    address: formData.get("address") as string,
                    notes: formData.get("notes") as string,
                  }
                : c
            )
          );
          setEditingCustomer(null);
          setShowForm(false);
        }
      } else {
        const result = await createCustomer(formData);
        if (result.error) {
          alert(result.error);
        } else {
          // Recargar página para obtener nuevo cliente
          window.location.reload();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Seguro que quieres eliminar este cliente?")) return;

    const result = await deleteCustomer(id);
    if (result.error) {
      alert(result.error);
    } else {
      setCustomers(customers.filter((c) => c.id !== id));
    }
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingCustomer(null);
  }

  return (
    <>
      {/* Barra de acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neumor-input w-full pl-10"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo cliente
        </button>
      </div>

      {/* Lista de clientes */}
      {filteredCustomers.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {search ? "No se encontraron clientes" : "No hay clientes todavia"}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {search ? "Prueba con otra busqueda" : "Anade tu primer cliente para empezar"}
          </p>
        </div>
      ) : (
        <div className="neumor-card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Telefono</th>
                  <th>Direccion</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="font-medium">{customer.name}</td>
                    <td>{customer.email || "-"}</td>
                    <td>{customer.phone || "-"}</td>
                    <td className="max-w-[200px] truncate">{customer.address || "-"}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(customer)}
                          className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
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
                {editingCustomer ? "Editar cliente" : "Nuevo cliente"}
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
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={editingCustomer?.name || ""}
                  className="neumor-input w-full"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingCustomer?.email || ""}
                  className="neumor-input w-full"
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Telefono</label>
                <input
                  type="tel"
                  name="phone"
                  defaultValue={editingCustomer?.phone || ""}
                  className="neumor-input w-full"
                  placeholder="+34 600 000 000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Direccion</label>
                <input
                  type="text"
                  name="address"
                  defaultValue={editingCustomer?.address || ""}
                  className="neumor-input w-full"
                  placeholder="Calle, numero, ciudad..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  name="notes"
                  defaultValue={editingCustomer?.notes || ""}
                  className="neumor-input w-full"
                  rows={3}
                  placeholder="Notas internas sobre el cliente..."
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
                  {loading ? "Guardando..." : editingCustomer ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
