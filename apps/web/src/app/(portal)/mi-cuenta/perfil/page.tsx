import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import GymProfile from "@/components/portal/gym/GymProfile";
// import SalonProfile from "@/components/portal/salon/SalonProfile";
// import RestaurantProfile from "@/components/portal/restaurant/RestaurantProfile";

async function getProfileData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  return customer;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const headersList = await headers();
  const tenantId = headersList.get("x-tenant-id");
  const businessType = headersList.get("x-business-type") || "restaurant";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !tenantId) {
    redirect("/mi-cuenta");
  }

  const customer = await getProfileData(tenantId, user.id);

  if (!customer) {
    return (
      <div className="portal-empty">
        <p className="portal-empty-title">Error al cargar datos</p>
        <p className="portal-empty-text">No se pudo encontrar tu perfil.</p>
      </div>
    );
  }

  switch (businessType) {
    case "gym":
      return <GymProfile customer={customer} />;

    // case "salon":
    //   return <SalonProfile customer={customer} />;

    // case "restaurant":
    //   return <RestaurantProfile customer={customer} />;

    default:
      return <GymProfile customer={customer} />;
  }
}
