import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import GymSessions from "@/components/portal/gym/GymSessions";
import SalonAppointments from "@/components/portal/salon/SalonAppointments";
import RestaurantReservations from "@/components/portal/restaurant/RestaurantReservations";
import ClinicAppointments from "@/components/portal/clinic/ClinicAppointments";
import RepairsWorkOrders from "@/components/portal/repairs/RepairsWorkOrders";
import StoreOrders from "@/components/portal/store/StoreOrders";

// ============ DATA FETCHING FUNCTIONS ============

async function getGymSessionsData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: sessions } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, services")
    .eq("customer_id", customer.id)
    .order("booking_date", { ascending: false });

  return (sessions || []).map((s) => ({
    id: s.id,
    date: s.booking_date,
    time: s.booking_time,
    class_name: Array.isArray(s.services) ? s.services[0] || "Sesion" : "Sesion",
    trainer_name: undefined,
    status: s.status,
  }));
}

async function getSalonAppointmentsData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, services, total_price, notes")
    .eq("customer_id", customer.id)
    .order("booking_date", { ascending: false });

  return (bookings || []).map((b) => ({
    id: b.id,
    date: b.booking_date,
    time: b.booking_time,
    services: Array.isArray(b.services) ? b.services : [],
    status: b.status,
    price: b.total_price,
    notes: b.notes,
  }));
}

async function getRestaurantReservationsData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, party_size, notes")
    .eq("customer_id", customer.id)
    .order("booking_date", { ascending: false });

  return (bookings || []).map((b) => ({
    id: b.id,
    date: b.booking_date,
    time: b.booking_time,
    party_size: b.party_size || 2,
    status: b.status,
    notes: b.notes,
  }));
}

async function getClinicAppointmentsData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, booking_time, status, services, notes")
    .eq("customer_id", customer.id)
    .order("booking_date", { ascending: false });

  return (bookings || []).map((b) => ({
    id: b.id,
    date: b.booking_date,
    time: b.booking_time,
    treatment: Array.isArray(b.services) ? b.services[0] || "Consulta" : "Consulta",
    doctor: undefined,
    status: b.status,
    notes: b.notes,
  }));
}

async function getRepairsWorkOrdersData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, booking_date, status, services, total_price, notes, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return (bookings || []).map((b) => ({
    id: b.id,
    title: Array.isArray(b.services) ? b.services[0] || "Trabajo" : "Trabajo",
    description: b.notes,
    status: b.status,
    created_at: b.created_at,
    estimated_completion: b.booking_date,
    price: b.total_price,
  }));
}

async function getStoreOrdersData(tenantId: string, userId: string) {
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("website_id", tenantId)
    .eq("auth_user_id", userId)
    .single();

  if (!customer) return null;

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, total_price, created_at, notes")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false });

  return (bookings || []).map((b, idx) => ({
    id: b.id,
    order_number: `ORD-${String(idx + 1).padStart(4, "0")}`,
    status: b.status === "completed" ? "delivered" : b.status === "confirmed" ? "shipped" : "processing",
    total: b.total_price || 0,
    created_at: b.created_at,
    items_count: 1,
    tracking_number: b.status === "confirmed" ? `TRK${b.id.slice(0, 8).toUpperCase()}` : undefined,
  }));
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

export default async function ReservasPage() {
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

  switch (businessType) {
    case "gym": {
      const sessions = await getGymSessionsData(tenantId, user.id);
      if (!sessions) return <ErrorState />;
      return <GymSessions sessions={sessions} />;
    }

    case "salon": {
      const appointments = await getSalonAppointmentsData(tenantId, user.id);
      if (!appointments) return <ErrorState />;
      return <SalonAppointments appointments={appointments} />;
    }

    case "restaurant": {
      const reservations = await getRestaurantReservationsData(tenantId, user.id);
      if (!reservations) return <ErrorState />;
      return <RestaurantReservations reservations={reservations} />;
    }

    case "clinic": {
      const appointments = await getClinicAppointmentsData(tenantId, user.id);
      if (!appointments) return <ErrorState />;
      return <ClinicAppointments appointments={appointments} />;
    }

    case "repairs": {
      const workOrders = await getRepairsWorkOrdersData(tenantId, user.id);
      if (!workOrders) return <ErrorState />;
      return <RepairsWorkOrders workOrders={workOrders} />;
    }

    case "store": {
      const orders = await getStoreOrdersData(tenantId, user.id);
      if (!orders) return <ErrorState />;
      return <StoreOrders orders={orders} />;
    }

    default: {
      const reservations = await getRestaurantReservationsData(tenantId, user.id);
      if (!reservations) return <ErrorState />;
      return <RestaurantReservations reservations={reservations} />;
    }
  }
}
