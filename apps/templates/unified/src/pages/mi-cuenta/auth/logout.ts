import type { APIRoute } from "astro";
import { createPortalClient } from "../../../lib/supabase-portal";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const supabase = createPortalClient(cookies, request);
  await supabase.auth.signOut();
  return redirect("/");
};

export const GET: APIRoute = async (context) => {
  return POST(context);
};
