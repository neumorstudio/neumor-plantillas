// Dashboard Layout - Server Component
// Obtiene datos del cliente en el servidor, elimina el flash de "Cargando..."
import { createClient } from "@/lib/supabase-server";
import { Sidebar } from "./Sidebar";

// Obtener info del cliente desde el servidor
async function getClientInfo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Primero intentar obtener de user_metadata (mas rapido)
  if (user.user_metadata?.business_name) {
    return {
      businessName: user.user_metadata.business_name as string,
      businessType: (user.user_metadata.business_type as string) || "restaurant",
      email: user.email || "",
    };
  }

  // Si no hay metadata, buscar en la tabla clients
  const { data: client } = await supabase
    .from("clients")
    .select("business_name, business_type, email")
    .eq("auth_user_id", user.id)
    .single();

  if (client) {
    return {
      businessName: client.business_name,
      businessType: client.business_type,
      email: client.email,
    };
  }

  return null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Obtener datos en el servidor - sin useEffect, sin flash
  const clientInfo = await getClientInfo();
  const showGoogleBusiness =
    process.env.NEXT_PUBLIC_ENABLE_GOOGLE_BUSINESS === "true";

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Client Component para interactividad */}
      <Sidebar clientInfo={clientInfo} showGoogleBusiness={showGoogleBusiness} />

      {/* Main Content */}
      <main
        className="flex-1 p-8"
        style={{ marginLeft: "var(--sidebar-width)" }}
      >
        {children}
      </main>
    </div>
  );
}
