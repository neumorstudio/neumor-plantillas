"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { requireSuperAdmin } from "@/lib/superadmin";
import { getDefaultSectionsConfig, type BusinessType, type Database, type Json } from "@neumorstudio/supabase";

export interface BusinessWithWebsite {
  id: string;
  business_name: string;
  business_type: BusinessType;
  email: string;
  phone: string | null;
  created_at: string;
  website: {
    id: string;
    domain: string;
    is_active: boolean;
    theme: string | null;
  } | null;
}

/**
 * Crea cliente Supabase con service role para operaciones de superadmin.
 * SOLO usar en server-side y despues de verificar superadmin.
 */
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role configuration");
  }

  return createServerClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Obtiene lista de todos los negocios (clients + websites).
 */
export async function getBusinesses(): Promise<BusinessWithWebsite[]> {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      id,
      business_name,
      business_type,
      email,
      phone,
      created_at,
      websites (
        id,
        domain,
        is_active,
        theme
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[SUPERADMIN] Error fetching businesses:", error);
    throw new Error("Error al cargar negocios");
  }

  return (data || []).map((client) => ({
    id: client.id,
    business_name: client.business_name,
    business_type: client.business_type as BusinessType,
    email: client.email,
    phone: client.phone,
    created_at: client.created_at || new Date().toISOString(),
    // websites es one-to-one, tomar el primero
    website: Array.isArray(client.websites)
      ? client.websites[0] || null
      : client.websites || null,
  }));
}

/**
 * Obtiene un negocio por ID.
 */
