// ============================================
// OAuth Callback Route
// GET /api/google-business/auth/callback
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
    exchangeCodeForTokens,
    getUserInfo,
    listAccounts,
    listLocations,
    encryptToken,
    formatAddress,
} from "@/lib/google-business-service";

async function getWebsiteForUser(
    supabase: ReturnType<typeof createServerClient>,
    userId: string
) {
    const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("auth_user_id", userId)
        .single();

    if (!client) {
        return null;
    }

    const { data: website } = await supabase
        .from("websites")
        .select("id")
        .eq("client_id", client.id)
        .single();

    return website;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // URL base para redirecciones
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
    const successUrl = `${baseUrl}/dashboard/google-business?success=true`;
    const errorUrl = `${baseUrl}/dashboard/google-business?error=`;

    try {
        // Verificar si hubo error de Google
        if (error) {
            console.error("Google OAuth error:", error);
            return NextResponse.redirect(`${errorUrl}${encodeURIComponent(error)}`);
        }

        // Verificar que tenemos code y state
        if (!code || !state) {
            return NextResponse.redirect(`${errorUrl}missing_params`);
        }

        // Verificar state CSRF
        const cookieStore = await cookies();
        const savedState = cookieStore.get("google_oauth_state")?.value;

        if (!savedState || savedState !== state) {
            return NextResponse.redirect(`${errorUrl}invalid_state`);
        }

        // Limpiar cookie de state
        cookieStore.delete("google_oauth_state");

        // Crear cliente Supabase
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    },
                },
            }
        );

        // Verificar usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.redirect(`${errorUrl}unauthorized`);
        }

        // Obtener website del usuario
        const website = await getWebsiteForUser(supabase, user.id);

        if (!website) {
            return NextResponse.redirect(`${errorUrl}no_website`);
        }

        // Intercambiar code por tokens
        const tokens = await exchangeCodeForTokens(code);

        // Obtener info del usuario de Google
        const userInfo = await getUserInfo(tokens.access_token);

        // Calcular fecha de expiración del token
        const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Encriptar tokens antes de guardar
        const encryptedAccessToken = encryptToken(tokens.access_token);
        const encryptedRefreshToken = encryptToken(tokens.refresh_token);

        // Verificar si ya existe una integración de Google Business para este website
        const { data: existingAccount } = await supabase
            .from("social_accounts")
            .select("id")
            .eq("website_id", website.id)
            .eq("platform", "google_business")
            .single();

        let socialAccountId: string;

        if (existingAccount) {
            // Actualizar cuenta existente
            const { error: updateError } = await supabase
                .from("social_accounts")
                .update({
                    account_id: userInfo.id,
                    account_name: userInfo.email,
                    account_image: userInfo.picture,
                    access_token: encryptedAccessToken,
                    refresh_token: encryptedRefreshToken,
                    token_expires_at: tokenExpiresAt.toISOString(),
                    scopes: tokens.scope.split(" "),
                    is_active: true,
                    last_used_at: new Date().toISOString(),
                    meta: { email: userInfo.email, name: userInfo.name },
                })
                .eq("id", existingAccount.id);

            if (updateError) {
                console.error("Update social account error:", updateError);
                return NextResponse.redirect(`${errorUrl}db_error`);
            }

            socialAccountId = existingAccount.id;

            // Eliminar ubicaciones antiguas (se sincronizarán de nuevo)
            await supabase
                .from("google_business_locations")
                .delete()
                .eq("social_account_id", socialAccountId);
        } else {
            // Crear nueva cuenta
            const { data: newAccount, error: insertError } = await supabase
                .from("social_accounts")
                .insert({
                    website_id: website.id,
                    platform: "google_business",
                    account_id: userInfo.id,
                    account_name: userInfo.email,
                    account_image: userInfo.picture,
                    access_token: encryptedAccessToken,
                    refresh_token: encryptedRefreshToken,
                    token_expires_at: tokenExpiresAt.toISOString(),
                    scopes: tokens.scope.split(" "),
                    is_active: true,
                    last_used_at: new Date().toISOString(),
                    meta: { email: userInfo.email, name: userInfo.name },
                })
                .select("id")
                .single();

            if (insertError || !newAccount) {
                console.error("Insert social account error:", insertError);
                return NextResponse.redirect(`${errorUrl}db_error`);
            }

            socialAccountId = newAccount.id;
        }

        // Sincronizar cuentas y ubicaciones de Google Business
        try {
            const accounts = await listAccounts(tokens.access_token);

            for (const account of accounts) {
                const locations = await listLocations(tokens.access_token, account.name);

                for (const location of locations) {
                    await supabase.from("google_business_locations").insert({
                        social_account_id: socialAccountId,
                        account_name: account.name,
                        location_name: location.name,
                        title: location.title,
                        address: formatAddress(location),
                        phone: location.phoneNumbers?.primaryPhone || null,
                        website_url: location.websiteUri || null,
                        is_verified: location.metadata?.hasGoogleUpdated || false,
                        is_selected: false,
                        metadata: location.metadata || {},
                    });
                }
            }
        } catch (syncError) {
            console.error("Sync locations error:", syncError);
            // No fallamos por esto, el usuario puede sincronizar manualmente
        }

        return NextResponse.redirect(successUrl);
    } catch (error) {
        console.error("OAuth callback error:", error);
        return NextResponse.redirect(`${errorUrl}server_error`);
    }
}
