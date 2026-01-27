import { headers } from "next/headers";
import type { Website, WebsiteConfig, BusinessType, Theme } from "@/types/tenant";

// Get tenant context from headers (set by middleware)
export async function getTenantFromHeaders(): Promise<{
  tenantId: string;
  theme: Theme;
  businessType: BusinessType;
  config: WebsiteConfig;
} | null> {
  const headersList = await headers();

  const tenantId = headersList.get("x-tenant-id");
  if (!tenantId) return null;

  const theme = (headersList.get("x-tenant-theme") || "light") as Theme;
  const businessType = (headersList.get("x-business-type") || "restaurant") as BusinessType;
  const configStr = headersList.get("x-tenant-config") || "{}";

  let config: WebsiteConfig = {};
  try {
    config = JSON.parse(configStr);
  } catch {
    config = {};
  }

  return {
    tenantId,
    theme,
    businessType,
    config,
  };
}

// Default variants by business type
export function getDefaultVariants(businessType: BusinessType) {
  return {
    hero: "classic" as const,
    mainContent: "tabs" as const,
    features: "cards" as const,
    reviews: "grid" as const,
    footer: "full" as const,
  };
}

// Get the main content component name by business type
export function getMainComponentName(businessType: BusinessType): string {
  const componentNames: Record<BusinessType, string> = {
    restaurant: "Menu",
    salon: "Services",
    gym: "Classes",
    clinic: "Treatments",
    repairs: "Services",
    store: "Products",
    fitness: "Classes",
  };
  return componentNames[businessType] || "Services";
}
