import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import GymDashboard from "@/components/portal/gym/GymDashboard";
import SalonDashboard from "@/components/portal/salon/SalonDashboard";
import RestaurantDashboard from "@/components/portal/restaurant/RestaurantDashboard";
import ClinicDashboard from "@/components/portal/clinic/ClinicDashboard";
import RepairsDashboard from "@/components/portal/repairs/RepairsDashboard";
import StoreDashboard from "@/components/portal/store/StoreDashboard";

// ============ DATA FETCHING FUNCTIONS ============

async function getGymData(tenantId: string, userId: string) {
  const supabase = await createClient();

  // DEBUG
  console.error("[getGymData] tenantId:", tenantId, "userId:", userId);

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  // DEBUG
  console.error("[getGymData] customer:", customer, "error:", customerError?.message);

  if (!customer) return null;

  const { data: sessions } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, services")
    .eq("customer_id", customer.id)
    .order("booking_date", { ascending: false })
    .limit(20);

  const { data: packages } = await supabase
    .from("customer_packages")
    .select("id, package_name, sessions_remaining, status, expires_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  const { data: progress } = await supabase
    .from("customer_progress")
    .select("id, date, weight, body_fat, muscle_mass, notes")
    .eq("customer_id", customer.id)
    .order("date", { ascending: false })
    .limit(10);

  return {
    customer,
    sessions: (sessions || []).map((s) => ({
      id: s.id,
      date: s.booking_date,
      time: s.booking_time,
      class_name: Array.isArray(s.services) ? s.services[0] || "Sesion" : "Sesion",
      trainer_name: undefined,
      status: s.status,
    })),
    packages: (packages || []).map((p) => ({
      id: p.id,
      name: p.package_name,
      sessions_remaining: p.sessions_remaining || 0,
      status: p.status,
    })),
    progress: progress || [],
  };
}

async function getSalonData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, services, total_price")
    .eq("customer_id", customer.id)
    .order("booking_date", { ascending: false });

  return {
    customer,
    appointments: (bookings || []).map((b) => ({
      id: b.id,
      date: b.booking_date,
      time: b.booking_time,
      services: Array.isArray(b.services) ? b.services : [],
      status: b.status,
      price: b.total_price,
    })),
  };
}

async function getRestaurantData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, phone, loyalty_points")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, party_size, notes")
    .eq("customer_id", customer.id)
    .order("booking_date", { ascending: false });

  return {
    customer,
    reservations: (bookings || []).map((b) => ({
      id: b.id,
      date: b.booking_date,
      time: b.booking_time,
      party_size: b.party_size || 2,
      status: b.status,
      notes: b.notes,
    })),
    loyaltyPoints: customer.loyalty_points || 0,
  };
}

async function getClinicData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, services, notes")
    .eq("customer_id", customer.id)
    .order("booking_date", { ascending: false });

  return {
    customer,
    appointments: (bookings || []).map((b) => ({
      id: b.id,
      date: b.booking_date,
      time: b.booking_time,
      treatment: Array.isArray(b.services) ? b.services[0] || "Consulta" : "Consulta",
      doctor: undefined,
      status: b.status,
      notes: b.notes,
    })),
  };
}

async function getRepairsData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, status, services, total_price, notes, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return {
    customer,
    workOrders: (bookings || []).map((b) => ({
      id: b.id,
      title: Array.isArray(b.services) ? b.services[0] || "Trabajo" : "Trabajo",
      description: b.notes,
      status: b.status,
      created_at: b.created_at,
      estimated_completion: b.booking_date,
      price: b.total_price,
    })),
  };
}

async function getStoreData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, name, email, phone, loyalty_points")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, total_price, created_at, notes")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return {
    customer,
    orders: (bookings || []).map((b, idx) => ({
      id: b.id,
      order_number: `ORD-${String(idx + 1).padStart(4, "0")}`,
      status: b.status === "completed" ? "delivered" : b.status === "confirmed" ? "shipped" : "processing",
      total: b.total_price || 0,
      created_at: b.created_at,
      items_count: 1,
      tracking_number: b.status === "confirmed" ? `TRK${b.id.slice(0, 8).toUpperCase()}` : undefined,
    })),
    loyaltyPoints: customer.loyalty_points || 0,
  };
}

// ============ ERROR COMPONENT ============

function ErrorState() {
  return (
    <div className="portal-empty">
      <p className="portal-empty-title">Error al cargar datos</p>
      <p className="portal-empty-text">No se pudo encontrar tu perfil.</p>
    </div>
  );
}

// ============ PAGE COMPONENT ============

export default async function DashboardPage() {
  const supabase = await createClient();
  const headersList = await headers();
  const cookieStore = await cookies();

  // Try headers first, fallback to cookies
  const tenantId = headersList.get("x-tenant-id") || cookieStore.get("x-tenant-id")?.value;
  const businessType = headersList.get("x-business-type") || cookieStore.get("x-business-type")?.value || "restaurant";

  // DEBUG
  console.error("[DashboardPage] tenantId from headers:", headersList.get("x-tenant-id"));
  console.error("[DashboardPage] tenantId from cookies:", cookieStore.get("x-tenant-id")?.value);
  console.error("[DashboardPage] tenantId final:", tenantId);
  console.error("[DashboardPage] businessType:", businessType);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // DEBUG
  console.error("[DashboardPage] user:", user?.id, user?.email);

  if (!user || !tenantId) {
    console.error("[DashboardPage] Missing user or tenantId, redirecting to /mi-cuenta");
    redirect("/mi-cuenta");
  }

  switch (businessType) {
    case "gym": {
      const data = await getGymData(tenantId, user.id);
      if (!data) return <ErrorState />;
      return (
        <GymDashboard
          customer={data.customer}
          sessions={data.sessions}
          packages={data.packages}
          progress={data.progress}
        />
      );
    }

    case "salon": {
      const data = await getSalonData(tenantId, user.id);
      if (!data) return <ErrorState />;
      return (
        <SalonDashboard
          customer={data.customer}
          appointments={data.appointments}
        />
      );
    }

    case "restaurant": {
      const data = await getRestaurantData(tenantId, user.id);
      if (!data) return <ErrorState />;
      return (
        <RestaurantDashboard
          customer={data.customer}
          reservations={data.reservations}
          loyaltyPoints={data.loyaltyPoints}
        />
      );
    }

    case "clinic": {
      const data = await getClinicData(tenantId, user.id);
      if (!data) return <ErrorState />;
      return (
        <ClinicDashboard
          customer={data.customer}
          appointments={data.appointments}
        />
      );
    }

    case "repairs": {
      const data = await getRepairsData(tenantId, user.id);
      if (!data) return <ErrorState />;
      return (
        <RepairsDashboard
          customer={data.customer}
          workOrders={data.workOrders}
        />
      );
    }

    case "store": {
      const data = await getStoreData(tenantId, user.id);
      if (!data) return <ErrorState />;
      return (
        <StoreDashboard
          customer={data.customer}
          orders={data.orders}
          loyaltyPoints={data.loyaltyPoints}
        />
      );
    }

    default: {
      // Fallback to restaurant as it's the most common
      const data = await getRestaurantData(tenantId, user.id);
      if (!data) return <ErrorState />;
      return (
        <RestaurantDashboard
          customer={data.customer}
          reservations={data.reservations}
          loyaltyPoints={data.loyaltyPoints}
        />
      );
    }
  }
}
