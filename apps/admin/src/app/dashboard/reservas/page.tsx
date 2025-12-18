// Reservas Page - Server Component with real Supabase data
import { getBookings } from "@/lib/data";
import ReservasClient from "./reservas-client";

export default async function ReservasPage() {
  const { data: bookings } = await getBookings();

  return <ReservasClient initialBookings={bookings} />;
}
