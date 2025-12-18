// Leads Page - Server Component with real Supabase data
import { getLeads } from "@/lib/data";
import LeadsClient from "./leads-client";

export default async function LeadsPage() {
  const { data: leads } = await getLeads();

  return <LeadsClient initialLeads={leads} />;
}
