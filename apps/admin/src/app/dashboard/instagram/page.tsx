import { createClient } from "@/lib/supabase-server";
import { InstagramClient } from "./instagram-client";

// Configuracion de Instagram/Meta (RELLENAR CON TUS CREDENCIALES)
const INSTAGRAM_CONFIG = {
  appId: process.env.META_APP_ID || "TU_APP_ID",
  // NO exponer appSecret al cliente
  redirectUri: process.env.NEXT_PUBLIC_URL
    ? `${process.env.NEXT_PUBLIC_URL}/api/auth/instagram/callback`
    : "http://localhost:3000/api/auth/instagram/callback",
  scopes: [
    "instagram_basic",
    "instagram_content_publish",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ],
};

async function getInstagramAccount(websiteId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("website_id", websiteId)
    .eq("platform", "instagram")
    .single();

  return data;
}

async function getScheduledPosts(websiteId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("website_id", websiteId)
    .order("created_at", { ascending: false })
    .limit(10);

  return data || [];
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
    .eq("email", user.email)
    .single();

  if (!client) return null;

  const { data: website } = await supabase
    .from("websites")
    .select("id")
    .eq("client_id", client.id)
    .single();

  return website?.id || null;
}

export default async function InstagramPage() {
  const websiteId = await getWebsiteId();

  if (!websiteId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Instagram</h1>
        <p className="text-gray-500">No se encontro el sitio web asociado.</p>
      </div>
    );
  }

  const account = await getInstagramAccount(websiteId);
  const posts = await getScheduledPosts(websiteId);

  // URL para iniciar OAuth
  const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${INSTAGRAM_CONFIG.appId}&redirect_uri=${encodeURIComponent(INSTAGRAM_CONFIG.redirectUri)}&scope=${INSTAGRAM_CONFIG.scopes.join(",")}&response_type=code`;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Instagram</h1>

      <InstagramClient
        account={account}
        posts={posts}
        oauthUrl={oauthUrl}
        websiteId={websiteId}
        isConfigured={INSTAGRAM_CONFIG.appId !== "TU_APP_ID"}
      />
    </div>
  );
}
