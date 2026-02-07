import { defineMiddleware } from "astro:middleware";
import { createClient } from "@supabase/supabase-js";

export interface TenantData {
  id: string;
  clientId: string;
  subdomain: string | null;
  customDomain: string | null;
  theme: string;
  config: Record<string, unknown>;
  businessType: string;
  businessName: string;
}

// In-memory cache for tenant lookups
const tenantCache = new Map<string, { data: TenantData; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, locals } = context;
  const host = request.headers.get("host") || "";
  const url = new URL(request.url);

  // Parse domain to get subdomain or custom domain
  const { subdomain, customDomain } = parseDomain(host);


  // Skip tenant resolution for static assets
  if (url.pathname.startsWith("/_")) {
    return next();
  }

  // Skip cache in preview mode to always get fresh data
  const isPreview = url.searchParams.get("preview") === "1";

  // Resolve tenant from Supabase
  const tenant = await resolveTenant(subdomain, customDomain, isPreview);

  if (!tenant) {
    return new Response("Website not found", { status: 404 });
  }


  // Store tenant data in locals for pages to access
  (locals as Record<string, unknown>).tenant = tenant;

  return next();
});

function parseDomain(host: string): { subdomain: string | null; customDomain: string | null } {
  // Local development
  if (host.includes("localhost")) {
    const devSubdomain = import.meta.env.DEV_SUBDOMAIN;
    return {
      subdomain: devSubdomain || null,
      customDomain: null,
    };
  }

  // Subdomain pattern: cliente.neumorstudio.com
  const neumorMatch = host.match(/^([^.]+)\.neumorstudio\.com$/);
  if (neumorMatch) {
    // Exclude admin subdomain
    if (neumorMatch[1] === "admin") {
      return { subdomain: null, customDomain: null };
    }
    return {
      subdomain: neumorMatch[1],
      customDomain: null,
    };
  }

  // Custom domain: reformasgarcia.com
  return {
    subdomain: null,
    customDomain: host.replace(/^www\./, ""),
  };
}

async function resolveTenant(
  subdomain: string | null,
  customDomain: string | null,
  skipCache: boolean = false
): Promise<TenantData | null> {
  if (!subdomain && !customDomain) return null;

  const cacheKey = subdomain || customDomain || "";

  // Check cache (skip if in preview mode)
  if (!skipCache) {
    const cached = tenantCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
  }

  // Query Supabase
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let query = supabase
    .from("websites")
    .select(`
      id,
      client_id,
      subdomain,
      custom_domain,
      theme,
      config,
      is_active,
      clients!inner (
        business_type,
        business_name
      )
    `)
    .eq("is_active", true);

  if (subdomain) {
    query = query.eq("subdomain", subdomain);
  } else if (customDomain) {
    query = query.eq("custom_domain", customDomain);
  }

  const { data: websiteData, error } = await query.single();

  if (error || !websiteData) {
    return null;
  }

  // Con !inner Supabase devuelve objeto único, no array
  const clientData = websiteData.clients as unknown as { business_type: string; business_name: string };

  const tenant: TenantData = {
    id: websiteData.id,
    clientId: websiteData.client_id,
    subdomain: websiteData.subdomain,
    customDomain: websiteData.custom_domain,
    theme: websiteData.theme || "light",
    config: (websiteData.config as Record<string, unknown>) || {},
    businessType: clientData?.business_type || "restaurant",
    businessName: clientData?.business_name || "Mi Negocio",
  };

  // === DEBUG: Log tenant config from Supabase ===

  // Update cache
  tenantCache.set(cacheKey, {
    data: tenant,
    expires: Date.now() + CACHE_TTL,
  });

  return tenant;
}
