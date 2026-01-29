"use client";

import { useState } from "react";

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

export function ServiciosClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
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
      const newCategories = data.categories || [];
      setCategories(newCategories);
      // Sincronizar selectedIcons con los datos de la BD
      setSelectedIcons((prev) => {
        const updated = { ...prev };
        newCategories.forEach((cat: ServiceCategory) => {
          if (cat.icon) {
            updated[cat.id] = cat.icon;
          } else {
            delete updated[cat.id];
          }
        });
        return updated;
      });
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
    const confirmed = window.confirm("Eliminar esta categoria y sus servicios?");
    if (!confirmed) return;
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
    const confirmed = window.confirm("Eliminar este servicio?");
    if (!confirmed) return;
    await runAction({ action: "deleteItem", id: itemId }, "Servicio eliminado");
  };

  const getNewItemState = (categoryId: string) => newItemByCategory[categoryId] || {
    name: "",
    price: "",
    duration: "",
    notes: "",
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Catalogo de Servicios</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona las categorias (pestanas) y los servicios que ofreces con sus precios y duraciones.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="neumor-card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold">Nueva categoria</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Solo necesitas un nombre para empezar.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <input
              type="text"
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              className="neumor-input w-full"
              placeholder="Ej: Peluqueria, Salon de unas, Estetica"
            />
            <button
              onClick={handleCreateCategory}
              disabled={loading || !newCategoryName.trim()}
              className="neumor-btn neumor-btn-accent"
            >
              Crear categoria
            </button>
          </div>
          <div>
            <label className="text-xs text-[var(--text-secondary)] block mb-2">
              Icono (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => setNewCategoryIcon(newCategoryIcon === icon.id ? "" : icon.id)}
                  className={`p-2 rounded-lg transition-all ${
                    newCategoryIcon === icon.id
                      ? "neumor-inset bg-[var(--accent)] text-white"
                      : "neumor-btn"
                  }`}
                  title={icon.label}
                >
                  <span
                    className="w-5 h-5 block"
                    dangerouslySetInnerHTML={{ __html: icon.svg }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {categories.length === 0 && (
          <div className="neumor-card p-6 text-[var(--text-secondary)]">
            Aun no hay categorias creadas.
          </div>
        )}

        {categories.map((category) => {
          const newItem = getNewItemState(category.id);
          return (
            <div key={category.id} className="neumor-card p-6">
              <form onSubmit={(event) => handleUpdateCategory(event, category.id)}>
                <div className="flex flex-col xl:flex-row xl:items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs text-[var(--text-secondary)]">
                      Nombre de la categoria
                    </label>
                    <input
                      name="name"
                      defaultValue={category.name}
                      className="neumor-input w-full"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 xl:justify-end">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--text-secondary)]">Orden</label>
                      <input
                        name="sort_order"
                        type="number"
                        defaultValue={category.sort_order}
                        className="neumor-input w-20"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <input type="checkbox" name="is_active" defaultChecked={category.is_active} />
                      Activa
                    </label>
                    <button
                      type="submit"
                      className="neumor-btn neumor-btn-accent"
                      disabled={loading}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id)}
                      className="neumor-btn"
                      disabled={loading}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-xs text-[var(--text-secondary)] block mb-2">
                    Icono de la categoria
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_ICONS.map((icon) => (
                      <button
                        key={icon.id}
                        type="button"
                        onClick={() =>
                          setSelectedIcons((prev) => ({
                            ...prev,
                            [category.id]: prev[category.id] === icon.id ? "" : icon.id,
                          }))
                        }
                        className={`p-2 rounded-lg transition-all ${
                          (selectedIcons[category.id] || category.icon) === icon.id
                            ? "neumor-inset bg-[var(--accent)] text-white"
                            : "neumor-btn"
                        }`}
                        title={icon.label}
                      >
                        <span
                          className="w-5 h-5 block"
                          dangerouslySetInnerHTML={{ __html: icon.svg }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="neumor-inset px-3 py-1 rounded-full">
                    {category.items.length} servicios
                  </span>
                  <span className="neumor-inset px-3 py-1 rounded-full">
                    {category.is_active ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </form>

              <div className="mt-6 border-t border-[var(--shadow-light)] pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Servicios de esta categoria</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Estos son los servicios que aparecen en tu web bajo &quot;{category.name}&quot;.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {category.items.length === 0 && (
                    <div className="text-sm text-[var(--text-secondary)]">
                      No hay servicios en esta categoria.
                    </div>
                  )}

                  {category.items.map((item) => (
                    <form
                      key={item.id}
                      className="neumor-inset p-4 rounded-xl space-y-3"
                      onSubmit={(event) => handleUpdateItem(event, item.id)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_0.7fr_0.7fr] gap-3">
                        <div className="md:col-span-1">
                          <label className="text-xs text-[var(--text-secondary)]">
                            Nombre
                          </label>
                          <input
                            name="name"
                            defaultValue={item.name}
                            className="neumor-input w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-secondary)]">
                            Precio (EUR)
                          </label>
                          <input
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={(item.price_cents / 100).toFixed(2)}
                            className="neumor-input w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[var(--text-secondary)]">
                            Duracion (min)
                          </label>
                          <input
                            name="duration"
                            type="number"
                            min="15"
                            step="15"
                            defaultValue={item.duration_minutes}
                            className="neumor-input w-full"
                          />
                          <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                            Multiplo de 15 minutos.
                          </p>
                        </div>
                      </div>
                      <textarea
                        name="notes"
                        defaultValue={item.notes || ""}
                        className="neumor-input"
                        rows={2}
                        placeholder="Notas (opcional)"
                      />
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <input type="checkbox" name="is_active" defaultChecked={item.is_active} />
                          Activa
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-[var(--text-secondary)]">Orden</label>
                          <input
                            name="sort_order"
                            type="number"
                            defaultValue={item.sort_order}
                            className="neumor-input w-24"
                          />
                        </div>
                        <button
                          type="submit"
                          className="neumor-btn neumor-btn-accent"
                          disabled={loading}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="neumor-btn"
                          disabled={loading}
                        >
                          Eliminar
                        </button>
                      </div>
                    </form>
                  ))}
                </div>

                <div className="mt-6 neumor-inset p-4 rounded-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <h4 className="font-semibold">Anadir nuevo servicio</h4>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Ej: Corte caballero, Limpieza facial, Manicura
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      className="neumor-input"
                      placeholder="Nombre del servicio"
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
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="neumor-input"
                      placeholder="Precio (EUR)"
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
                    <input
                      type="number"
                      min="15"
                      step="15"
                      className="neumor-input"
                      placeholder="Minutos"
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
                  <textarea
                    className="neumor-input mb-3"
                    rows={2}
                    placeholder="Notas (opcional)"
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
                  <button
                    onClick={() => handleCreateItem(category.id)}
                    disabled={loading || !newItem.name.trim()}
                    className="neumor-btn neumor-btn-accent"
                  >
                    Crear servicio
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
