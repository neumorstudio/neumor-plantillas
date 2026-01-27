import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  console.error("[Callback] Received request with code:", code ? "present" : "missing");

  if (code) {
    const cookieStore = await cookies();

    // Track cookies that need to be set on the response
    const cookiesToSet: Array<{
      name: string;
      value: string;
      options?: Parameters<typeof cookieStore.set>[2];
    }> = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSetFromSupabase: Array<{ name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }>) {
            // Store cookies to set them on the response
            cookiesToSet.push(...cookiesToSetFromSupabase);
            // Also try to set them on the cookie store
            try {
              cookiesToSetFromSupabase.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Can fail in some contexts, but we'll set them on the response
            }
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    console.error("[Callback] Exchange result:", {
      success: !!data.session,
      error: error?.message,
      userId: data.session?.user?.id,
      email: data.session?.user?.email,
    });

    if (error) {
      console.error("[Callback] Error exchanging code:", error.message);
      return NextResponse.redirect(`${origin}/mi-cuenta?error=callback_error`);
    }

    // Link or create customer for this website
    const tenantId = cookieStore.get("x-tenant-id")?.value;
    const user = data.session?.user;

    if (tenantId && user) {
      console.error("[Callback] Linking customer:", { tenantId, userId: user.id, email: user.email });

      const { data: customerId, error: linkError } = await supabase.rpc("link_or_create_customer", {
        p_website_id: tenantId,
        p_auth_user_id: user.id,
        p_email: user.email || "",
        p_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Usuario",
      });

      console.error("[Callback] Customer link result:", { customerId, error: linkError?.message });
    }

    // Create redirect response
    const response = NextResponse.redirect(`${origin}/mi-cuenta/inicio`);

    // Copy all auth cookies to the response
    console.error("[Callback] Setting cookies:", cookiesToSet.map(c => c.name));
    for (const { name, value, options } of cookiesToSet) {
      response.cookies.set(name, value, {
        ...options,
        // Ensure cookies are accessible
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return response;
  }

  // No code provided
  console.error("[Callback] No code in URL, redirecting to login");
  return NextResponse.redirect(`${origin}/mi-cuenta?error=no_code`);
}
