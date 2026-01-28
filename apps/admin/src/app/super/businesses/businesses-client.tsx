"use client";

import { useState } from "react";
import {
  createBusiness,
  updateBusiness,
  deleteBusiness,
  type BusinessWithWebsite,
} from "@/lib/actions/businesses";
import { ConfirmDialog } from "@/components/mobile/ConfirmDialog";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurante" },
  { value: "salon", label: "Peluqueria" },
  { value: "clinic", label: "Clinica" },
  { value: "fitness", label: "Gimnasio" },
  { value: "shop", label: "Tienda" },
  { value: "repairs", label: "Reformas" },
  { value: "realestate", label: "Inmobiliaria" },
];

const THEMES = [
  { value: "neuglass", label: "Neuglass (Light)" },
  { value: "neuglass-dark", label: "Neuglass Dark" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "elegant", label: "Elegant" },
  { value: "rustic", label: "Rustic" },
];

interface BusinessesClientProps {
  initialBusinesses: BusinessWithWebsite[];
}

export function BusinessesClient({ initialBusinesses }: BusinessesClientProps) {
  const [businesses, setBusinesses] =
    useState<BusinessWithWebsite[]>(initialBusinesses);
  const [showForm, setShowForm] = useState(false);
  const [editingBusiness, setEditingBusiness] =
    useState<BusinessWithWebsite | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Estado para dialog de confirmacion
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    businessId: string | null;
    businessName: string;
  }>({
    isOpen: false,
    businessId: null,
    businessName: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filteredBusinesses = businesses.filter(
    (b) =>
      b.business_name.toLowerCase().includes(search.toLowerCase()) ||
      b.email.toLowerCase().includes(search.toLowerCase()) ||
      b.website?.domain?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      if (editingBusiness) {
        const result = await updateBusiness(editingBusiness.id, formData);
        if (result.error) {
          alert(result.error);
        } else {
          // Actualizar lista local
          setBusinesses(
            businesses.map((b) =>
              b.id === editingBusiness.id
                ? {
                    ...b,
                    business_name: formData.get("business_name") as string,
                    business_type: formData.get("business_type") as BusinessWithWebsite["business_type"],
                    email: formData.get("email") as string,
                    phone: formData.get("phone") as string || null,
                    website: b.website
                      ? {
                          ...b.website,
                          domain: formData.get("domain") as string,
                          is_active: formData.get("is_active") === "true",
                          theme: formData.get("theme") as string,
                        }
                      : null,
                  }
                : b
            )
          );
          closeForm();
        }
      } else {
        const result = await createBusiness(formData);
        if (result.error) {
          alert(result.error);
        } else {
          // Recargar para obtener nuevo negocio con ID correcto
          window.location.reload();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  function openDeleteDialog(business: BusinessWithWebsite) {
    setDeleteDialog({
      isOpen: true,
      businessId: business.id,
      businessName: business.business_name,
    });
  }

  async function handleDelete() {
    if (!deleteDialog.businessId) return;

    setDeleteLoading(true);
    try {
      const result = await deleteBusiness(deleteDialog.businessId);
      if (result.error) {
        alert(result.error);
      } else {
        setBusinesses(
          businesses.filter((b) => b.id !== deleteDialog.businessId)
        );
        setDeleteDialog({ isOpen: false, businessId: null, businessName: "" });
      }
    } finally {
      setDeleteLoading(false);
    }
  }

  function openEdit(business: BusinessWithWebsite) {
    setEditingBusiness(business);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingBusiness(null);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function getBusinessTypeLabel(type: string) {
    return BUSINESS_TYPES.find((t) => t.value === type)?.label || type;
  }

  return (
    <>
      {/* Barra de acciones */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Buscar negocio, email o dominio..."
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
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo negocio
        </button>
      </div>

      {/* Contador */}
      <div className="text-sm text-[var(--text-secondary)]">
        {filteredBusinesses.length} de {businesses.length} negocios
      </div>

      {/* Lista de negocios */}
      {filteredBusinesses.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent)]/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[var(--accent)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">
            {search
              ? "No se encontraron negocios"
              : "No hay negocios todavia"}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {search
              ? "Prueba con otra busqueda"
              : "Crea el primer negocio para empezar"}
          </p>
        </div>
      ) : (
        <div className="neumor-card overflow-hidden">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Negocio</th>
                  <th>Tipo</th>
                  <th>Dominio</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((business) => (
                  <tr key={business.id}>
                    <td>
                      <div>
                        <div className="font-medium">{business.business_name}</div>
                        <div className="text-sm text-[var(--text-secondary)]">
                          {business.email}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)]">
                        {getBusinessTypeLabel(business.business_type)}
                      </span>
                    </td>
                    <td>
                      {business.website?.domain ? (
                        <a
                          href={`https://${business.website.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--accent)] hover:underline"
                        >
                          {business.website.domain}
                        </a>
                      ) : (
                        <span className="text-[var(--text-secondary)]">-</span>
                      )}
                    </td>
                    <td>
                      {business.website?.is_active ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      {formatDate(business.created_at)}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(business)}
                          className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteDialog(business)}
                          className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
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
          <div className="neumor-card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                {editingBusiness ? "Editar negocio" : "Nuevo negocio"}
              </h2>
              <button
                onClick={closeForm}
                className="p-2 hover:bg-[var(--neumor-bg)] rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seccion: Datos del negocio */}
              <div className="border-b border-[var(--shadow-light)] pb-4 mb-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                  Datos del negocio
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nombre del negocio *
                    </label>
                    <input
                      type="text"
                      name="business_name"
                      required
                      minLength={2}
                      defaultValue={editingBusiness?.business_name || ""}
                      className="neumor-input w-full"
                      placeholder="Mi Restaurante"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tipo de negocio *
                    </label>
                    <select
                      name="business_type"
                      required
                      defaultValue={editingBusiness?.business_type || "restaurant"}
                      className="neumor-input w-full"
                    >
                      {BUSINESS_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      defaultValue={editingBusiness?.email || ""}
                      className="neumor-input w-full"
                      placeholder="contacto@negocio.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={editingBusiness?.phone || ""}
                      className="neumor-input w-full"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>
              </div>

              {/* Seccion: Website */}
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
                  Configuracion del website
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Dominio *
                    </label>
                    <input
                      type="text"
                      name="domain"
                      required
                      minLength={3}
                      defaultValue={editingBusiness?.website?.domain || ""}
                      className="neumor-input w-full"
                      placeholder="mi-negocio.neumorstudio.com"
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Subdominio o dominio personalizado
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Tema
                    </label>
                    <select
                      name="theme"
                      defaultValue={editingBusiness?.website?.theme || "neuglass"}
                      className="neumor-input w-full"
                    >
                      {THEMES.map((theme) => (
                        <option key={theme.value} value={theme.value}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      name="is_active"
                      id="is_active"
                      value="true"
                      defaultChecked={editingBusiness?.website?.is_active ?? true}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium">
                      Website activo
                    </label>
                  </div>
                </div>
              </div>

              {/* Botones */}
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
                  {loading
                    ? "Guardando..."
                    : editingBusiness
                    ? "Guardar cambios"
                    : "Crear negocio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog de confirmacion para eliminar */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() =>
          setDeleteDialog({ isOpen: false, businessId: null, businessName: "" })
        }
        onConfirm={handleDelete}
        title="Eliminar negocio"
        description={`Estas seguro de que quieres eliminar "${deleteDialog.businessName}"? Esta accion eliminara todos los datos asociados (reservas, clientes, etc.) y no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={deleteLoading}
      />
    </>
  );
}
