import { createClient } from "@/lib/supabase-server";
import { NewsletterClient } from "./newsletter-client";

interface Template {
  id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  html_content: string;
  is_active: boolean;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  recipients_count: number;
  opened_count: number;
  sent_at: string | null;
  created_at: string;
}

interface Automation {
  id: string;
  is_enabled: boolean;
  frequency: "daily" | "weekly" | "biweekly" | "monthly";
  day_of_week: number;
  day_of_month: number;
  send_time: string;
  timezone: string;
  auto_audience: string;
  default_template_id: string | null;
  next_scheduled_at: string | null;
  last_sent_at: string | null;
  total_campaigns_sent: number;
}

async function getNewsletterData(websiteId: string) {
  const supabase = await createClient();

  // Get templates
  const { data: templates } = await supabase
    .from("newsletter_templates")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false });

  // Get recent campaigns
  const { data: campaigns } = await supabase
    .from("newsletter_campaigns")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .limit(10);

  // Get subscriber count from newsletter_subscribers table
  const { count: subscriberCount } = await supabase
    .from("newsletter_subscribers")
    .select("*", { count: "exact", head: true })
    .eq("website_id", websiteId)
    .eq("is_subscribed", true);

  // Get automation config
  const { data: automation } = await supabase
    .from("newsletter_automation")
    .select("*")
    .eq("website_id", websiteId)
    .single();

  return {
    templates: templates || [],
    campaigns: campaigns || [],
    subscriberCount: subscriberCount || 0,
    automation: automation || null,
  };
}

async function getWebsiteId() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  if (!client) return null;

  const { data: website } = await supabase
    .from("websites")
    .select("id")
    .eq("client_id", client.id)
    .single();

  return website?.id || null;
}

export default async function NewsletterPage() {
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Newsletter</h1>
        <p className="text-[var(--text-secondary)]">
          No se encontro la cuenta asociada.
        </p>
      </div>
    );
  }

  const { templates, campaigns, subscriberCount, automation } = await getNewsletterData(websiteId);

  return (
    <NewsletterClient
      websiteId={websiteId}
      initialTemplates={templates as Template[]}
      initialCampaigns={campaigns as Campaign[]}
      subscriberCount={subscriberCount}
      initialAutomation={automation as Automation | null}
    />
  );
}
