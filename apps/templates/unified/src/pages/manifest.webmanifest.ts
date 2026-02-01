import type { APIRoute } from "astro";
import type { TenantData } from "../middleware";

const DEFAULT_NAME = "Mi Negocio";
const DEFAULT_ICON = "/favicon.svg";
const DEFAULT_THEME = "#6366f1";

const toString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim().length > 0 ? value : undefined;

export const GET: APIRoute = async ({ locals }) => {
  const tenant = (locals as { tenant?: TenantData }).tenant;
  const config = (tenant?.config ?? {}) as Record<string, unknown>;
  const branding = (config.branding ?? {}) as Record<string, unknown>;
  const colors = (config.colors ?? {}) as Record<string, unknown>;

  const businessName =
    toString(config.businessName) ||
    toString(config.business_name) ||
    toString(tenant?.businessName) ||
    DEFAULT_NAME;

  const logo = toString(branding.logo) || toString(config.logo);
  const favicon = toString(branding.favicon);
  const pwaLogoCompatible = branding.pwaLogoCompatible !== false;
  const icon = (logo && pwaLogoCompatible ? logo : favicon) || DEFAULT_ICON;
  const iconType = icon.split("?")[0].endsWith(".svg") ? "image/svg+xml" : "image/png";

  const themeColor = toString(colors.accent) || DEFAULT_THEME;
  const backgroundColor = toString(colors.background) || "#ffffff";
  const shortName = businessName.split("|")[0].trim() || businessName;

  const manifest = {
    name: businessName,
    short_name: shortName,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    icons: [
      { src: icon, sizes: "192x192", type: iconType, purpose: "any" },
      { src: icon, sizes: "512x512", type: iconType, purpose: "any" },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=300",
    },
  });
};
