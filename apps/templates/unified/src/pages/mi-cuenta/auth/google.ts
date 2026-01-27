import type { APIRoute } from "astro";
import { createPortalClient } from "../../../lib/supabase-portal";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createPortalClient(cookies, request);

  // Get the origin for the redirect URL
  const host = request.headers.get("host") || "localhost:4321";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/mi-cuenta/callback`,
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
