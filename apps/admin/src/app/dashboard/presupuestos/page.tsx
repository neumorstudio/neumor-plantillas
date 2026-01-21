// Presupuestos Page - Server Component with real Supabase data
import { getLeads } from "@/lib/data";
import PresupuestosClient from "./presupuestos-client";

export default async function PresupuestosPage() {
  const { data: leads } = await getLeads();
  const quotes = (leads || []).filter((lead) => lead.lead_type === "quote");

  return <PresupuestosClient initialQuotes={quotes} />;
}
