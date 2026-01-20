// ============================================
// Google Business Locations API
// GET /api/google-business/locations - List locations
// PUT /api/google-business/locations - Select active location
// ============================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
    decryptToken,
    refreshAccessToken,
    encryptToken,
    isTokenExpiringSoon,
    listAccounts,
    listLocations,
    formatAddress,
    GoogleApiError,
} from "@/lib/google-business-service";

const googleBusinessEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_BUSINESS === "true";

// Helper para obtener Supabase client
async function getSupabaseClient() {
    const cookieStore = await cookies();
    return createServerClient(
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
}

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

// Helper para obtener y refrescar token si es necesario
async function getValidAccessToken(
    supabase: ReturnType<typeof createServerClient>,
    socialAccount: {
        id: string;
        access_token: string;
        refresh_token: string;
        token_expires_at: string;
    },
    forceRefresh: boolean = false
): Promise<string> {
    const expiresAt = new Date(socialAccount.token_expires_at);

    if (forceRefresh || isTokenExpiringSoon(expiresAt)) {
        // Refrescar token
        const refreshToken = decryptToken(socialAccount.refresh_token);
        const newTokens = await refreshAccessToken(refreshToken);

        // Guardar nuevos tokens
        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
        await supabase
            .from("social_accounts")
            .update({
                access_token: encryptToken(newTokens.access_token),
                token_expires_at: newExpiresAt.toISOString(),
                last_used_at: new Date().toISOString(),
            })
            .eq("id", socialAccount.id);

        return newTokens.access_token;
    }

    return decryptToken(socialAccount.access_token);
}

/**
 * GET - Lista ubicaciones del usuario
 */
export async function GET() {
    if (!googleBusinessEnabled) {
        return NextResponse.json({ error: "Google Business disabled" }, { status: 404 });
    }

    try {
        const supabase = await getSupabaseClient();

        // Verificar usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Obtener website
        const website = await getWebsiteForUser(supabase, user.id);

        if (!website) {
            console.log("[DEBUG] /locations GET - No website found for user:", user.id);
            return NextResponse.json({ error: "No website found" }, { status: 404 });
        }

        // Obtener cuenta de Google Business
        const { data: socialAccount } = await supabase
            .from("social_accounts")
            .select("id, account_name, account_image, access_token, refresh_token, token_expires_at, is_active, meta")
            .eq("website_id", website.id)
            .eq("platform", "google_business")
            .single();

        if (!socialAccount) {
            return NextResponse.json({
                connected: false,
                locations: [],
            });
        }

        // Obtener ubicaciones de la DB
        const { data: locations } = await supabase
            .from("google_business_locations")
            .select("*")
            .eq("social_account_id", socialAccount.id)
            .order("title");

        return NextResponse.json({
            connected: true,
            account: {
                id: socialAccount.id,
                email: socialAccount.account_name,
                image: socialAccount.account_image,
                name: (socialAccount.meta as Record<string, string>)?.name || socialAccount.account_name,
                isActive: socialAccount.is_active,
            },
            locations: locations || [],
        });
    } catch (error) {
        console.error("List locations error:", error);
        return NextResponse.json(
            { error: "Failed to list locations" },
            { status: 500 }
        );
    }
}

/**
 * PUT - Selecciona una ubicación como activa
 */
export async function PUT(request: NextRequest) {
    if (!googleBusinessEnabled) {
        return NextResponse.json({ error: "Google Business disabled" }, { status: 404 });
    }

    try {
        const supabase = await getSupabaseClient();
        const body = await request.json();
        const { locationId } = body;

        if (!locationId) {
            return NextResponse.json(
                { error: "locationId is required" },
                { status: 400 }
            );
        }

        // Verificar usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Obtener website
        const website = await getWebsiteForUser(supabase, user.id);

        if (!website) {
            return NextResponse.json({ error: "No website found" }, { status: 404 });
        }

        // Verificar que la ubicación pertenece al usuario
        const { data: location } = await supabase
            .from("google_business_locations")
            .select("id, social_account_id")
            .eq("id", locationId)
            .single();

        if (!location) {
            return NextResponse.json({ error: "Location not found" }, { status: 404 });
        }

        // Verificar que la cuenta pertenece al website del usuario
        const { data: socialAccount } = await supabase
            .from("social_accounts")
            .select("id")
            .eq("id", location.social_account_id)
            .eq("website_id", website.id)
            .single();

        if (!socialAccount) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // Desmarcar todas las ubicaciones de esta cuenta
        await supabase
            .from("google_business_locations")
            .update({ is_selected: false })
            .eq("social_account_id", socialAccount.id);

        // Marcar la ubicación seleccionada
        const { error: updateError } = await supabase
            .from("google_business_locations")
            .update({ is_selected: true })
            .eq("id", locationId);

        if (updateError) {
            console.error("Update location error:", updateError);
            return NextResponse.json(
                { error: "Failed to select location" },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Select location error:", error);
        return NextResponse.json(
            { error: "Failed to select location" },
            { status: 500 }
        );
    }
}

/**
 * POST - Sincronizar ubicaciones desde Google
 */
export async function POST() {
    if (!googleBusinessEnabled) {
        return NextResponse.json({ error: "Google Business disabled" }, { status: 404 });
    }

    try {
        const supabase = await getSupabaseClient();

        // Verificar usuario
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Obtener website
        const website = await getWebsiteForUser(supabase, user.id);

        if (!website) {
            return NextResponse.json({ error: "No website found" }, { status: 404 });
        }

        // Obtener cuenta de Google Business
        const { data: socialAccount } = await supabase
            .from("social_accounts")
            .select("id, access_token, refresh_token, token_expires_at")
            .eq("website_id", website.id)
            .eq("platform", "google_business")
            .single();

        if (!socialAccount) {
            return NextResponse.json(
                { error: "No Google Business account connected" },
                { status: 404 }
            );
        }

        // Obtener token válido
        let accessToken: string;
        try {
            accessToken = await getValidAccessToken(supabase, socialAccount);
        } catch (error) {
            console.error("Get access token error:", error);
            return NextResponse.json(
                { error: "Failed to get access token" },
                { status: 401 }
            );
        }

        // Obtener ubicaciones actuales para preservar is_selected
        const { data: currentLocations } = await supabase
            .from("google_business_locations")
            .select("location_name, is_selected")
            .eq("social_account_id", socialAccount.id);

        const selectedMap = new Map(
            (currentLocations || []).map((l) => [l.location_name, l.is_selected])
        );

        // Eliminar ubicaciones antiguas
        await supabase
            .from("google_business_locations")
            .delete()
            .eq("social_account_id", socialAccount.id);

        // Sincronizar nuevas ubicaciones
        let accounts;
        try {
            accounts = await listAccounts(accessToken);
        } catch (error) {
            if (error instanceof GoogleApiError && error.status === 401) {
                accessToken = await getValidAccessToken(supabase, socialAccount, true);
                accounts = await listAccounts(accessToken);
            } else {
                throw error;
            }
        }
        let newLocations = [];

        for (const account of accounts) {
            const locations = await listLocations(accessToken, account.name);

            for (const location of locations) {
                const isSelected = selectedMap.get(location.name) || false;

                const { data: newLocation } = await supabase
                    .from("google_business_locations")
                    .insert({
                        social_account_id: socialAccount.id,
                        account_name: account.name,
                        location_name: location.name,
                        title: location.title,
                        address: formatAddress(location),
                        phone: location.phoneNumbers?.primaryPhone || null,
                        website_url: location.websiteUri || null,
                        is_verified: location.metadata?.hasGoogleUpdated || false,
                        is_selected: isSelected,
                        metadata: location.metadata || {},
                    })
                    .select()
                    .single();

                if (newLocation) {
                    newLocations.push(newLocation);
                }
            }
        }

        return NextResponse.json({
            success: true,
            locations: newLocations,
        });
    } catch (error) {
        console.error("Sync locations error:", error);
        if (error instanceof GoogleApiError) {
            return NextResponse.json(
                { error: error.message, detail: error.body },
                { status: error.status }
            );
        }
        return NextResponse.json(
            { error: "Failed to sync locations" },
            { status: 500 }
        );
    }
}
