"use server";

import { revalidatePath } from "next/cache";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { requireSuperAdmin } from "@/lib/superadmin";
import type { Database } from "@neumorstudio/supabase";

export interface UserWithClient {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  client: {
    id: string;
    business_name: string;
    business_type: string;
  } | null;
}

export interface ClientOption {
  id: string;
  business_name: string;
  business_type: string;
  has_user: boolean;
}

/**
 * Crea cliente Supabase con service role para operaciones de superadmin.
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
 * Obtiene lista de todos los usuarios con su cliente asociado.
 */
export async function getUsers(): Promise<UserWithClient[]> {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  // Obtener usuarios de auth
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.error("[SUPERADMIN] Error fetching auth users:", authError);
    throw new Error("Error al cargar usuarios");
  }

  // Obtener clientes con auth_user_id para hacer el join
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, business_name, business_type, auth_user_id");

  if (clientsError) {
    console.error("[SUPERADMIN] Error fetching clients:", clientsError);
  }

  // Crear mapa de auth_user_id -> client
  const clientByAuthId = new Map(
    (clients || [])
      .filter((c) => c.auth_user_id)
      .map((c) => [c.auth_user_id, c])
  );

  // Filtrar usuarios que no son superadmin y mapear
  const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

  return authUsers.users
    .filter((u) => !superAdminEmails.includes(u.email?.toLowerCase() || ""))
    .map((user) => {
      const client = clientByAuthId.get(user.id);
      return {
        id: user.id,
        email: user.email || "",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at || null,
        client: client
          ? {
              id: client.id,
              business_name: client.business_name,
              business_type: client.business_type,
            }
          : null,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/**
 * Obtiene lista de clientes disponibles para asignar a un usuario.
 */
export async function getClientsForAssignment(): Promise<ClientOption[]> {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, business_name, business_type, auth_user_id")
    .order("business_name");

  if (error) {
    console.error("[SUPERADMIN] Error fetching clients:", error);
    throw new Error("Error al cargar negocios");
  }

  return (clients || []).map((c) => ({
    id: c.id,
    business_name: c.business_name,
    business_type: c.business_type,
    has_user: !!c.auth_user_id,
  }));
}

/**
 * Crea un nuevo usuario y opcionalmente lo asigna a un negocio.
 */
export async function createUser(formData: FormData) {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const clientId = formData.get("client_id") as string | null;

  // Validaciones
  if (!email || !email.includes("@")) {
    return { error: "Email valido es requerido" };
  }
  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  // Obtener datos del cliente si se proporciona
  let clientData: { business_name: string; business_type: string } | null = null;
  if (clientId) {
    const { data: client } = await supabase
      .from("clients")
      .select("business_name, business_type")
      .eq("id", clientId)
      .single();
    clientData = client;
  }

  // Crear usuario en auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase().trim(),
    password: password,
    email_confirm: true, // Confirmar email automaticamente
    user_metadata: clientData
      ? {
          business_name: clientData.business_name,
          business_type: clientData.business_type,
        }
      : {},
  });

  if (authError) {
    console.error("[SUPERADMIN] Error creating auth user:", authError);
    return { error: authError.message || "Error al crear el usuario" };
  }

  // Si hay cliente, vincularlo
  if (clientId && authData.user) {
    const { error: linkError } = await supabase
      .from("clients")
      .update({ auth_user_id: authData.user.id })
      .eq("id", clientId);

    if (linkError) {
      console.error("[SUPERADMIN] Error linking user to client:", linkError);
      // No hacemos rollback, el usuario ya esta creado
      return { error: "Usuario creado pero error al vincularlo al negocio: " + linkError.message };
    }
  }

  revalidatePath("/super/users");
  return { success: true, userId: authData.user?.id };
}

/**
 * Asigna un usuario existente a un negocio.
 */
export async function assignUserToClient(userId: string, clientId: string | null) {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  // Si hay clientId, verificar que el cliente existe
  if (clientId) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id, business_name, business_type")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return { error: "Negocio no encontrado" };
    }

    // Desvincular cualquier usuario anterior de este cliente
    await supabase
      .from("clients")
      .update({ auth_user_id: null })
      .eq("auth_user_id", userId);

    // Vincular usuario al nuevo cliente
    const { error: linkError } = await supabase
      .from("clients")
      .update({ auth_user_id: userId })
      .eq("id", clientId);

    if (linkError) {
      console.error("[SUPERADMIN] Error assigning user to client:", linkError);
      return { error: linkError.message || "Error al asignar usuario" };
    }

    // Actualizar user_metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {
        business_name: client.business_name,
        business_type: client.business_type,
      },
    });
  } else {
    // Desvincular usuario de cualquier cliente
    const { error } = await supabase
      .from("clients")
      .update({ auth_user_id: null })
      .eq("auth_user_id", userId);

    if (error) {
      console.error("[SUPERADMIN] Error unlinking user:", error);
      return { error: error.message || "Error al desvincular usuario" };
    }

    // Limpiar user_metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: {},
    });
  }

  revalidatePath("/super/users");
  revalidatePath("/super/businesses");
  return { success: true };
}

/**
 * Elimina un usuario.
 */
export async function deleteUser(userId: string) {
  await requireSuperAdmin();

  const supabase = createAdminClient();

  // Primero desvincular de cualquier cliente
  await supabase
    .from("clients")
    .update({ auth_user_id: null })
    .eq("auth_user_id", userId);

  // Eliminar usuario de auth
  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("[SUPERADMIN] Error deleting user:", error);
    return { error: error.message || "Error al eliminar el usuario" };
  }

  revalidatePath("/super/users");
  return { success: true };
}

/**
 * Resetea la contraseña de un usuario.
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  await requireSuperAdmin();

  if (!newPassword || newPassword.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const supabase = createAdminClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    console.error("[SUPERADMIN] Error resetting password:", error);
    return { error: error.message || "Error al cambiar la contraseña" };
  }

  return { success: true };
}
