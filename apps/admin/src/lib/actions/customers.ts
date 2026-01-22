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

export async function createCustomer(formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase.from("customers").insert({
    website_id: websiteId,
    name: formData.get("name") as string,
    email: formData.get("email") as string || null,
    phone: formData.get("phone") as string || null,
    address: formData.get("address") as string || null,
    notes: formData.get("notes") as string || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function updateCustomer(id: string, formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("customers")
    .update({
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      notes: formData.get("notes") as string || null,
    })
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  return { success: true };
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/clientes");
  return { success: true };
}
