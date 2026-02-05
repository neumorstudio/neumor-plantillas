import { getBusinessType, getWebsiteId, getOrders } from "@/lib/data";
import PedidosClient from "./pedidos-client";

export default async function PedidosPage() {
  const businessType = await getBusinessType();

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

  const websiteId = await getWebsiteId();
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

  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold mb-1">Pedidos</h1>
        <p className="text-[var(--text-secondary)]">
          Gestiona los pedidos online y su estado de recogida.
        </p>
      </div>

      <PedidosClient initialOrders={orders} />
    </div>
  );
}
