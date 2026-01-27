import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import GymProgress from "@/components/portal/gym/GymProgress";

async function getProgressData(tenantId: string, userId: string) {
  const supabase = await createClient();

  // Get customer profile
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  // Get progress records
  const { data: progress } = await supabase
    .from("customer_progress")
    .select("id, date, weight, body_fat, muscle_mass, notes")
    .eq("customer_id", customer.id)
    .order("date", { ascending: false });

  return progress || [];
}

export default async function ProgressPage() {
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

  // Only gym has progress page
  if (businessType !== "gym") {
    redirect("/mi-cuenta/inicio");
  }

  const progress = await getProgressData(tenantId, user.id);

  if (!progress) {
    return (
      <div className="portal-empty">
        <p className="portal-empty-title">Error al cargar datos</p>
        <p className="portal-empty-text">No se pudo encontrar tu perfil.</p>
      </div>
    );
  }

  return <GymProgress progress={progress} />;
}
