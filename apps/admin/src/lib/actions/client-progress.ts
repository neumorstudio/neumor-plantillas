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

export async function createClientProgress(formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase.from("client_progress").insert({
    website_id: websiteId,
    customer_id: formData.get("customer_id") as string,
    recorded_at: formData.get("recorded_at") as string || new Date().toISOString().split("T")[0],
    weight_kg: parseFloat(formData.get("weight_kg") as string) || null,
    body_fat_percent: parseFloat(formData.get("body_fat_percent") as string) || null,
    muscle_mass_kg: parseFloat(formData.get("muscle_mass_kg") as string) || null,
    chest_cm: parseFloat(formData.get("chest_cm") as string) || null,
    waist_cm: parseFloat(formData.get("waist_cm") as string) || null,
    hips_cm: parseFloat(formData.get("hips_cm") as string) || null,
    arm_left_cm: parseFloat(formData.get("arm_left_cm") as string) || null,
    arm_right_cm: parseFloat(formData.get("arm_right_cm") as string) || null,
    thigh_left_cm: parseFloat(formData.get("thigh_left_cm") as string) || null,
    thigh_right_cm: parseFloat(formData.get("thigh_right_cm") as string) || null,
    calf_cm: parseFloat(formData.get("calf_cm") as string) || null,
    notes: formData.get("notes") as string || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/progreso");
  return { success: true };
}

export async function updateClientProgress(id: string, formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("client_progress")
    .update({
      recorded_at: formData.get("recorded_at") as string,
      weight_kg: parseFloat(formData.get("weight_kg") as string) || null,
      body_fat_percent: parseFloat(formData.get("body_fat_percent") as string) || null,
      muscle_mass_kg: parseFloat(formData.get("muscle_mass_kg") as string) || null,
      chest_cm: parseFloat(formData.get("chest_cm") as string) || null,
      waist_cm: parseFloat(formData.get("waist_cm") as string) || null,
      hips_cm: parseFloat(formData.get("hips_cm") as string) || null,
      arm_left_cm: parseFloat(formData.get("arm_left_cm") as string) || null,
      arm_right_cm: parseFloat(formData.get("arm_right_cm") as string) || null,
      thigh_left_cm: parseFloat(formData.get("thigh_left_cm") as string) || null,
      thigh_right_cm: parseFloat(formData.get("thigh_right_cm") as string) || null,
      calf_cm: parseFloat(formData.get("calf_cm") as string) || null,
      notes: formData.get("notes") as string || null,
    })
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/progreso");
  return { success: true };
}

export async function deleteClientProgress(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("client_progress")
    .delete()
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/progreso");
  return { success: true };
}

// Records/PRs
export async function createClientRecord(formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase.from("client_records").insert({
    website_id: websiteId,
    customer_id: formData.get("customer_id") as string,
    exercise_name: formData.get("exercise_name") as string,
    record_value: parseFloat(formData.get("record_value") as string),
    record_unit: formData.get("record_unit") as string || "kg",
    previous_value: parseFloat(formData.get("previous_value") as string) || null,
    achieved_at: formData.get("achieved_at") as string || new Date().toISOString().split("T")[0],
    notes: formData.get("notes") as string || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/progreso");
  return { success: true };
}

export async function deleteClientRecord(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("client_records")
    .delete()
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/progreso");
  return { success: true };
}
