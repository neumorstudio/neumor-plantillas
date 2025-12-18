import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

// Configuracion Meta (RELLENAR)
const META_CONFIG = {
  appId: process.env.META_APP_ID || "",
  appSecret: process.env.META_APP_SECRET || "",
  redirectUri: process.env.NEXT_PUBLIC_URL
    ? `${process.env.NEXT_PUBLIC_URL}/api/auth/instagram/callback`
    : "http://localhost:3000/api/auth/instagram/callback",
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Error de OAuth
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/instagram?error=oauth_denied", request.url)
    );
  }

  // Sin codigo
  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/instagram?error=no_code", request.url)
    );
  }

  // Verificar configuracion
  if (!META_CONFIG.appId || !META_CONFIG.appSecret) {
    console.error("META_APP_ID o META_APP_SECRET no configurados");
    return NextResponse.redirect(
      new URL("/dashboard/instagram?error=not_configured", request.url)
    );
  }

  try {
    // 1. Intercambiar code por access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_CONFIG.appId}&redirect_uri=${encodeURIComponent(META_CONFIG.redirectUri)}&client_secret=${META_CONFIG.appSecret}&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("Error getting token:", tokenData.error);
      return NextResponse.redirect(
        new URL("/dashboard/instagram?error=token_error", request.url)
      );
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Intercambiar por token de larga duracion (60 dias)
    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_CONFIG.appId}&client_secret=${META_CONFIG.appSecret}&fb_exchange_token=${shortLivedToken}`;

    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json();

    const accessToken = longLivedData.access_token || shortLivedToken;
    const expiresIn = longLivedData.expires_in || 3600;

    // 3. Obtener paginas de Facebook
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    const pagesData = await pagesResponse.json();

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        new URL("/dashboard/instagram?error=no_pages", request.url)
      );
    }

    // Usar la primera pagina (se puede mejorar para seleccionar)
    const page = pagesData.data[0];
    const pageAccessToken = page.access_token;

    // 4. Obtener cuenta de Instagram conectada a la pagina
    const igUrl = `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${pageAccessToken}`;
    const igResponse = await fetch(igUrl);
    const igData = await igResponse.json();

    if (!igData.instagram_business_account) {
      return NextResponse.redirect(
        new URL("/dashboard/instagram?error=no_instagram", request.url)
      );
    }

    const instagramAccountId = igData.instagram_business_account.id;

    // 5. Obtener info de la cuenta de Instagram
    const igInfoUrl = `https://graph.facebook.com/v19.0/${instagramAccountId}?fields=id,username,profile_picture_url&access_token=${pageAccessToken}`;
    const igInfoResponse = await fetch(igInfoUrl);
    const igInfo = await igInfoResponse.json();

    // 6. Guardar en Supabase
    const supabase = await createClient();

    // Obtener user y website
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=not_authenticated", request.url)
      );
    }

    const { data: client } = await supabase
      .from("clients")
      .select("id")
      .eq("email", user.email)
      .single();

    if (!client) {
      return NextResponse.redirect(
        new URL("/dashboard/instagram?error=no_client", request.url)
      );
    }

    const { data: website } = await supabase
      .from("websites")
      .select("id")
      .eq("client_id", client.id)
      .single();

    if (!website) {
      return NextResponse.redirect(
        new URL("/dashboard/instagram?error=no_website", request.url)
      );
    }

    // Calcular expiracion del token
    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Insertar o actualizar cuenta de Instagram
    const { error: upsertError } = await supabase.from("social_accounts").upsert(
      {
        website_id: website.id,
        platform: "instagram",
        account_id: instagramAccountId,
        account_name: igInfo.username,
        account_image: igInfo.profile_picture_url,
        access_token: pageAccessToken, // Usamos el token de la pagina
        token_expires_at: tokenExpiresAt.toISOString(),
        scopes: [
          "instagram_basic",
          "instagram_content_publish",
          "pages_show_list",
          "pages_read_engagement",
        ],
        is_active: true,
        meta: {
          page_id: page.id,
          page_name: page.name,
        },
      },
      {
        onConflict: "website_id,platform,account_id",
      }
    );

    if (upsertError) {
      console.error("Error saving account:", upsertError);
      return NextResponse.redirect(
        new URL("/dashboard/instagram?error=save_error", request.url)
      );
    }

    // Exito
    return NextResponse.redirect(
      new URL("/dashboard/instagram?success=connected", request.url)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/dashboard/instagram?error=unknown", request.url)
    );
  }
}
