"use client";

import { useState } from "react";
import { createTrainerService, updateTrainerService, deleteTrainerService } from "@/lib/actions/trainer-services";

interface TrainerService {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  is_online: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface ServiciosClientProps {
  initialServices: TrainerService[];
}

export function ServiciosClient({ initialServices }: ServiciosClientProps) {
  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<TrainerService | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (editingService) {
        const result = await updateTrainerService(editingService.id, formData);
        if (result.error) {
          alert(result.error);
        } else {
          setServices(
            services.map((s) =>
              s.id === editingService.id
                ? {
                    ...s,
                    name: formData.get("name") as string,
                    description: formData.get("description") as string,
                    duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
                    price_cents: parseInt(formData.get("price_cents") as string) || 0,
                    is_online: formData.get("is_online") === "true",
                    is_active: formData.get("is_active") !== "false",
                  }
                : s
            )
          );
          setEditingService(null);
          setShowForm(false);
        }
      } else {
        const result = await createTrainerService(formData);
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
    if (!confirm("¿Seguro que quieres eliminar este servicio?")) return;

    const result = await deleteTrainerService(id);
    if (result.error) {
      alert(result.error);
    } else {
      setServices(services.filter((s) => s.id !== id));
    }
  }

  function openEdit(service: TrainerService) {
    setEditingService(service);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingService(null);
  }

  function formatPrice(cents: number) {
    return (cents / 100).toFixed(2) + " €";
  }

  function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }

  return (
    <>
      {/* Barra de acciones */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(true)}
          className="neumor-btn-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo servicio
        </button>
      </div>

      {/* Lista de servicios */}
      {services.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">No hay servicios configurados</h2>
          <p className="text-[var(--text-secondary)]">
            Añade los tipos de entrenamiento que ofreces
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <div key={service.id} className={`neumor-card p-5 ${!service.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {service.is_online && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">Online</span>
                    )}
                    {!service.is_active && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Inactivo</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(service)}
                    className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">
                  {formatDuration(service.duration_minutes)}
                </span>
                <span className="font-semibold text-[var(--accent)]">
                  {formatPrice(service.price_cents)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="neumor-card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingService ? "Editar servicio" : "Nuevo servicio"}
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
                  defaultValue={editingService?.name || ""}
                  className="neumor-input w-full"
                  placeholder="Ej: Entrenamiento personal 1-on-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripcion</label>
                <textarea
                  name="description"
                  defaultValue={editingService?.description || ""}
                  className="neumor-input w-full"
                  rows={3}
                  placeholder="Describe el servicio..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duracion (min)</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    defaultValue={editingService?.duration_minutes || 60}
                    className="neumor-input w-full"
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Precio (centimos)</label>
                  <input
                    type="number"
                    name="price_cents"
                    defaultValue={editingService?.price_cents || 0}
                    className="neumor-input w-full"
                    min="0"
                    placeholder="4000 = 40€"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_online"
                    value="true"
                    defaultChecked={editingService?.is_online || false}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Sesion online</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_active"
                    value="true"
                    defaultChecked={editingService?.is_active !== false}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm">Activo</span>
                </label>
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
                  {loading ? "Guardando..." : editingService ? "Guardar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
