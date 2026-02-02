import type { APIRoute } from "astro";
import type { TenantData } from "../../middleware";
import { createPortalClient } from "../../lib/supabase-portal";

export const POST: APIRoute = async ({ request, cookies, redirect, locals }) => {
  const tenant = (locals as { tenant?: TenantData }).tenant;
  if (!tenant) {
    return redirect("/mi-cuenta?error=no_tenant");
  }

  const supabase = createPortalClient(cookies, request);
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  if (!accessToken) {
    return redirect("/mi-cuenta?error=auth_required");
  }

  const formData = await request.formData();
  const bookingId = formData.get("booking_id");

  if (!bookingId || typeof bookingId !== "string") {
    return redirect("/mi-cuenta/reservas?error=missing_booking");
  }

  const adminUrl = import.meta.env.PUBLIC_ADMIN_URL;
  if (!adminUrl) {
    return redirect("/mi-cuenta/reservas?error=missing_admin");
  }

  const host = request.headers.get("host") || "";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = host ? `${protocol}://${host}` : undefined;

  const response = await fetch(`${adminUrl}/api/bookings/cancel`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify({ booking_id: bookingId }),
  });

  if (!response.ok) {
    return redirect("/mi-cuenta/reservas?error=cancel_failed");
  }

  return redirect("/mi-cuenta/reservas?cancel=ok");
};
