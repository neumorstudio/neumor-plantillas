// Dashboard Layout - Server Component
// Obtiene datos del cliente en el servidor, elimina el flash de "Cargando..."
import { createClient } from "@/lib/supabase-server";
import { Sidebar } from "./Sidebar";

// Tipo para la configuración del business type
interface BusinessTypeConfig {
  business_type: string;
  label: string;
  visible_sections: string[];
  dashboard_widgets: string[];
  default_section: string;
  icon: string | null;
}

// Configuración por defecto si no se encuentra en la BD
const DEFAULT_CONFIG: BusinessTypeConfig = {
  business_type: "restaurant",
  label: "Restaurante",
  visible_sections: ["dashboard", "reservas", "leads", "presupuestos", "newsletter", "clientes", "personalizacion", "configuracion"],
  dashboard_widgets: ["bookings_today", "bookings_month", "leads_new", "bookings_pending"],
  default_section: "dashboard",
  icon: "utensils",
};

// Obtener info del cliente y configuración del business type
async function getClientInfo() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let businessName = "";
  let businessType = "restaurant";
  let email = "";

  // Primero intentar obtener de user_metadata (mas rapido)
  if (user.user_metadata?.business_name) {
    businessName = user.user_metadata.business_name as string;
    businessType = (user.user_metadata.business_type as string) || "restaurant";
    email = user.email || "";
  } else {
    // Si no hay metadata, buscar en la tabla clients
    const { data: client } = await supabase
      .from("clients")
      .select("business_name, business_type, email")
      .eq("auth_user_id", user.id)
      .single();

    if (client) {
      businessName = client.business_name;
      businessType = client.business_type;
      email = client.email;
    }
  }

  // Obtener configuración del business type
  const { data: config } = await supabase
    .from("business_type_config")
    .select("*")
    .eq("business_type", businessType)
    .single();

  return {
    businessName,
    businessType,
    email,
    config: (config as BusinessTypeConfig) || { ...DEFAULT_CONFIG, business_type: businessType },
  };
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

  // Preparar props para el Sidebar
  const sidebarProps = clientInfo
    ? {
        clientInfo: {
          businessName: clientInfo.businessName,
          businessType: clientInfo.businessType,
          email: clientInfo.email,
        },
        visibleSections: clientInfo.config.visible_sections,
        businessTypeLabel: clientInfo.config.label,
        showGoogleBusiness,
      }
    : {
        clientInfo: null,
        visibleSections: DEFAULT_CONFIG.visible_sections,
        businessTypeLabel: DEFAULT_CONFIG.label,
        showGoogleBusiness,
      };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar - Client Component para interactividad */}
      <Sidebar {...sidebarProps} />

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
