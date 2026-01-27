import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Types for multi-tenant website
interface Website {
  id: string;
  client_id: string;
  subdomain: string | null;
  custom_domain: string | null;
  domain_status: "subdomain" | "custom";
  theme: string;
  config: Record<string, unknown>;
  is_active: boolean;
  business_type: string;
}

// In-memory cache for website lookups
const websiteCache = new Map<string, { data: Website; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // DEBUG - use console.error for visibility
  console.error("========== MIDDLEWARE EXECUTING ==========");
  console.error("[Middleware] URL:", request.url);
  console.error("[Middleware] Host:", host);
  console.error("[Middleware] DEV_SUBDOMAIN:", process.env.DEV_SUBDOMAIN);
  console.error("[Middleware] SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

  // 1. Parse domain to determine tenant
  const { subdomain, customDomain, isPreview, previewWebsiteId } = parseDomain(
    host,
    url
  );

  // DEBUG
  console.error("[Middleware] Parsed:", JSON.stringify({ subdomain, customDomain, isPreview, previewWebsiteId }));

  // 2. Handle preview mode (from admin)
  if (isPreview && previewWebsiteId) {
    return handlePreviewMode(request, previewWebsiteId);
  }

  // 3. Resolve website from Supabase
  const website = await resolveWebsite(subdomain, customDomain, request);

  // DEBUG
  console.log("[Middleware] Website found:", website?.id, website?.subdomain);

  if (!website || !website.is_active) {
    // Website not found or inactive
    url.pathname = "/_not-found";
    return NextResponse.rewrite(url);
  }

  // 4. Create response with tenant headers (set on REQUEST headers so pages can read them)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", website.id);
  requestHeaders.set("x-tenant-theme", website.theme || "light");
  requestHeaders.set("x-tenant-config", JSON.stringify(website.config || {}));
  requestHeaders.set("x-business-type", website.business_type);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Also set cookies as backup (more reliable in Next.js 15)
  response.cookies.set("x-tenant-id", website.id, { path: "/" });
  response.cookies.set("x-tenant-theme", website.theme || "light", { path: "/" });
  response.cookies.set("x-business-type", website.business_type, { path: "/" });

  // 5. Handle portal auth for /mi-cuenta/* routes
  if (url.pathname.startsWith("/mi-cuenta")) {
    response = await handlePortalAuth(request, response, website);
  }

  return response;
}

function parseDomain(
  host: string,
  url: URL
): {
  subdomain: string | null;
  customDomain: string | null;
  isPreview: boolean;
  previewWebsiteId: string | null;
} {
  const isPreview = url.searchParams.has("preview");
  const previewWebsiteId = url.searchParams.get("website_id");

  // Local development
  if (host.includes("localhost")) {
    return {
      subdomain: process.env.DEV_SUBDOMAIN || null,
      customDomain: null,
      isPreview,
      previewWebsiteId,
    };
  }

  // Subdomain pattern: cliente.neumorstudio.com
  const neumorMatch = host.match(/^([^.]+)\.neumorstudio\.com$/);
  if (neumorMatch) {
    // Exclude admin subdomain
    if (neumorMatch[1] === "admin") {
      return {
        subdomain: null,
        customDomain: null,
        isPreview,
        previewWebsiteId,
      };
    }
    return {
      subdomain: neumorMatch[1],
      customDomain: null,
      isPreview,
      previewWebsiteId,
    };
  }

  // Custom domain: reformasgarcia.com
  return {
    subdomain: null,
    customDomain: host.replace(/^www\./, ""),
    isPreview,
    previewWebsiteId,
  };
}

async function resolveWebsite(
  subdomain: string | null,
  customDomain: string | null,
  request: NextRequest
): Promise<Website | null> {
  if (!subdomain && !customDomain) return null;

  const cacheKey = subdomain || customDomain || "";

  // Check cache
  const cached = websiteCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }

  // Query Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // No-op in middleware for initial request
        },
      },
    }
  );

  let query = supabase
    .from("websites")
    .select("id, client_id, subdomain, custom_domain, domain_status, theme, config, is_active")
    .eq("is_active", true);

  if (subdomain) {
    query = query.eq("subdomain", subdomain);
  } else if (customDomain) {
    query = query.eq("custom_domain", customDomain);
  }

  const { data: websiteData, error } = await query.single();

  if (error || !websiteData) return null;

  // Get client's business_type
  const { data: clientData } = await supabase
    .from("clients")
    .select("business_type")
    .eq("id", websiteData.client_id)
    .single();

  const website: Website = {
    id: websiteData.id,
    client_id: websiteData.client_id,
    subdomain: websiteData.subdomain,
    custom_domain: websiteData.custom_domain,
    domain_status: websiteData.domain_status || "subdomain",
    theme: websiteData.theme || "light",
    config: websiteData.config || {},
    is_active: websiteData.is_active,
    business_type: clientData?.business_type || "restaurant",
  };

  // Update cache
  websiteCache.set(cacheKey, {
    data: website,
    expires: Date.now() + CACHE_TTL,
  });

  return website;
}

async function handlePreviewMode(
  request: NextRequest,
  websiteId: string
): Promise<NextResponse> {
  console.error("[handlePreviewMode] Called with websiteId:", websiteId);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {},
      },
    }
  );

  // First get the website (use maybeSingle to debug RLS issues)
  const { data: websiteData, error: websiteError } = await supabase
    .from("websites")
    .select("id, client_id, subdomain, custom_domain, domain_status, theme, config, is_active")
    .eq("id", websiteId)
    .maybeSingle();

  console.error("[handlePreviewMode] Website query - data:", websiteData, "error:", websiteError?.message, "code:", websiteError?.code);

  if (!websiteData) {
    console.error("[handlePreviewMode] No website found, returning not-found");
    const url = request.nextUrl.clone();
    url.pathname = "/_not-found";
    return NextResponse.rewrite(url);
  }

  // Then get the client's business_type
  const { data: clientData } = await supabase
    .from("clients")
    .select("business_type")
    .eq("id", websiteData.client_id)
    .single();

  console.error("[handlePreviewMode] Found website:", websiteData.id, "business_type:", clientData?.business_type);

  const data = { ...websiteData, business_type: clientData?.business_type || "restaurant" };

  // Set on REQUEST headers so pages can read them
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", data.id);
  requestHeaders.set("x-tenant-theme", data.theme || "light");
  requestHeaders.set("x-tenant-config", JSON.stringify(data.config || {}));
  requestHeaders.set("x-business-type", data.business_type);
  requestHeaders.set("x-preview-mode", "true");

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Also set cookies as backup (more reliable in Next.js 15)
  response.cookies.set("x-tenant-id", data.id, { path: "/" });
  response.cookies.set("x-tenant-theme", data.theme || "light", { path: "/" });
  response.cookies.set("x-business-type", data.business_type, { path: "/" });

  return response;
}

async function handlePortalAuth(
  request: NextRequest,
  response: NextResponse,
  website: Website
): Promise<NextResponse> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options?: Parameters<typeof response.cookies.set>[2];
          }>
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public paths that don't require auth
  const publicPaths = ["/mi-cuenta", "/mi-cuenta/callback"];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);

  if (!user && !isPublicPath) {
    // Redirect to login
    const url = request.nextUrl.clone();
    url.pathname = "/mi-cuenta";
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/mi-cuenta") {
    // Already logged in, redirect to dashboard
    const url = request.nextUrl.clone();
    url.pathname = "/mi-cuenta/inicio";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
