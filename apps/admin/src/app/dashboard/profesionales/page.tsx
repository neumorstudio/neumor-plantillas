import { getProfessionals } from "@/lib/data";
import ProfesionalesClient from "./profesionales-client";

export default async function ProfesionalesPage() {
  const professionals = await getProfessionals();

  return <ProfesionalesClient initialProfessionals={professionals} />;
}
