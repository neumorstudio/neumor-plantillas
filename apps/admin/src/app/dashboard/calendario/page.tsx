import {
  getBookingsForMonth,
  getBusinessHourSlots,
  getBusinessHours,
  getProfessionals,
  getSpecialDays,
} from "@/lib/data";
import CalendarioClient from "./calendario-client";

export default async function CalendarioPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const [hours, slots, bookings, specialDays, professionals] = await Promise.all([
    getBusinessHours(),
    getBusinessHourSlots(),
    getBookingsForMonth(year, month),
    getSpecialDays(),
    getProfessionals(),
  ]);

  return (
    <CalendarioClient
      initialHours={hours}
      initialSlots={slots}
      initialBookings={bookings}
      initialSpecialDays={specialDays}
      initialProfessionals={professionals}
      year={year}
      month={month}
    />
  );
}
