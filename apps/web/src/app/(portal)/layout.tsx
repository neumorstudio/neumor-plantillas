import "@/styles/neuglass.css";
import "@/styles/portal.css";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase-server";
import PortalHeader from "@/components/portal/shared/PortalHeader";
import GymBottomNav from "@/components/portal/gym/GymBottomNav";
import SalonBottomNav from "@/components/portal/salon/SalonBottomNav";
import RestaurantBottomNav from "@/components/portal/restaurant/RestaurantBottomNav";
import ClinicBottomNav from "@/components/portal/clinic/ClinicBottomNav";
import RepairsBottomNav from "@/components/portal/repairs/RepairsBottomNav";
import StoreBottomNav from "@/components/portal/store/StoreBottomNav";

async function getCustomerData(tenantId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();
  return data;
}

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const businessType = headersList.get("x-business-type") || "restaurant";
  const configStr = headersList.get("x-tenant-config") || "{}";

  let businessName = "Mi Cuenta";
  try {
    const config = JSON.parse(configStr);
    businessName = config.businessName || "Mi Cuenta";
  } catch {
    // use default
  }

  // Check auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get customer data if logged in
  let customer = null;
  if (user && tenantId) {
    customer = await getCustomerData(tenantId, user.id);
  }

  // Render bottom nav based on business type
  const renderBottomNav = () => {
    if (!customer) return null;

    switch (businessType) {
      case "gym":
        return <GymBottomNav />;
      case "salon":
        return <SalonBottomNav />;
      case "restaurant":
        return <RestaurantBottomNav />;
      case "clinic":
        return <ClinicBottomNav />;
      case "repairs":
        return <RepairsBottomNav />;
      case "store":
        return <StoreBottomNav />;
      default:
        return <GymBottomNav />;
    }
  };

  return (
    <div className="portal-body">
      {customer && (
        <PortalHeader
          customer={customer}
          businessType={businessType}
          businessName={businessName}
        />
      )}
      <main className="portal-main">{children}</main>
      {renderBottomNav()}
    </div>
  );
}
