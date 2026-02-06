"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/mobile";

type ServiceItem = {
  id: string;
  category_id: string;
  website_id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  notes: string | null;
  sort_order: number;
  is_active: boolean;
};

type ServiceCategory = {
  id: string;
  website_id: string;
  name: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
  items: ServiceItem[];
};

interface Props {
  initialCategories: ServiceCategory[];
}

// Iconos disponibles para las categorías
const CATEGORY_ICONS = [
  {
    id: "scissors",
    label: "Tijeras",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>`,
  },
  {
    id: "palette",
    label: "Paleta",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Z"/><path d="m9 15 3-3 3 3"/><circle cx="12" cy="10" r="2"/></svg>`,
  },
  {
    id: "clock",
    label: "Reloj",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>`,
  },
  {
    id: "user",
    label: "Usuario",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  },
  {
    id: "heart",
    label: "Corazon",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  },
  {
    id: "star",
    label: "Estrella",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  },
  {
    id: "sparkles",
    label: "Brillos",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/><path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z"/><path d="M19 5l.5 1.5L21 7l-1.5.5L19 9l-.5-1.5L17 7l1.5-.5L19 5z"/></svg>`,
  },
  {
    id: "hand",
    label: "Mano",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v0"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v2"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,
  },
  {
    id: "flower",
    label: "Flor",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2a3 3 0 0 0 0 6 3 3 0 0 0 0 6"/><path d="M12 16a3 3 0 0 0 0 6"/><path d="M2 12a3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M16 12a3 3 0 0 0 6 0"/></svg>`,
  },
  {
    id: "droplet",
    label: "Gota",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>`,
  },
  {
    id: "sun",
    label: "Sol",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  },
  {
    id: "brush",
    label: "Pincel",
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 4V2h-4v4h2v2h2V4z"/><path d="M14 4H6a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h8"/><path d="m14 10 3.5 10.5a1 1 0 0 1-1 1.5h-1a1 1 0 0 1-1-.5L11 10"/></svg>`,
  },
];

// Componente Toggle visual (mismo comportamiento que checkbox)
function ToggleSwitch({
  name,
  defaultChecked,
  label
}: {
  name: string;
  defaultChecked: boolean;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <span className="relative">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="peer sr-only"
        />
        <span className="block w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-[var(--accent)] transition-colors" />
        <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
      </span>
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    </label>
  );
}

