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

export async function createTrainerService(formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase.from("trainer_services").insert({
    website_id: websiteId,
    name: formData.get("name") as string,
    description: formData.get("description") as string || null,
    duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
    price_cents: parseInt(formData.get("price_cents") as string) || 0,
    is_online: formData.get("is_online") === "true",
    is_active: formData.get("is_active") !== "false",
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function updateTrainerService(id: string, formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("trainer_services")
    .update({
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      duration_minutes: parseInt(formData.get("duration_minutes") as string) || 60,
      price_cents: parseInt(formData.get("price_cents") as string) || 0,
      is_online: formData.get("is_online") === "true",
      is_active: formData.get("is_active") !== "false",
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
    })
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/servicios");
  return { success: true };
}

export async function deleteTrainerService(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("trainer_services")
    .delete()
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/servicios");
  return { success: true };
}
