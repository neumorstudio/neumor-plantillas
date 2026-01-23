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
  sort_order: number;
  is_active: boolean;
  items: ServiceItem[];
};

interface Props {
  initialCategories: ServiceCategory[];
}

export function ServiciosClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<ServiceCategory[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
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
    await runAction({ action: "createCategory", name }, "Categoria creada");
    setNewCategoryName("");
  };

  const handleUpdateCategory = async (event: React.FormEvent<HTMLFormElement>, categoryId: string) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await runAction(
      {
        action: "updateCategory",
        id: categoryId,
        name: formData.get("name"),
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
        <h1 className="text-3xl font-heading font-bold mb-2">Servicios</h1>
        <p className="text-[var(--text-secondary)]">
          Organiza los servicios por categorias y define precio, duracion y notas.
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
          <h2 className="text-lg font-semibold">Nueva categoria</h2>
          <span className="text-xs text-[var(--text-secondary)]">
            Solo necesitas un nombre
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            className="neumor-input flex-1"
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
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
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
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--text-secondary)]">Orden</label>
                    <input
                      name="sort_order"
                      type="number"
                      defaultValue={category.sort_order}
                      className="neumor-input w-24"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <input type="checkbox" name="is_active" defaultChecked={category.is_active} />
                    Activa
                  </label>
                  <div className="flex gap-2">
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
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="neumor-inset px-3 py-1 rounded-full">
                    {category.items.length} subcategorias
                  </span>
                  <span className="neumor-inset px-3 py-1 rounded-full">
                    {category.is_active ? "Activa" : "Inactiva"}
                  </span>
                </div>
              </form>

              <div className="mt-6 border-t border-[var(--shadow-light)] pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                  <h3 className="text-lg font-semibold">Subcategorias</h3>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Precio en EUR y duracion en minutos
                  </span>
                </div>

                <div className="space-y-4">
                  {category.items.length === 0 && (
                    <div className="text-sm text-[var(--text-secondary)]">
                      No hay subcategorias en esta categoria.
                    </div>
                  )}

                  {category.items.map((item) => (
                    <form
                      key={item.id}
                      className="neumor-inset p-4 rounded-lg space-y-3"
                      onSubmit={(event) => handleUpdateItem(event, item.id)}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                            min="1"
                            defaultValue={item.duration_minutes}
                            className="neumor-input w-full"
                          />
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
                    <h4 className="font-semibold">Nueva subcategoria</h4>
                    <span className="text-xs text-[var(--text-secondary)]">
                      Ejemplo: Corte pelo, Color unas
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
                      min="1"
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
                    Crear subcategoria
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-sm text-[var(--text-secondary)]">
        <button
          onClick={() => {
            setLoading(true);
            setMessage(null);
            loadServices()
              .catch((error) =>
                setMessage({
                  type: "error",
                  text: error instanceof Error ? error.message : "Error al actualizar",
                })
              )
              .finally(() => setLoading(false));
          }}
          disabled={loading}
          className="neumor-btn"
        >
          Actualizar lista
        </button>
      </div>
    </div>
  );
}
