"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";

async function getWebsiteId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("websites(id)")
    .eq("auth_user_id", user.id)
    .single();

  // @ts-expect-error - Supabase types issue with nested select
  return client?.websites?.id || null;
}

export async function createSession(formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase.from("bookings").insert({
    website_id: websiteId,
    customer_id: formData.get("customer_id") as string || null,
    customer_name: formData.get("customer_name") as string,
    customer_email: formData.get("customer_email") as string || null,
    customer_phone: formData.get("customer_phone") as string || null,
    booking_date: formData.get("booking_date") as string,
    booking_time: formData.get("booking_time") as string,
    service_id: formData.get("service_id") as string || null,
    package_id: formData.get("package_id") as string || null,
    duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
    status: "confirmed",
    session_notes: formData.get("session_notes") as string || null,
    is_paid: formData.get("is_paid") === "true",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sesiones");
  return { success: true };
}

export async function updateSession(id: string, formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      customer_id: formData.get("customer_id") as string || null,
      customer_name: formData.get("customer_name") as string,
      customer_email: formData.get("customer_email") as string || null,
      customer_phone: formData.get("customer_phone") as string || null,
      booking_date: formData.get("booking_date") as string,
      booking_time: formData.get("booking_time") as string,
      service_id: formData.get("service_id") as string || null,
      package_id: formData.get("package_id") as string || null,
      duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
      status: formData.get("status") as string || "confirmed",
      session_notes: formData.get("session_notes") as string || null,
      workout_summary: formData.get("workout_summary") as string || null,
      is_paid: formData.get("is_paid") === "true",
    })
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sesiones");
  return { success: true };
}

export async function updateSessionStatus(id: string, status: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sesiones");
  return { success: true };
}

export async function completeSession(id: string, formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  // Obtener la sesion para ver si tiene paquete asociado
  const { data: session } = await supabase
    .from("bookings")
    .select("package_id")
    .eq("id", id)
    .eq("website_id", websiteId)
    .single();

  // Marcar sesion como completada
  const { error } = await supabase
    .from("bookings")
    .update({
      status: "completed",
      workout_summary: formData.get("workout_summary") as string || null,
      session_notes: formData.get("session_notes") as string || null,
    })
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  // Si tiene paquete, incrementar sesiones usadas
  if (session?.package_id) {
    const { data: pkg } = await supabase
      .from("client_packages")
      .select("used_sessions, total_sessions")
      .eq("id", session.package_id)
      .single();

    if (pkg) {
      const newUsedSessions = (pkg.used_sessions || 0) + 1;
      const updates: { used_sessions: number; status?: string } = {
        used_sessions: newUsedSessions,
      };

      if (pkg.total_sessions && newUsedSessions >= pkg.total_sessions) {
        updates.status = "completed";
      }

      await supabase
        .from("client_packages")
        .update(updates)
        .eq("id", session.package_id);
    }
  }

  revalidatePath("/dashboard/sesiones");
  revalidatePath("/dashboard/paquetes");
  return { success: true };
}

export async function deleteSession(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/sesiones");
  return { success: true };
}
