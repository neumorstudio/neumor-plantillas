import { createClient } from "@/lib/supabase-server";
import { getWebsiteId } from "@/lib/data";
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

// Optimized: parallel queries instead of sequential
async function getNewsletterData(websiteId: string) {
  const supabase = await createClient();

  // Run all queries in parallel
  const [templatesResult, campaignsResult, subscriberResult, automationResult] = await Promise.all([
    // Get templates
    supabase
      .from("newsletter_templates")
      .select("*")
      .eq("website_id", websiteId)
      .order("created_at", { ascending: false }),
    // Get recent campaigns
    supabase
      .from("newsletter_campaigns")
      .select("*")
      .eq("website_id", websiteId)
      .order("created_at", { ascending: false })
      .limit(10),
    // Get subscriber count
    supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("website_id", websiteId)
      .eq("is_subscribed", true),
    // Get automation config
    supabase
      .from("newsletter_automation")
      .select("*")
      .eq("website_id", websiteId)
      .single(),
  ]);

  return {
    templates: templatesResult.data || [],
    campaigns: campaignsResult.data || [],
    subscriberCount: subscriberResult.count || 0,
    automation: automationResult.data || null,
  };
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
