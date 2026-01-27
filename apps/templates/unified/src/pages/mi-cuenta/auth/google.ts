import type { APIRoute } from "astro";
import { createPortalClient } from "../../../lib/supabase-portal";

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const supabase = createPortalClient(cookies, request);

  // Get the origin for the redirect URL
  const host = request.headers.get("host") || "localhost:4321";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  // Check if there's a return_url to redirect back after auth
  const returnUrl = url.searchParams.get("return_url");

  // Store return_url in cookie if provided (don't add to callback URL to avoid Supabase issues)
  if (returnUrl) {
    try {
      const parsed = new URL(returnUrl, origin);
      if (parsed.origin === origin) {
        cookies.set("auth_return_url", returnUrl, {
          path: "/",
          httpOnly: true,
          secure: !host.includes("localhost"),
          sameSite: "lax",
          maxAge: 60 * 10, // 10 minutes
        });
      }
    } catch {
      // Invalid URL, ignore
    }
  }

  const callbackUrl = `${origin}/mi-cuenta/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("OAuth error:", error.message);
    return redirect("/mi-cuenta?error=oauth_error");
  }

  if (data.url) {
    return redirect(data.url);
  }

  return redirect("/mi-cuenta?error=no_url");
};

// Also handle GET for convenience
export const GET: APIRoute = async (context) => {
  return POST(context);
};
