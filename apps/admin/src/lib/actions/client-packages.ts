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

export async function createClientPackage(formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const totalSessions = formData.get("total_sessions") as string;

  const { error } = await supabase.from("client_packages").insert({
    website_id: websiteId,
    customer_id: formData.get("customer_id") as string,
    name: formData.get("name") as string,
    total_sessions: totalSessions ? parseInt(totalSessions) : null,
    used_sessions: 0,
    price_cents: parseInt(formData.get("price_cents") as string) || 0,
    valid_from: formData.get("valid_from") as string || new Date().toISOString().split("T")[0],
    valid_until: formData.get("valid_until") as string || null,
    status: "active",
    notes: formData.get("notes") as string || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/paquetes");
  return { success: true };
}

export async function updateClientPackage(id: string, formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const totalSessions = formData.get("total_sessions") as string;

  const { error } = await supabase
    .from("client_packages")
    .update({
      name: formData.get("name") as string,
      total_sessions: totalSessions ? parseInt(totalSessions) : null,
      used_sessions: parseInt(formData.get("used_sessions") as string) || 0,
      price_cents: parseInt(formData.get("price_cents") as string) || 0,
      valid_from: formData.get("valid_from") as string,
      valid_until: formData.get("valid_until") as string || null,
      status: formData.get("status") as string || "active",
      notes: formData.get("notes") as string || null,
    })
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/paquetes");
  return { success: true };
}

export async function deleteClientPackage(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("client_packages")
    .delete()
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/paquetes");
  return { success: true };
}

// Incrementar sesiones usadas (cuando se completa una sesion)
export async function incrementPackageUsage(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  // Obtener paquete actual
  const { data: pkg } = await supabase
    .from("client_packages")
    .select("used_sessions, total_sessions")
    .eq("id", id)
    .eq("website_id", websiteId)
    .single();

  if (!pkg) {
    return { error: "Package not found" };
  }

  const newUsedSessions = (pkg.used_sessions || 0) + 1;
  const updates: { used_sessions: number; status?: string } = {
    used_sessions: newUsedSessions,
  };

  // Si se completaron todas las sesiones, marcar como completed
  if (pkg.total_sessions && newUsedSessions >= pkg.total_sessions) {
    updates.status = "completed";
  }

  const { error } = await supabase
    .from("client_packages")
    .update(updates)
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/paquetes");
  revalidatePath("/dashboard/sesiones");
  return { success: true };
}
