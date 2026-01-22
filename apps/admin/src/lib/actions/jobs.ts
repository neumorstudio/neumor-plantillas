"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

// Convertir un presupuesto (lead con lead_type=quote) en trabajo
export async function convertQuoteToJob(quoteId: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  // Obtener datos del presupuesto
  const { data: quote, error: quoteError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", quoteId)
    .eq("website_id", websiteId)
    .eq("lead_type", "quote")
    .single();

  if (quoteError || !quote) {
    return { error: "Presupuesto no encontrado" };
  }

  // Extraer importe del details si existe
  const details = quote.details as { amount?: number; description?: string; address?: string } | null;
  const totalAmount = details?.amount ? Math.round(details.amount * 100) : null;

  // Crear el trabajo
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .insert({
      website_id: websiteId,
      quote_id: quoteId,
      client_name: quote.name,
      client_email: quote.email,
      client_phone: quote.phone,
      address: details?.address || null,
      description: details?.description || quote.message,
      status: "pending",
      total_amount: totalAmount,
    })
    .select()
    .single();

  if (jobError) {
    return { error: jobError.message };
  }

  // Marcar el presupuesto como convertido
  await supabase
    .from("leads")
    .update({ status: "converted" })
    .eq("id", quoteId);

  revalidatePath("/dashboard/presupuestos");
  revalidatePath("/dashboard/trabajos");
  revalidatePath("/dashboard");

  return { success: true, jobId: job.id };
}

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const totalAmountStr = formData.get("total_amount") as string;
  const totalAmount = totalAmountStr ? Math.round(parseFloat(totalAmountStr) * 100) : null;

  const { data, error } = await supabase.from("jobs").insert({
    website_id: websiteId,
    client_name: formData.get("client_name") as string,
    client_email: formData.get("client_email") as string || null,
    client_phone: formData.get("client_phone") as string || null,
    address: formData.get("address") as string || null,
    description: formData.get("description") as string || null,
    status: formData.get("status") as string || "pending",
    estimated_end_date: formData.get("estimated_end_date") as string || null,
    total_amount: totalAmount,
    quote_id: formData.get("quote_id") as string || null,
    customer_id: formData.get("customer_id") as string || null,
  }).select().single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/trabajos");
  revalidatePath("/dashboard");
  return { success: true, data };
}

export async function updateJob(id: string, formData: FormData) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const totalAmountStr = formData.get("total_amount") as string;
  const totalAmount = totalAmountStr ? Math.round(parseFloat(totalAmountStr) * 100) : undefined;

  const updateData: Record<string, unknown> = {
    client_name: formData.get("client_name") as string,
    client_email: formData.get("client_email") as string || null,
    client_phone: formData.get("client_phone") as string || null,
    address: formData.get("address") as string || null,
    description: formData.get("description") as string || null,
    status: formData.get("status") as string,
    estimated_end_date: formData.get("estimated_end_date") as string || null,
    notes: formData.get("notes") as string || null,
  };

  if (totalAmount !== undefined) {
    updateData.total_amount = totalAmount;
  }

  // Si el estado es completed, añadir fecha de fin real
  if (updateData.status === "completed") {
    updateData.actual_end_date = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("jobs")
    .update(updateData)
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/trabajos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteJob(id: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/trabajos");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateJobStatus(id: string, status: string) {
  const supabase = await createClient();
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return { error: "No website found" };
  }

  const updateData: Record<string, unknown> = { status };

  if (status === "completed") {
    updateData.actual_end_date = new Date().toISOString().split("T")[0];
  }

  const { error } = await supabase
    .from("jobs")
    .update(updateData)
    .eq("id", id)
    .eq("website_id", websiteId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/trabajos");
  revalidatePath("/dashboard");
  return { success: true };
}
