import type { APIRoute } from "astro";
import { createPortalClient } from "../../../lib/supabase-portal";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const redirectTo = formData.get("redirectTo") as string || "/mi-cuenta/callback";

  const supabase = createPortalClient(cookies, request);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    console.error("Error iniciando OAuth:", error.message);
    return redirect("/mi-cuenta?error=auth_failed");
  }

  if (data.url) {
    return redirect(data.url);
  }

  return redirect("/mi-cuenta?error=no_redirect");
};
