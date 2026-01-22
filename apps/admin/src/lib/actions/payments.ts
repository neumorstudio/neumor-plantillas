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

export async function createPayment(formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const amountStr = formData.get("amount") as string;
  const amount = Math.round(parseFloat(amountStr) * 100); // Convertir a céntimos

  const status = formData.get("status") as string || "pending";

  const { error } = await supabase.from("payments").insert({
    website_id: websiteId,
    client_name: formData.get("client_name") as string,
    amount,
    method: formData.get("method") as string || null,
    status,
    due_date: formData.get("due_date") as string || null,
    paid_at: status === "paid" ? new Date().toISOString() : null,
    notes: formData.get("notes") as string || null,
    job_id: formData.get("job_id") as string || null,
    customer_id: formData.get("customer_id") as string || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pagos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePayment(id: string, formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const amountStr = formData.get("amount") as string;
  const amount = Math.round(parseFloat(amountStr) * 100);

  const status = formData.get("status") as string;
  const currentStatus = formData.get("current_status") as string;

  const updateData: Record<string, unknown> = {
    client_name: formData.get("client_name") as string,
    amount,
    method: formData.get("method") as string || null,
    status,
    due_date: formData.get("due_date") as string || null,
    notes: formData.get("notes") as string || null,
  };

  // Si cambia a pagado, registrar fecha de pago
  if (status === "paid" && currentStatus !== "paid") {
    updateData.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("payments")
    .update(updateData)
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pagos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePayment(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("payments")
    .delete()
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pagos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markPaymentAsPaid(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/pagos");
  revalidatePath("/dashboard");
  return { success: true };
}
