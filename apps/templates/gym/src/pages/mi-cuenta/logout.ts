import type { APIRoute } from "astro";
import { createPortalClient } from "../../lib/supabase-portal";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const supabase = createPortalClient(cookies);

  await supabase.auth.signOut();

  return redirect("/mi-cuenta");
};
