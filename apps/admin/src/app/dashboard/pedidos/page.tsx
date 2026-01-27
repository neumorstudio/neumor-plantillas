import { createClient } from "@/lib/supabase-server";
import { getBusinessType, getWebsiteId } from "@/lib/data";
import PedidosClient, { type AdminOrder } from "./pedidos-client";

function todayIsoDate() {
  return new Date().toISOString().split("T")[0];
}

export default async function PedidosPage() {
  const [businessType, websiteId, supabase] = await Promise.all([
    getBusinessType(),
    getWebsiteId(),
    createClient(),
  ]);

  if (businessType !== "restaurant") {
    return (
      <div className="neumor-card p-6">
        <h1 className="text-2xl font-heading font-bold mb-2">Pedidos</h1>
        <p className="text-[var(--text-secondary)]">
          Esta seccion solo esta disponible para restaurantes.
        </p>
      </div>
    );
  }

  if (!websiteId) {
    return (
      <div className="neumor-card p-6">
        <h1 className="text-2xl font-heading font-bold mb-2">Pedidos</h1>
        <p className="text-[var(--text-secondary)]">
          No se encontro el website asociado a tu cuenta.
        </p>
      </div>
    );
  }

  const today = todayIsoDate();
  const { data } = await supabase
    .from("orders")
    .select(
      "id, website_id, customer_name, customer_phone, customer_email, pickup_date, pickup_time, status, total_amount, created_at, order_items(id, item_name, quantity, unit_price, total_price)"
    )
    .eq("website_id", websiteId)
    .eq("pickup_date", today)
    .order("pickup_time", { ascending: true });

  const initialOrders = (data || []) as AdminOrder[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Pedidos Take Away</h1>
        <p className="text-[var(--text-secondary)]">
          Revisa y actualiza el estado de los pedidos para recoger.
        </p>
      </div>

      <PedidosClient initialDate={today} initialOrders={initialOrders} />
    </div>
  );
}

