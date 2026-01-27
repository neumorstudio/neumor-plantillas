"use client";

import { useMemo, useState, useTransition } from "react";

export interface AdminOrderItem {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AdminOrder {
  id: string;
  website_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  pickup_date: string;
  pickup_time: string | null;
  status: string;
  total_amount: number;
  created_at: string;
  order_items?: AdminOrderItem[] | null;
}

const statusOrder = ["pending", "confirmed", "ready", "cancelled"] as const;
const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  ready: "Listo",
  cancelled: "Cancelado",
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format((Number(cents) || 0) / 100);
}

function normalizeTime(value: string | null) {
  if (!value) return "Sin hora";
  return value.slice(0, 5);
}

export default function PedidosClient({
  initialDate,
  initialOrders,
}: {
  initialDate: string;
  initialOrders: AdminOrder[];
}) {
  const [date, setDate] = useState(initialDate);
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const base = { pending: 0, confirmed: 0, ready: 0, cancelled: 0 };
    orders.forEach((order) => {
      if (order.status in base) {
        base[order.status as keyof typeof base] += 1;
      }
    });
    return base;
  }, [orders]);

  const fetchOrders = (nextDate: string) => {
    startTransition(async () => {
      setMessage(null);
      try {
        const response = await fetch(`/api/pedidos?date=${nextDate}`);
        const data = (await response.json()) as { orders?: AdminOrder[]; error?: string };
        if (!response.ok) {
          throw new Error(data.error || "No se pudieron cargar los pedidos.");
        }
        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (error) {
        setOrders([]);
        setMessage(error instanceof Error ? error.message : "Error al cargar pedidos.");
      }
    });
  };

  const handleDateChange = (nextDate: string) => {
    setDate(nextDate);
    fetchOrders(nextDate);
  };

  const handleStatusChange = (orderId: string, status: string) => {
    startTransition(async () => {
      setMessage(null);
      try {
        const response = await fetch("/api/pedidos", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: orderId, status }),
        });
        const data = (await response.json()) as { order?: AdminOrder; error?: string };
        if (!response.ok || !data.order) {
          throw new Error(data.error || "No se pudo actualizar el estado.");
        }
        setOrders((prev) =>
          prev.map((order) => (order.id === orderId ? { ...order, status: data.order!.status } : order))
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Error al actualizar el pedido.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="neumor-card p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Dia</label>
            <input
              type="date"
              value={date}
              onChange={(event) => handleDateChange(event.target.value)}
              className="neumor-input w-full"
              disabled={isPending}
            />
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            {isPending ? "Actualizando pedidos..." : "Vista diaria"}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusOrder.map((statusKey) => (
            <div key={statusKey} className="neumor-inset p-3 text-center">
              <div className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                {statusLabels[statusKey]}
              </div>
              <div className="text-xl font-semibold mt-1">{stats[statusKey]}</div>
            </div>
          ))}
        </div>

        {message && (
          <p className="text-sm text-red-600" role="alert">
            {message}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="neumor-card p-6 text-center text-[var(--text-secondary)]">
            No hay pedidos para este dia.
          </div>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="neumor-card p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-sm text-[var(--text-secondary)]">Recogida</div>
                  <div className="text-xl font-semibold">{normalizeTime(order.pickup_time)}</div>
                </div>
                <div className="text-sm">
                  <span className="text-[var(--text-secondary)]">Estado: </span>
                  <strong>{statusLabels[order.status] || order.status}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="neumor-inset p-3">
                  <div className="text-[var(--text-secondary)] mb-1">Cliente</div>
                  <div className="font-medium">{order.customer_name}</div>
                  <div>{order.customer_phone || "Sin telefono"}</div>
                </div>
                <div className="neumor-inset p-3 sm:col-span-2">
                  <div className="text-[var(--text-secondary)] mb-2">Detalle</div>
                  <ul className="space-y-1">
                    {(order.order_items || []).map((item) => (
                      <li key={item.id} className="flex items-center justify-between">
                        <span>
                          {item.quantity} x {item.item_name}
                        </span>
                        <span className="text-[var(--text-secondary)]">
                          {formatCurrency(item.total_price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-sm">
                  <span className="text-[var(--text-secondary)]">Total: </span>
                  <strong>{formatCurrency(order.total_amount)}</strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  {statusOrder.map((statusKey) => (
                    <button
                      key={statusKey}
                      type="button"
                      className={`neumor-btn ${order.status === statusKey ? "neumor-btn-accent" : ""}`}
                      onClick={() => handleStatusChange(order.id, statusKey)}
                      disabled={isPending}
                    >
                      {statusLabels[statusKey]}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

