import {
  getBookingsForMonth,
  getBusinessHourSlots,
  getBusinessHours,
  getBusinessType,
  getCustomers,
  getProfessionals,
  getSessionsForMonth,
  getSpecialDays,
  getTrainerServices,
  getClientPackages,
} from "@/lib/data";
import CalendarioClient from "./calendario-client";
import { CalendarioFitnessClient } from "./calendario-fitness-client";

export default async function CalendarioPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const businessType = await getBusinessType();
  const isFitness = businessType === "fitness";

  if (isFitness) {
    // Fitness calendar - personal trainer
    const [hours, slots, sessions, specialDays, customers, services, packages] = await Promise.all([
      getBusinessHours(),
      getBusinessHourSlots(),
      getSessionsForMonth(year, month),
      getSpecialDays(),
      getCustomers(),
      getTrainerServices(),
      getClientPackages(),
    ]);

    return (
      <CalendarioFitnessClient
        initialHours={hours}
        initialSlots={slots}
        initialSessions={sessions}
        initialSpecialDays={specialDays}
        customers={customers}
        services={services}
        packages={packages}
        year={year}
        month={month}
      />
    );
  }

  // Default calendar - salon, clinic, etc.
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
