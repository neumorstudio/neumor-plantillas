// Reservas Page - Server Component with real Supabase data
import { getBookings, getBusinessType } from "@/lib/data";
import ReservasClient from "./reservas-client";

export default async function ReservasPage() {
  const { data: bookings } = await getBookings();
  const businessType = await getBusinessType();

  return <ReservasClient initialBookings={bookings} businessType={businessType} />;
}