// Componente para selector de iconos
function IconSelector({
  selectedIcon,
  onSelect,
}: {
  selectedIcon: string;
  onSelect: (iconId: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2">
      {CATEGORY_ICONS.map((icon) => (
        <button
          key={icon.id}
          type="button"
          onClick={() => onSelect(selectedIcon === icon.id ? "" : icon.id)}
          className={`p-3 rounded-xl transition-all ${
            selectedIcon === icon.id
              ? "neumor-inset bg-[var(--accent)] text-white"
              : "neumor-btn hover:scale-105"
          }`}
          title={icon.label}
        >
          <span
            className="w-8 h-8 block"
            dangerouslySetInnerHTML={{ __html: icon.svg }}
          />
        </button>
      ))}
    </div>
  );
}

export function ServiciosClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const [openNewItem, setOpenNewItem] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: "category" | "item" | null;
    categoryId?: string;
    itemId?: string;
    name?: string;
  }>({
    isOpen: false,
    type: null,
  });
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);
  const [selectedIcons, setSelectedIcons] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    initialCategories.forEach((cat) => {
      if (cat.icon) initial[cat.id] = cat.icon;
    });
    return initial;
  });
  const [newItemByCategory, setNewItemByCategory] = useState<Record<string, {
    name: string;
    price: string;
    duration: string;
    notes: string;
  }>>({});

  const loadServices = async () => {
    const response = await fetch("/api/servicios");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Error al cargar servicios");
    }
    setCategories(data.categories || []);
  };

  const runAction = async (payload: Record<string, unknown>, successText: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/servicios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error al guardar");
      }
      setCategories(data.categories || []);
      setMessage({ type: "success", text: successText });
    } catch (error) {
      const errorText = error instanceof Error ? error.message : "Error de conexion";
      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    await runAction({ action: "createCategory", name, icon: newCategoryIcon || null }, "Categoria creada");
    setNewCategoryName("");
    setNewCategoryIcon("");
  };

  const handleUpdateCategory = async (event: React.FormEvent<HTMLFormElement>, categoryId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await runAction(
      {
        action: "updateCategory",
        id: categoryId,
        name: formData.get("name"),
        icon: selectedIcons[categoryId] || null,
        sortOrder: Number(formData.get("sort_order") || 0),
        isActive: formData.get("is_active") === "on",
      },
      "Categoria actualizada"
    );
  };

  const handleDeleteCategory = async (categoryId: string) => {
    await runAction({ action: "deleteCategory", id: categoryId }, "Categoria eliminada");
  };

  const handleCreateItem = async (categoryId: string) => {
    const formState = newItemByCategory[categoryId] || {
      name: "",
      price: "",
      duration: "",
      notes: "",
    };
    const name = formState.name.trim();
    if (!name) return;
    const priceCents = Math.round(Number(formState.price || 0) * 100);
    const durationMinutes = Number(formState.duration || 0);
    if (!durationMinutes || durationMinutes % 15 !== 0) {
      setMessage({ type: "error", text: "La duracion debe ser multiplo de 15 minutos." });
      return;
    }
    await runAction(
      {
        action: "createItem",
        categoryId,
        name,
        priceCents,
        durationMinutes,
        notes: formState.notes,
      },
      "Servicio creado"
    );
    setNewItemByCategory((prev) => ({
      ...prev,
      [categoryId]: { name: "", price: "", duration: "", notes: "" },
    }));
  };

  const handleUpdateItem = async (event: React.FormEvent<HTMLFormElement>, itemId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const price = Number(formData.get("price") || 0);
    const duration = Number(formData.get("duration") || 0);
    if (!duration || duration % 15 !== 0) {
      setMessage({ type: "error", text: "La duracion debe ser multiplo de 15 minutos." });
      return;
    }
    await runAction(
      {
        action: "updateItem",
        id: itemId,
        name: formData.get("name"),
        priceCents: Math.round(price * 100),
        durationMinutes: duration,
        notes: formData.get("notes"),
        sortOrder: Number(formData.get("sort_order") || 0),
        isActive: formData.get("is_active") === "on",
      },
      "Servicio actualizado"
    );
  };

  const handleDeleteItem = async (itemId: string) => {
    await runAction({ action: "deleteItem", id: itemId }, "Servicio eliminado");
  };

  const getNewItemState = (categoryId: string) => newItemByCategory[categoryId] || {
    name: "",
    price: "",
    duration: "",
    notes: "",
  };

  const getCategoryIcon = (iconId: string | null) => {
    if (!iconId) return null;
    const icon = CATEGORY_ICONS.find((i) => i.id === iconId);
    return icon ? icon.svg : null;
  };

  const toggleCategory = (categoryId: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [categoryId]: !(prev[categoryId] ?? false),
    }));
  };

  const toggleNewService = (categoryId: string) => {
    setOpenNewItem((prev) => ({
      ...prev,
      [categoryId]: !(prev[categoryId] ?? false),
    }));
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !(prev[itemId] ?? false),
    }));
  };

  const requestDeleteCategory = (categoryId: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      type: "category",
      categoryId,
      name,
    });
  };

  const requestDeleteItem = (itemId: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      type: "item",
      itemId,
      name,
    });
  };

  const closeConfirmDialog = () => {
    if (loading) return;
    setConfirmDialog({ isOpen: false, type: null });
  };

  const confirmDelete = async () => {
    if (loading || !confirmDialog.type) return;
    if (confirmDialog.type === "category" && confirmDialog.categoryId) {
      await handleDeleteCategory(confirmDialog.categoryId);
    }
    if (confirmDialog.type === "item" && confirmDialog.itemId) {
      await handleDeleteItem(confirmDialog.itemId);
    }
    setConfirmDialog({ isOpen: false, type: null });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
          Catalogo de Servicios
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Gestiona categorias y servicios con sus precios.
        </p>
      </div>

      {/* Mensaje de feedback */}
      {message && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-[min(640px,calc(100%-2rem))]">
          <div
            className={`p-4 rounded-xl text-sm font-medium shadow-lg ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
            role="status"
            aria-live="polite"
          >
            {message.text}
          </div>
        </div>
      )}

      {/* Nueva categoria */}
      <div className="neumor-card p-5 md:p-6 mb-8">
        <h2 className="text-lg font-semibold mb-1">Nueva categoria</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-5">
          Crea una categoria para agrupar tus servicios.
        </p>

        <div className="space-y-5">
          {/* Input nombre */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
              Nombre de la categoria
            </label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              className="neumor-input w-full h-12 text-base"
              placeholder="Ej: Peluqueria, Estetica, Unas..."
            />
          </div>

          {/* Selector de iconos */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
              Icono (opcional)
            </label>
            <IconSelector
              selectedIcon={newCategoryIcon}
              onSelect={setNewCategoryIcon}
            />
          </div>

          {/* Boton crear */}
          <button
            onClick={handleCreateCategory}
            disabled={loading || !newCategoryName.trim()}
            className="neumor-btn neumor-btn-accent w-full h-12 text-base font-medium"
          >
            Crear categoria
          </button>
        </div>
      </div>

      {/* Lista de categorias */}
      <div className="space-y-6">
        {categories.length === 0 && (
          <div className="neumor-card p-8 text-center text-[var(--text-secondary)]">
            <p className="text-base">Aun no hay categorias creadas.</p>
            <p className="text-sm mt-1">Crea tu primera categoria arriba.</p>
          </div>
        )}

        {categories.map((category) => {
          const newItem = getNewItemState(category.id);
          const categoryIconSvg = getCategoryIcon(category.icon);
          const isCategoryOpen = openCategories[category.id] ?? false;
          const isNewItemOpen = openNewItem[category.id] ?? false;

          return (
            <div key={category.id} className="neumor-card p-5 md:p-6">
              {/* Header de categoria */}
              <div className="flex items-start gap-4 mb-6">
                {categoryIconSvg && (
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                    <span
                      className="w-7 h-7 block"
                      dangerouslySetInnerHTML={{ __html: categoryIconSvg }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold truncate">{category.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      {category.items.length} servicios
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      category.is_active
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {category.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario edicion categoria */}
              <form onSubmit={(event) => handleUpdateCategory(event, category.id)}>
                <div className="space-y-5">
                  {/* Nombre */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                      Nombre de la categoria
                    </label>
                    <input
                      name="name"
                      defaultValue={category.name}
                      className="neumor-input w-full h-12 text-base"
                    />
                  </div>

                  {/* Icono */}
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
                      Icono de la categoria
                    </label>
                    <IconSelector
                      selectedIcon={selectedIcons[category.id] || category.icon || ""}
                      onSelect={(iconId) =>
                        setSelectedIcons((prev) => ({
                          ...prev,
                          [category.id]: iconId,
                        }))
                      }
                    />
                  </div>

                  {/* Orden y Estado */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-[var(--text-secondary)]">
                        Orden
                      </label>
                      <input
                        name="sort_order"
                        type="number"
                        defaultValue={category.sort_order}
                        className="neumor-input w-20 h-10 text-center"
                      />
                    </div>
                    <ToggleSwitch
                      name="is_active"
                      defaultChecked={category.is_active}
                      label="Activa"
                    />
                  </div>

                  {/* Boton guardar */}
                  <button
                    type="submit"
                    className="neumor-btn neumor-btn-accent w-full h-12 text-base font-medium"
                    disabled={loading}
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>

              {/* Separador */}
              <div className="border-t border-[var(--shadow-light)] my-8" />

              {/* Seccion servicios */}
              <div>
                <h4 className="text-lg font-semibold mb-1">Servicios</h4>
                <p className="text-xs text-[var(--text-secondary)] mb-5">
                  Servicios disponibles en &quot;{category.name}&quot;
                </p>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <button
                    type="button"
                    className="neumor-btn px-4 py-2 text-sm font-medium"
                    onClick={() => toggleCategory(category.id)}
                  >
                    {isCategoryOpen
                      ? "Ocultar servicios"
                      : `Ver servicios (${category.items.length})`}
                  </button>
                  <button
                    type="button"
                    className="neumor-btn neumor-btn-accent px-4 py-2 text-sm font-medium"
                    onClick={() => toggleNewService(category.id)}
                  >
                    {isNewItemOpen ? "Cerrar alta" : "+ Nuevo servicio"}
                  </button>
                </div>

                {/* Lista de servicios */}
                {isCategoryOpen && (
                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 scroll-hidden">
                    {category.items.length === 0 && (
                      <div className="text-sm text-[var(--text-secondary)] text-center py-6 neumor-inset rounded-xl">
                        No hay servicios en esta categoria.
                      </div>
                    )}

                    {category.items.map((item) => {
                      const isExpanded = expandedItems[item.id] ?? false;
                      return (
                        <div key={item.id} className="neumor-inset p-4 rounded-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text-primary)] truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                €{(item.price_cents / 100).toFixed(2)} · {item.duration_minutes} min ·{" "}
                                {item.is_active ? "Activo" : "Inactivo"}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="neumor-btn px-3 py-1.5 text-xs font-medium"
                                onClick={() => toggleItem(item.id)}
                              >
                                {isExpanded ? "Cerrar" : "Editar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => requestDeleteItem(item.id, item.name)}
                                className="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                disabled={loading}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <form
                              className="mt-4 pt-4 border-t border-[var(--shadow-light)] space-y-4"
                              onSubmit={(event) => handleUpdateItem(event, item.id)}
                            >
                              {/* Nombre */}
                              <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                                  Nombre del servicio
                                </label>
                                <input
                                  name="name"
                                  defaultValue={item.name}
                                  className="neumor-input w-full h-11 text-sm"
                                />
                              </div>

                              {/* Precio y Duracion - 2 columnas */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                                    Precio (EUR)
                                  </label>
                                  <input
                                    name="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    defaultValue={(item.price_cents / 100).toFixed(2)}
                                    className="neumor-input w-full h-11 text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                                    Duracion (min)
                                  </label>
                                  <input
                                    name="duration"
                                    type="number"
                                    min="15"
                                    step="15"
                                    defaultValue={item.duration_minutes}
                                    className="neumor-input w-full h-11 text-sm"
                                  />
                                </div>
                              </div>

                              {/* Notas */}
                              <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                                  Notas (opcional)
                                </label>
                                <textarea
                                  name="notes"
                                  defaultValue={item.notes || ""}
                                  className="neumor-input w-full text-sm"
                                  rows={2}
                                  placeholder="Descripcion o detalles adicionales..."
                                />
                              </div>

                              {/* Orden y Estado */}
                              <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                                    Orden
                                  </label>
                                  <input
                                    name="sort_order"
                                    type="number"
                                    defaultValue={item.sort_order}
                                    className="neumor-input w-20 h-10 text-center text-sm"
                                  />
                                </div>
                                <ToggleSwitch
                                  name="is_active"
                                  defaultChecked={item.is_active}
                                  label="Activo"
                                />
                              </div>

                              {/* Boton guardar */}
                              <button
                                type="submit"
                                className="neumor-btn neumor-btn-accent w-full h-11 text-sm font-medium"
                                disabled={loading}
                              >
                                Guardar servicio
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Formulario nuevo servicio */}
                {isNewItemOpen && (
                  <div className="mt-4 p-4 rounded-xl bg-[var(--bg-secondary)]/50 border-2 border-dashed border-[var(--shadow-light)]">
                    <h5 className="font-semibold mb-3 text-sm">Anadir nuevo servicio</h5>

                    <div className="space-y-4">
                      {/* Nombre */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                          Nombre del servicio
                        </label>
                        <input
                          type="text"
                          className="neumor-input w-full h-11 text-sm"
                          placeholder="Ej: Corte caballero"
                          value={newItem.name}
                          onChange={(event) =>
                            setNewItemByCategory((prev) => ({
                              ...prev,
                              [category.id]: {
                                ...newItem,
                                name: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      {/* Precio y Duracion - 2 columnas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                            Precio (EUR)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="neumor-input w-full h-11 text-sm"
                            placeholder="15.00"
                            value={newItem.price}
                            onChange={(event) =>
                              setNewItemByCategory((prev) => ({
                                ...prev,
                                [category.id]: {
                                  ...newItem,
                                  price: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                            Duracion (min)
                          </label>
                          <input
                            type="number"
                            min="15"
                            step="15"
                            className="neumor-input w-full h-11 text-sm"
                            placeholder="30"
                            value={newItem.duration}
                            onChange={(event) =>
                              setNewItemByCategory((prev) => ({
                                ...prev,
                                [category.id]: {
                                  ...newItem,
                                  duration: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>

                      {/* Notas */}
                      <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                          Notas (opcional)
                        </label>
                        <textarea
                          className="neumor-input w-full text-sm"
                          rows={2}
                          placeholder="Descripcion o detalles..."
                          value={newItem.notes}
                          onChange={(event) =>
                            setNewItemByCategory((prev) => ({
                              ...prev,
                              [category.id]: {
                                ...newItem,
                                notes: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      {/* Boton crear */}
                      <button
                        onClick={() => handleCreateItem(category.id)}
                        disabled={loading || !newItem.name.trim()}
                        className="neumor-btn neumor-btn-accent w-full h-11 text-sm font-medium"
                      >
                        Crear servicio
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Separador antes de eliminar */}
              <div className="border-t border-[var(--shadow-light)] mt-8 pt-6">
                <button
                  type="button"
                  onClick={() => requestDeleteCategory(category.id, category.name)}
                  className="w-full h-10 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={loading}
                >
                  Eliminar categoria y todos sus servicios
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDelete}
        title={
          confirmDialog.type === "category"
            ? "Eliminar categoria"
            : "Eliminar servicio"
        }
        description={
          confirmDialog.type === "category"
            ? (confirmDialog.name
                ? `Se eliminará la categoria "${confirmDialog.name}" y todos sus servicios.`
                : "Se eliminará esta categoria y todos sus servicios.")
            : (confirmDialog.name
                ? `Se eliminará el servicio "${confirmDialog.name}".`
                : "Se eliminará este servicio.")
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={loading}
      />
    </div>
  );
}
