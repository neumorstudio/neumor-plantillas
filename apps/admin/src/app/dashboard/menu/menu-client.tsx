"use client";

import { useEffect, useMemo, useState, useTransition } from "react";

export interface AdminMenuItem {
  id: string;
  website_id: string;
  category: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  tag: string | null;
  is_active: boolean;
  sort_order: number;
  updated_at?: string;
}

function centsToEuros(value: number) {
  return (Number(value) || 0) / 100;
}

function eurosToCents(value: number) {
  return Math.max(0, Math.round((Number(value) || 0) * 100));
}

export default function MenuClient({ initialItems }: { initialItems: AdminMenuItem[] }) {
  const [items, setItems] = useState<AdminMenuItem[]>(initialItems);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const [newItem, setNewItem] = useState({
    name: "",
    category: "",
    priceEuros: "",
  });

  const categories = useMemo(() => {
    const unique = Array.from(new Set(items.map((item) => item.category).filter(Boolean)));
    unique.sort((a, b) => a.localeCompare(b));
    return unique;
  }, [items]);

  const visibleItems = useMemo(() => {
    const base = categoryFilter === "all" ? items : items.filter((item) => item.category === categoryFilter);
    return [...base].sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      return a.name.localeCompare(b.name);
    });
  }, [items, categoryFilter]);

  const updateLocalItem = (id: string, patch: Partial<AdminMenuItem>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const saveItem = (item: AdminMenuItem) => {
    startTransition(async () => {
      setMessage(null);
      try {
        const response = await fetch("/api/menu-items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: item.id,
            updates: {
              name: item.name,
              category: item.category,
              description: item.description,
              price_cents: item.price_cents,
              tag: item.tag,
              is_active: item.is_active,
              sort_order: item.sort_order,
            },
          }),
        });
        const data = (await response.json()) as { item?: AdminMenuItem; error?: string };
        if (!response.ok || !data.item) {
          throw new Error(data.error || "No se pudo guardar el item.");
        }
        updateLocalItem(item.id, data.item);
        setMessage({ type: "success", text: `Guardado: ${data.item.name}` });
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Error al guardar el item.",
        });
      }
    });
  };

  const handleCreateItem = () => {
    startTransition(async () => {
      setMessage(null);
      const name = newItem.name.trim();
      const category = newItem.category.trim();
      const price = eurosToCents(Number(newItem.priceEuros));

      if (!name || !category || price <= 0) {
        setMessage({ type: "error", text: "Completa nombre, categoria y precio." });
        return;
      }

      try {
        const response = await fetch("/api/menu-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            category,
            price_cents: price,
          }),
        });
        const data = (await response.json()) as { item?: AdminMenuItem; error?: string };
        if (!response.ok || !data.item) {
          throw new Error(data.error || "No se pudo crear el item.");
        }
        setItems((prev) => [data.item!, ...prev]);
        setNewItem({ name: "", category: category, priceEuros: "" });
        setMessage({ type: "success", text: `Item creado: ${data.item.name}` });
      } catch (error) {
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Error al crear el item.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="neumor-card p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-2">Nuevo plato</label>
            <input
              value={newItem.name}
              onChange={(event) => setNewItem((prev) => ({ ...prev, name: event.target.value }))}
              className="neumor-input w-full"
              placeholder="Ej. Burger clasica"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <input
              value={newItem.category}
              onChange={(event) => setNewItem((prev) => ({ ...prev, category: event.target.value }))}
              className="neumor-input w-full"
              placeholder="Entrantes"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Precio (EUR)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={newItem.priceEuros}
              onChange={(event) => setNewItem((prev) => ({ ...prev, priceEuros: event.target.value }))}
              className="neumor-input w-full"
              placeholder="12.5"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <button
            type="button"
            className="neumor-btn neumor-btn-accent"
            onClick={handleCreateItem}
            disabled={isPending}
          >
            Anadir al menu
          </button>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Filtrar por categoria</label>
            <select
              className="neumor-input w-full"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              disabled={isPending}
            >
              <option value="all">Todas</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

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
      </div>

      <div className="neumor-card overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="text-left border-b border-[var(--border-color)]">
              <th className="p-3 font-semibold">Activo</th>
              <th className="p-3 font-semibold">Nombre</th>
              <th className="p-3 font-semibold">Categoria</th>
              <th className="p-3 font-semibold">Precio</th>
              <th className="p-3 font-semibold">Orden</th>
              <th className="p-3 font-semibold">Tag</th>
              <th className="p-3 font-semibold">Accion</th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id} className="border-b border-[var(--border-color)] align-top">
                <td className="p-3">
                  <button
                    type="button"
                    className={`neumor-btn ${item.is_active ? "neumor-btn-accent" : ""}`}
                    onClick={() => updateLocalItem(item.id, { is_active: !item.is_active })}
                    disabled={isPending}
                  >
                    {item.is_active ? "Activo" : "Pausado"}
                  </button>
                </td>
                <td className="p-3 space-y-2">
                  <input
                    value={item.name}
                    onChange={(event) => updateLocalItem(item.id, { name: event.target.value })}
                    className="neumor-input w-full"
                    disabled={isPending}
                  />
                  <textarea
                    value={item.description || ""}
                    onChange={(event) => updateLocalItem(item.id, { description: event.target.value })}
                    className="neumor-input w-full"
                    rows={2}
                    placeholder="Descripcion breve"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <input
                    value={item.category}
                    onChange={(event) => updateLocalItem(item.id, { category: event.target.value })}
                    className="neumor-input w-full"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={centsToEuros(item.price_cents)}
                    onChange={(event) => updateLocalItem(item.id, { price_cents: eurosToCents(Number(event.target.value)) })}
                    className="neumor-input w-full"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    step="1"
                    value={item.sort_order}
                    onChange={(event) => updateLocalItem(item.id, { sort_order: Math.floor(Number(event.target.value) || 0) })}
                    className="neumor-input w-full"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <input
                    value={item.tag || ""}
                    onChange={(event) => updateLocalItem(item.id, { tag: event.target.value })}
                    className="neumor-input w-full"
                    placeholder="popular, nuevo, vegano"
                    disabled={isPending}
                  />
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    className="neumor-btn neumor-btn-accent"
                    onClick={() => saveItem(item)}
                    disabled={isPending}
                  >
                    Guardar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