export async function getBusiness(
  clientId: string
): Promise<BusinessWithWebsite | null> {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      id,
      business_name,
      business_type,
      email,
      phone,
      created_at,
      websites (
        id,
        domain,
        is_active,
        theme
      )
    `
    )
    .eq("id", clientId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    business_name: data.business_name,
    business_type: data.business_type as BusinessType,
    email: data.email,
    phone: data.phone,
    created_at: data.created_at || new Date().toISOString(),
    website: Array.isArray(data.websites)
      ? data.websites[0] || null
      : data.websites || null,
  };
}

/**
 * Parsea un dominio y extrae subdomain o custom_domain.
 * - "misalon.neumorstudio.com" -> { subdomain: "misalon", customDomain: null }
 * - "www.minegocio.com" -> { subdomain: null, customDomain: "minegocio.com" }
 */
function parseDomainInput(domain: string): { subdomain: string | null; customDomain: string | null } {
  const cleanDomain = domain.toLowerCase().trim();

  // Patron: xxx.neumorstudio.com
  const neumorMatch = cleanDomain.match(/^([a-z0-9-]+)\.neumorstudio\.com$/);
  if (neumorMatch) {
    return { subdomain: neumorMatch[1], customDomain: null };
  }

  // Es un dominio personalizado
  const withoutWww = cleanDomain.replace(/^www\./, "");
  return { subdomain: null, customDomain: withoutWww };
}

/**
 * Crea un nuevo negocio (client + website).
 */
export async function createBusiness(formData: FormData) {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  const businessName = formData.get("business_name") as string;
  const businessType = formData.get("business_type") as BusinessType;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const domain = formData.get("domain") as string;
  const theme = (formData.get("theme") as string) || "neuglass";
  const isActive = formData.get("is_active") === "true";

  // Validaciones basicas
  if (!businessName || businessName.trim().length < 2) {
    return { error: "El nombre del negocio es requerido (min 2 caracteres)" };
  }
  if (!businessType) {
    return { error: "El tipo de negocio es requerido" };
  }
  if (!email || !email.includes("@")) {
    return { error: "Email valido es requerido" };
  }
  if (!domain || domain.trim().length < 3) {
    return { error: "El dominio es requerido (min 3 caracteres)" };
  }

  // Parsear dominio para extraer subdomain o custom_domain
  const { subdomain, customDomain } = parseDomainInput(domain);

  if (!subdomain && !customDomain) {
    return { error: "Formato de dominio invalido" };
  }

  // Verificar que el subdomain/domain no existe
  if (subdomain) {
    const { data: existingSubdomain } = await supabase
      .from("websites")
      .select("id")
      .eq("subdomain", subdomain)
      .single();

    if (existingSubdomain) {
      return { error: "Este subdominio ya esta en uso" };
    }
  }

  if (customDomain) {
    const { data: existingCustomDomain } = await supabase
      .from("websites")
      .select("id")
      .eq("custom_domain", customDomain)
      .single();

    if (existingCustomDomain) {
      return { error: "Este dominio personalizado ya esta en uso" };
    }
  }

  // Crear client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      business_name: businessName.trim(),
      business_type: businessType,
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
    })
    .select("id")
    .single();

  if (clientError || !client) {
    console.error("[SUPERADMIN] Error creating client:", clientError);
    return { error: clientError?.message || "Error al crear el negocio" };
  }

  const baseConfig = {
    businessName: businessName.trim(),
    businessType: businessType,
  };
  const configPayload =
    businessType === "restaurant"
      ? {
          ...baseConfig,
          sectionsConfig: getDefaultSectionsConfig(businessType),
        }
      : baseConfig;
  const config = JSON.parse(JSON.stringify(configPayload)) as Json;

  // Crear website con subdomain y/o custom_domain correctamente
  const { data: website, error: websiteError } = await supabase
    .from("websites")
    .insert({
    client_id: client.id,
    subdomain: subdomain,
    custom_domain: customDomain,
    domain: domain.toLowerCase().trim(), // Mantener para retrocompatibilidad
    theme: theme,
    is_active: isActive,
    config: config,
  })
    .select("id")
    .single();

  if (websiteError || !website) {
    // Rollback: eliminar client creado
    await supabase.from("clients").delete().eq("id", client.id);
    console.error("[SUPERADMIN] Error creating website:", websiteError);
    return { error: websiteError.message || "Error al crear el website" };
  }

  if (businessType === "restaurant") {
    const { error: restaurantError } = await supabase.from("restaurants").insert({
      website_id: website.id,
      takeaway_enabled: true,
      is_open: true,
      kitchen_open: true,
      capacity: 20,
    });

    if (restaurantError) {
      await supabase.from("websites").delete().eq("id", website.id);
      await supabase.from("clients").delete().eq("id", client.id);
      console.error("[SUPERADMIN] Error creating restaurant settings:", restaurantError);
      return { error: restaurantError.message || "Error al preparar pedidos del restaurante" };
    }
  }

  revalidatePath("/super/businesses");
  return { success: true, clientId: client.id };
}

/**
 * Actualiza un negocio existente.
 */
export async function updateBusiness(clientId: string, formData: FormData) {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  const businessName = formData.get("business_name") as string;
  const businessType = formData.get("business_type") as BusinessType;
  const email = formData.get("email") as string;
  const phone = (formData.get("phone") as string) || null;
  const domain = formData.get("domain") as string;
  const theme = (formData.get("theme") as string) || "neuglass";
  const isActive = formData.get("is_active") === "true";

  // Validaciones basicas
  if (!businessName || businessName.trim().length < 2) {
    return { error: "El nombre del negocio es requerido (min 2 caracteres)" };
  }
  if (!email || !email.includes("@")) {
    return { error: "Email valido es requerido" };
  }
  if (!domain || domain.trim().length < 3) {
    return { error: "El dominio es requerido (min 3 caracteres)" };
  }

  // Parsear dominio
  const { subdomain, customDomain } = parseDomainInput(domain);

  if (!subdomain && !customDomain) {
    return { error: "Formato de dominio invalido" };
  }

  // Verificar que el subdomain/domain no existe (excepto el actual)
  if (subdomain) {
    const { data: existingSubdomain } = await supabase
      .from("websites")
      .select("id, client_id")
      .eq("subdomain", subdomain)
      .single();

    if (existingSubdomain && existingSubdomain.client_id !== clientId) {
      return { error: "Este subdominio ya esta en uso por otro negocio" };
    }
  }

  if (customDomain) {
    const { data: existingCustomDomain } = await supabase
      .from("websites")
      .select("id, client_id")
      .eq("custom_domain", customDomain)
      .single();

    if (existingCustomDomain && existingCustomDomain.client_id !== clientId) {
      return { error: "Este dominio personalizado ya esta en uso por otro negocio" };
    }
  }

  // Actualizar client
  const { error: clientError } = await supabase
    .from("clients")
    .update({
      business_name: businessName.trim(),
      business_type: businessType,
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
    })
    .eq("id", clientId);

  if (clientError) {
    console.error("[SUPERADMIN] Error updating client:", clientError);
    return { error: clientError.message || "Error al actualizar el negocio" };
  }

  // Actualizar website con subdomain y/o custom_domain
  const { error: websiteError } = await supabase
    .from("websites")
    .update({
      subdomain: subdomain,
      custom_domain: customDomain,
      domain: domain.toLowerCase().trim(),
      theme: theme,
      is_active: isActive,
    })
    .eq("client_id", clientId);

  if (websiteError) {
    console.error("[SUPERADMIN] Error updating website:", websiteError);
    return { error: websiteError.message || "Error al actualizar el website" };
  }

  // Actualizar user_metadata del usuario asociado para sincronizar el business_type
  const { data: clientData } = await supabase
    .from("clients")
    .select("auth_user_id")
    .eq("id", clientId)
    .single();

  if (clientData?.auth_user_id) {
    const { error: userUpdateError } = await supabase.auth.admin.updateUserById(
      clientData.auth_user_id,
      {
        user_metadata: {
          business_name: businessName.trim(),
          business_type: businessType,
        },
      }
    );

    if (userUpdateError) {
      console.error("[SUPERADMIN] Error updating user metadata:", userUpdateError);
      // No retornamos error porque el cliente ya se actualizo correctamente
      // Solo logeamos para debugging
    }
  }

  revalidatePath("/super/businesses");
  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Elimina un negocio y su website.
 * CUIDADO: Esto eliminara todos los datos asociados (cascade).
 */
export async function deleteBusiness(clientId: string) {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  // Primero eliminar el website (tiene FK a client)
  const { error: websiteError } = await supabase
    .from("websites")
    .delete()
    .eq("client_id", clientId);

  if (websiteError) {
    console.error("[SUPERADMIN] Error deleting website:", websiteError);
    // Si hay FK constraints, podria fallar
    return {
      error:
        "No se puede eliminar: hay datos asociados al website. " +
        websiteError.message,
    };
  }

  // Luego eliminar el client
  const { error: clientError } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (clientError) {
    console.error("[SUPERADMIN] Error deleting client:", clientError);
    return { error: clientError.message || "Error al eliminar el negocio" };
  }

  revalidatePath("/super/businesses");
  return { success: true };
}

/**
 * Busca negocios por nombre o email.
 */
export async function searchBusinesses(
  query: string
): Promise<BusinessWithWebsite[]> {
  await requireSuperAdmin();

  if (!query || query.trim().length < 2) {
    return getBusinesses();
  }

  const supabase = createAdminClient();
  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      id,
      business_name,
      business_type,
      email,
      phone,
      created_at,
      websites (
        id,
        domain,
        is_active,
        theme
      )
    `
    )
    .or(`business_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[SUPERADMIN] Error searching businesses:", error);
    throw new Error("Error en la busqueda");
  }

  return (data || []).map((client) => ({
    id: client.id,
    business_name: client.business_name,
    business_type: client.business_type as BusinessType,
    email: client.email,
    phone: client.phone,
    created_at: client.created_at || new Date().toISOString(),
    website: Array.isArray(client.websites)
      ? client.websites[0] || null
      : client.websites || null,
  }));
}
