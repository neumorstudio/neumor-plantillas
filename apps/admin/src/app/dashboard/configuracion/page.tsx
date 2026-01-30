import { getClientData, getNotificationSettings, getWebsiteConfig } from "@/lib/data";
import { ConfiguracionClient } from "./configuracion-client";

export default async function ConfiguracionPage() {
  const { client, websiteId } = await getClientData();

  if (!client || !websiteId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Configuracion</h1>
        <p className="text-[var(--text-secondary)]">
          No se encontro la cuenta asociada.
        </p>
      </div>
    );
  }

  const settings = await getNotificationSettings();
  const websiteConfig = await getWebsiteConfig();

  return (
    <ConfiguracionClient
      client={client}
      websiteId={websiteId}
      initialSettings={settings}
      initialWebsiteConfig={websiteConfig}
    />
  );
}
