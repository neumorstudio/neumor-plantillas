"use client";

import { useMemo, useState, useTransition } from "react";
import { Calendar, Clock, Mail, Phone, User, X } from "lucide-react";
import { SegmentedControl } from "@/components/mobile";
import { updateOrderStatus } from "@/lib/actions/orders";

interface OrderItem {
  id: string;
  item_name: string;
  quantity: number;
  total_price: number;
  unit_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  pickup_date: string;
  pickup_time: string;
  notes: string | null;
  status: string | null;
  total_amount: number;
  currency: string | null;
  created_at: string | null;
  paid_at: string | null;
  stripe_payment_status: string | null;
  order_items?: OrderItem[] | null;
}

type FilterStatus = "all" | "pending" | "paid" | "completed" | "cancelled";

const STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendientes" },
  { value: "paid", label: "Pagados" },
  { value: "completed", label: "Completados" },
  { value: "cancelled", label: "Cancelados" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const STATUS_BADGES: Record<string, string> = {
  pending: "badge-pending",
  paid: "badge-confirmed",
  completed: "badge-confirmed",
  cancelled: "badge-cancelled",
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(cents: number, currency = "EUR") {
  const amount = cents / 100;
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function getOrderStatus(order: Order) {
  if (order.status) return order.status;
  if (order.stripe_payment_status === "paid") return "paid";
  return "pending";
}

export default function PedidosClient({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const status = getOrderStatus(order);
        const matchesFilter = filter === "all" || status === filter;
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          order.customer_name.toLowerCase().includes(search) ||
          (order.customer_phone?.toLowerCase().includes(search) ?? false) ||
          (order.customer_email?.toLowerCase().includes(search) ?? false);
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }, [orders, filter, searchTerm]);

  const counts = useMemo(() => {
    const stats = {
      pending: 0,
      paid: 0,
      completed: 0,
      cancelled: 0,
    };
    orders.forEach((order) => {
      const status = getOrderStatus(order) as keyof typeof stats;
      if (stats[status] !== undefined) {
        stats[status] += 1;
      }
    });
    return stats;
  }, [orders]);

  const handleStatusChange = (orderId: string, nextStatus: string) => {
    setActionError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: nextStatus } : order
        )
      );
    });
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm flex items-center gap-2">
          <X className="w-4 h-4 flex-shrink-0" />
          {actionError}
        </div>
      )}

      <div className="neumor-card p-4 space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, telefono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="neumor-input w-full pl-10"
          />
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
        </div>

        <SegmentedControl
          options={STATUS_OPTIONS.map((opt) => ({
            ...opt,
            count:
              opt.value === "pending"
                ? counts.pending
                : opt.value === "paid"
                  ? counts.paid
                  : opt.value === "completed"
                    ? counts.completed
                    : opt.value === "cancelled"
                      ? counts.cancelled
                      : undefined,
          }))}
          value={filter}
          onChange={setFilter}
        />
      </div>

      {filteredOrders.length === 0 ? (
        <div className="neumor-card p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">No hay pedidos</h2>
          <p className="text-[var(--text-secondary)]">
            {searchTerm || filter !== "all"
              ? "No se encontraron pedidos con los filtros seleccionados."
              : "Los pedidos apareceran aqui cuando un cliente compre online."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const status = getOrderStatus(order);
            const badgeClass = STATUS_BADGES[status] || "badge";
            const statusLabel = STATUS_LABELS[status] || status;
            const shortId = order.id.slice(0, 8);
            const totalLabel = formatMoney(order.total_amount, order.currency || "EUR");
            const paymentStatus = order.stripe_payment_status || (status === "paid" ? "paid" : "pending");

            return (
              <div key={order.id} className="neumor-card p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{order.customer_name}</h3>
                      <span className={`badge ${badgeClass}`}>{statusLabel}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Pedido #{shortId}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(order.pickup_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {order.pickup_time}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Phone className="w-4 h-4" />
                      <span>{order.customer_phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Mail className="w-4 h-4" />
                      <span>{order.customer_email || "-"}</span>
                    </div>
                    {order.notes && (
                      <p className="text-[var(--text-secondary)]">{order.notes}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">Total</span>
                      <span className="font-semibold text-[var(--accent)]">{totalLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)]">Pago</span>
                      <span className="font-medium">{paymentStatus}</span>
                    </div>
                    {order.paid_at && (
                      <div className="text-xs text-[var(--text-secondary)]">
                        Pagado el {formatDate(order.paid_at)}
                      </div>
                    )}
                  </div>
                </div>

                {order.order_items?.length ? (
                  <div className="border-t border-[var(--shadow-dark)]/30 pt-3">
                    <p className="text-sm font-medium mb-2">Detalle del pedido</p>
                    <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                      {order.order_items.map((item) => (
                        <li key={item.id} className="flex items-center justify-between">
                          <span>
                            {item.quantity}x {item.item_name}
                          </span>
                          <span>{formatMoney(item.total_price, order.currency || "EUR")}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs text-[var(--text-secondary)]">
                    Creado: {order.created_at ? formatDate(order.created_at) : "-"}
                  </div>
                  <select
                    value={status}
                    onChange={(event) => handleStatusChange(order.id, event.target.value)}
                    className="neumor-input text-sm py-1"
                    disabled={isPending}
                  >
                    {STATUS_OPTIONS.filter((opt) => opt.value !== "all").map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
