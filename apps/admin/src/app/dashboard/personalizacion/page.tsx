import { getWebsitePersonalizationConfig } from "@/lib/data";
import { PersonalizacionClient } from "./personalizacion-client";
import type { BusinessType } from "@neumorstudio/supabase";

export default async function PersonalizacionPage() {
  const websiteConfig = await getWebsitePersonalizationConfig();

  if (!websiteConfig) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Personalización</h1>
        <p className="text-[var(--text-secondary)]">
          No se encontro la cuenta asociada.
        </p>
      </div>
    );
  }

  return (
    <PersonalizacionClient
      websiteId={websiteConfig.websiteId}
      domain={websiteConfig.domain}
      initialTheme={websiteConfig.theme}
      initialConfig={websiteConfig.config}
      businessType={websiteConfig.config.businessType as BusinessType | undefined}
    />
  );
}
