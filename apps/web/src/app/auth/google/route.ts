import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function POST() {
  const supabase = await createClient();
  const headersList = await headers();

  // Get the origin for the redirect URL
  const host = headersList.get("host") || "localhost:3002";
  const protocol = host.includes("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/mi-cuenta/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    console.error("OAuth error:", error.message);
    return NextResponse.redirect(`${origin}/mi-cuenta?error=oauth_error`, { status: 303 });
  }

  if (data.url) {
    // Use 303 to change POST to GET for the OAuth redirect
    return NextResponse.redirect(data.url, { status: 303 });
  }

  return NextResponse.redirect(`${origin}/mi-cuenta?error=no_url`, { status: 303 });
}

// Also handle GET for convenience
export async function GET() {
  return POST();
}
